'use client'

import React, { useEffect, useState, useCallback, useMemo } from 'react'
import styles from './style.module.css'

const debounce = (fn, ms = 300) => {
    let t
    return (...args) => {
        clearTimeout(t)
        t = setTimeout(() => fn(...args), ms)
    }
}

const InterestsSelector = ({
                               available,
                               selectedIds = [],
                               onChange
                           }) => {

    const defaultPicks = ["Шахматы", "Шашки"];

    const mergedSelected = Array.from(new Set([...defaultPicks, ...selectedIds]));

    const toggle = (id) => {
        if (mergedSelected.includes(id)) {
            // запрещаем снять дефолтные
            if (defaultPicks.includes(id)) return;
            onChange(mergedSelected.filter(i => i !== id));
        } else {
            onChange([...mergedSelected, id]);
        }
    };

    return (
        <div className={styles.interestsGrid}>
            {available.map(it => (
                <button
                    key={it.id}
                    type="button"
                    className={`${styles.tag} ${mergedSelected.includes(it.id) ? styles.tagActive : ''}`}
                    onClick={() => toggle(it.id)}
                    aria-pressed={mergedSelected.includes(it.id)}
                >
                    {it.name}
                </button>
            ))}
        </div>
    )
};

/* ---------- Address autocomplete using Nominatim ---------- */
const AddressAutocomplete = ({ value, onChangeAddress, onSelectPlace }) => {
    const [q, setQ] = useState(value || '')
    const [suggestions, setSuggestions] = useState([])
    const [loading, setLoading] = useState(false)

    const doSearch = useMemo(() => debounce(async (text) => {
        if (!text) {
            setSuggestions([])
            return
        }
        setLoading(true)
        try {
            const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(text)}&limit=6`
            const res = await fetch(url, { headers: { 'Accept-Language': 'ru' } })
            const json = await res.json()
            setSuggestions(json)
        } catch (e) {
            console.error('Addr search error', e)
            setSuggestions([])
        } finally {
            setLoading(false)
        }
    }, 350), [])

    useEffect(() => {
        doSearch(q)
    }, [q, doSearch])

    const handleSelect = (place) => {
        const address = place.display_name
        const lat = parseFloat(place.lat)
        const lon = parseFloat(place.lon)
        onSelectPlace({ address, latitude: lat, longitude: lon, raw: place })
        setQ(address)
        setSuggestions([])
    }

    const useMyLocation = () => {
        if (!navigator.geolocation) return alert('Геолокация не поддерживается')
        navigator.geolocation.getCurrentPosition(async (pos) => {
            const { latitude, longitude } = pos.coords
            // reverse geocode
            try {
                const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
                const res = await fetch(url)
                const json = await res.json()
                const address = json.display_name || `${latitude}, ${longitude}`
                onSelectPlace({ address, latitude, longitude, raw: json })
                setQ(address)
                setSuggestions([])
            } catch (e) {
                console.error(e)
                onSelectPlace({ address: `${latitude}, ${longitude}`, latitude, longitude })
                setQ(`${latitude}, ${longitude}`)
            }
        }, (err) => {
            alert('Не удалось получить позицию: ' + (err.message || err.code))
        })
    }

    return (
        <div className={styles.addressWrap}>
            <input
                className={styles.input}
                placeholder="Начните вводить адрес..."
                value={q}
                onChange={(e) => { setQ(e.target.value); onChangeAddress?.(e.target.value) }}
            />
            <div className={styles.addressActions}>
                <button type="button" className={styles.smallBtn} onClick={useMyLocation}>Использовать моё местоположение</button>
                {loading && <div className={styles.tinyText}>Поиск…</div>}
            </div>

            {suggestions.length > 0 && (
                <ul className={styles.suggestions}>
                    {suggestions.map(s => (
                        <li key={s.place_id} className={styles.suggestion} onClick={() => handleSelect(s)}>
                            <div className={styles.suggestionTitle}>{s.display_name}</div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}

const EditProfileModal = ({ open, onClose, user, interests, onSave }) => {
    const [form, setForm] = useState({
        username: '',
        age: '',
        city: '',
        bio: '',
        interestIds: ['Шахматы', 'Шашки'],
        preferences: { language: 'ru' }
    })

    useEffect(() => {
        if (user) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setForm({
                username: user.username || '',
                age: user.age ?? '',
                city: user.city || '',
                bio: user.bio || '',
                interestIds: user.interestIds ? [...user.interestIds] : [1],
                preferences: user.preferences || { language: 'ru' }
            })
        }
    }, [user, open])

    if (!open) return null

    const handleSave = async () => {
        try {
            await onSave({
                username: form.username,
                age: Number(form.age) || 0,
                city: form.city,
                bio: form.bio,
                interestIds: form.interestIds,
                preferences: form.preferences
            })
            onClose()
        } catch (e) {
            alert('Ошибка при сохранении: ' + (e.message || e))
        }
    }

    return (
        <FullScreenModal open={open} onClose={onClose}>
                <h3 className={styles.modalTitle}>Редактировать профиль</h3>

                <label className={styles.label}>
                    Имя
                    <input className={styles.input} value={form.username} onChange={e => setForm({...form, username: e.target.value})} />
                </label>

                <label className={styles.label}>
                    Возраст
                    <input style={{marginLeft: '20px'}} className={styles.input} type="number" value={form.age} onChange={e => setForm({...form, age: e.target.value})} />
                </label>

                <label className={styles.label}>
                    Город
                    <input className={styles.input} value={form.city} onChange={e => setForm({...form, city: e.target.value})} />
                </label>

                <label className={styles.label}>
                    О себе
                    <textarea className={styles.input} rows={4} value={form.bio} onChange={e => setForm({...form, bio: e.target.value})} />
                </label>

                <div className={styles.label}>
                    Предпочитаемый язык
                    <div className={styles.row}>
                        <select className={styles.input} value={form.preferences.language || 'ru'} onChange={e => setForm({...form, preferences: {...form.preferences, language: e.target.value}})}>
                            <option value="ru">Русский</option>
                            <option value="en">English</option>
                        </select>
                    </div>
                </div>

                <div className={styles.label}>
                    Интересы
                    <InterestsSelector available={interests} selectedIds={form.interestIds} onChange={(ids) => setForm({...form, interestIds: ids})} />
                </div>

                <div className={styles.modalActions}>
                    <button className={styles.btnPrimary} onClick={handleSave}>Сохранить</button>
                    <button className={styles.btnGhost} onClick={onClose}>Отмена</button>
                </div>
        </FullScreenModal>
    )
}

const FullScreenModal = ({ open, title, onClose, children, onSubmitLabel = 'Создать' }) => {
    if (!open) return null
    return (
        <div className={styles.fullscreenOverlay}>
            <div className={styles.fullscreenCard}>
                <div className={styles.fullscreenBody}>{children}</div>
            </div>
        </div>
    )
}

function convertLocalToUtcString(localString) {
    if (!localString) return null;
    const dateWithSeconds = `${localString}:00`;
    const date = new Date(dateWithSeconds);
    return date.toISOString().slice(0, 19) + 'Z';
}

const CreateGroupModal = ({ open, onClose, interests, onCreate }) => {
    const [form, setForm] = useState({
        type: 'LONG_TURM',
        name: '',
        description: '',
        imageUrl: '',
        accessType: 'public',
        latitude: null,
        longitude: null,
        startTime: '',
        endTime: '',
        address: '',
        maxParticipants: 10,
        interests: [],
        ageRestriction: 0,
        price: 0
    })

    const handleAddressSelect = ({ address, latitude, longitude }) => {
        setForm(prev => ({ ...prev, address, latitude, longitude }))
    }

    const submit = async () => {
        try {
            const utcStartTime = convertLocalToUtcString(form.startTime)
            const utcEndTime = convertLocalToUtcString(form.endTime)

            const body = {
                ...form,
                startTime: utcStartTime,
                endTime: utcEndTime,

                latitude: Number(form.latitude),
                longitude: Number(form.longitude),
                maxParticipants: Number(form.maxParticipants),
                ageRestriction: Number(form.ageRestriction),
                price: Number(form.price),
                interests: (form.interests || []).map(i => Number(i))
            }

            await onCreate(body)
            onClose()
        } catch (e) {
            alert('Ошибка создания: ' + (e.message || e))
        }
    }
    return (
        <FullScreenModal open={open} title="Создать группу" onClose={onClose}>
            <div className={styles.formGrid}>
                <label className={styles.label}>
                    Название
                    <input className={styles.input} value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                </label>

                <label className={styles.label}>
                    Описание
                    <textarea className={styles.input} rows={4} value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
                </label>

                <label className={styles.label}>
                    Изображение (URL)
                    <input className={styles.input} value={form.imageUrl} onChange={e => setForm({...form, imageUrl: e.target.value})} />
                </label>

                <label className={styles.label}>
                    Тип доступа
                    <select className={styles.input} value={form.accessType} onChange={e => setForm({...form, accessType: e.target.value})}>
                        <option value="public">public</option>
                        <option value="private">private</option>
                    </select>
                </label>

                <label className={styles.label}>
                    Время начала
                    <input className={styles.input} type="datetime-local" value={form.startTime} onChange={e => setForm({...form, startTime: e.target.value})} />
                </label>

                <label className={styles.label}>
                    Время окончания
                    <input className={styles.input} type="datetime-local" value={form.endTime} onChange={e => setForm({...form, endTime: e.target.value})} />
                </label>

                <label className={styles.label}>
                    Адрес
                    <AddressAutocomplete value={form.address} onChangeAddress={(v)=>setForm({...form, address:v})} onSelectPlace={handleAddressSelect} />
                </label>

                {form.latitude && form.longitude && (
                    <div className={styles.mapPreview}>
                        <iframe
                            title="map"
                            className={styles.mapIframe}
                            src={`https://www.openstreetmap.org/export/embed.html?marker=${form.latitude}%2C${form.longitude}&layer=mapnik`}
                        />
                    </div>
                )}

                <label className={styles.other}>
                    Максимум участников
                    <input className={styles.input} type="number" value={form.maxParticipants} onChange={e => setForm({...form, maxParticipants: e.target.value})} />
                </label>

                <label className={styles.other}>
                    Ограничение по возрасту
                    <input className={styles.input} type="number" value={form.ageRestriction} onChange={e => setForm({...form, ageRestriction: e.target.value})} />
                </label>

                <label className={styles.other}>
                    Цена
                    <input className={styles.input} type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})} />
                </label>

                <div className={styles.label}>
                    Интересы
                    <InterestsSelector available={interests} selectedIds={form.interests} onChange={(ids)=>setForm({...form, interests: ids})} />
                </div>

                <div className={styles.fullActions}>
                    <button className={styles.btnPrimary} onClick={onClose}>Отменить</button>
                    <button className={styles.btnPrimary} onClick={submit}>Создать группу</button>
                </div>
            </div>
        </FullScreenModal>
    )
}

const CreateEventModal = ({ open, onClose, interests, onCreate }) => {
    const [form, setForm] = useState({
        name: '',
        description: '',
        city: '',
        address: '',
        latitude: null,
        longitude: null,
        startTime: '',
        endTime: '',
        maxParticipants: 10,
        accessType: 'public',
        interests: [],
        ageRestriction: 0,
        price: 0,
        requirements: ''
    })

    useEffect(() => {
        if (!open) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setForm({
                name: '',
                description: '',
                city: '',
                address: '',
                latitude: null,
                longitude: null,
                startTime: '',
                endTime: '',
                maxParticipants: 10,
                accessType: 'public',
                interests: [],
                ageRestriction: 0,
                price: 0,
                requirements: ''
            })
        }
    }, [open])

    const handleAddressSelect = ({ address, latitude, longitude }) => {
        setForm(prev => ({ ...prev, address, latitude, longitude }))
    }

    const submit = async () => {
        try {
            const body = {
                name: form.name,
                description: form.description,
                city: form.city,
                address: form.address,
                latitude: Number(form.latitude),
                longitude: Number(form.longitude),
                startTime: form.startTime,
                endTime: form.endTime,
                maxParticipants: Number(form.maxParticipants),
                accessType: form.accessType,
                interests: (form.interests || []).map(i => Number(i)),
                ageRestriction: Number(form.ageRestriction),
                price: Number(form.price),
                requirements: form.requirements
            }
            await onCreate(body)
            onClose()
        } catch (e) {
            alert('Ошибка создания: ' + (e.message || e))
        }
    }

    return (
        <FullScreenModal open={open} title="Создать мероприятие" onClose={onClose}>
            <div className={styles.formGrid}>
                <label className={styles.label}>
                    Название
                    <input className={styles.input} value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                </label>

                <label className={styles.label}>
                    Описание
                    <textarea className={styles.input} rows={4} value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
                </label>

                <label className={styles.label}>
                    Город
                    <input className={styles.input} value={form.city} onChange={e => setForm({...form, city: e.target.value})} />
                </label>

                <label className={styles.label}>
                    Адрес
                    <AddressAutocomplete value={form.address} onChangeAddress={(v)=>setForm({...form, address:v})} onSelectPlace={handleAddressSelect} />
                </label>

                {form.latitude && form.longitude && (
                    <div className={styles.mapPreview}>
                        <iframe
                            title="map"
                            className={styles.mapIframe}
                            src={`https://www.openstreetmap.org/export/embed.html?marker=${form.latitude}%2C${form.longitude}&layer=mapnik`}
                        />
                        <div className={styles.tinyText}>lat: {form.latitude.toFixed(5)}, lon: {form.longitude.toFixed(5)}</div>
                    </div>
                )}

                <label className={styles.label}>
                    Начало
                    <input className={styles.input} type="datetime-local" value={form.startTime} onChange={e => setForm({...form, startTime: e.target.value})} />
                </label>

                <label className={styles.label}>
                    Конец
                    <input className={styles.input} type="datetime-local" value={form.endTime} onChange={e => setForm({...form, endTime: e.target.value})} />
                </label>

                <div className={styles.label}>
                    Интересы
                    <InterestsSelector available={interests} selectedIds={form.interests} onChange={(ids)=>setForm({...form, interests: ids})} />
                </div>

                <label className={styles.label}>
                    Требования
                    <input className={styles.input} value={form.requirements} onChange={e => setForm({...form, requirements: e.target.value})} />
                </label>

                <div className={styles.fullActions}>
                    <button className={styles.btnPrimary} onClick={onClose}>Отменить</button>
                    <button className={styles.btnPrimary} onClick={submit}>Создать мероприятие</button>
                </div>
            </div>
        </FullScreenModal>
    )
}

export default function ProfilePage() {
    const [user, setUser] = useState(null)
    const [interestsList, setInterestsList] = useState([])
    const [loading, setLoading] = useState(true)
    const [editOpen, setEditOpen] = useState(false)
    const [groupOpen, setGroupOpen] = useState(false)
    const [eventOpen, setEventOpen] = useState(false)


    useEffect(() => {
        let mounted = true;

        const load = async () => {
            setLoading(true);

            try {
                const userRes = await fetch(`http://localhost:8002/api/v1/users/me`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': localStorage.getItem('user_id')
                    }
                });


                const u = await userRes.json();

                const response = await fetch('http://localhost:8001/api/v1/interests', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': localStorage.getItem('user_id')
                    }
                });
                const ints = await response.json();
                console.log("rdf", ints)

                if (!mounted) return;

                setUser(u);

                const normalized = Array.isArray(ints) ? ints.map(it => {
                    if (typeof it === 'string') return { id: ints.indexOf(it) + 1, name: it };
                    return it;
                }) : [];
                setInterestsList(normalized);

            } catch (e) {
                console.error('load error', e);
                setUser({
                    userId: 0,
                    username: 'Гость (ошибка)',
                    avatarUrl: '',
                    age: 0,
                    city: '',
                    bio: '',
                    interestIds: []
                });
            } finally {
                if (mounted) setLoading(false);
            }
        }

        if (localStorage.getItem('user_id')) {
            load();
        } else {
            console.warn('Токен авторизации отсутствует в localStorage.');
            setLoading(false);
        }

        return () => { mounted = false };
    }, []);

    const handleSaveProfile = useCallback(async (patchBody) => {
        const res = await fetch('http://localhost:8002/api/v1/users/me', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                Authorization: localStorage.getItem('user_id')
            },
            body: JSON.stringify(patchBody)
        })
        console.log(patchBody)
        if (!res.ok) {
            const txt = await res.text()
            throw new Error(txt || `Ошибка ${res.status}`)
        }
        const updated = await res.json()
        setUser(updated)
    }, [])

    const handleCreateEvent = useCallback(async (eventBody) => {
        const res = await fetch('http://localhost:8005/api/v1/events', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: localStorage.getItem('user_id')
            },
            body: JSON.stringify(eventBody)
        })
        console.log(eventBody)
        if (!res.ok) {
            const txt = await res.text()
            throw new Error(txt || `Ошибка ${res.status}`)
        }
        const created = await res.json()
        // простое уведомление
        alert('Создано: ' + (created.name || created.id || 'успешно'))
        return created
    }, [])

    const handleCreateGroup = useCallback(async (eventBody) => {
        const res = await fetch('http://localhost:8003/api/v1/groups', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: localStorage.getItem('user_id')
            },
            body: JSON.stringify(eventBody)
        })
        console.log(eventBody)
        if (!res.ok) {
            const txt = await res.text()
            throw new Error(txt || `Ошибка ${res.status}`)
        }
        const created = await res.json()
        // простое уведомление
        alert('Создано: ' + (created.name || created.id || 'успешно'))
        return created
    }, [])

    const handleLogout = () => {
        localStorage.removeItem('user_id')
        window.location.href = '/auth'
    }


    if (loading) {
        return <div className={styles.root}><div className={styles.center}>Загрузка профиля…</div></div>
    }
    console.log(interestsList)
    return (
        <div className={styles.root}>
            <div className={styles.headerBar}>
                <div className={styles.headerLeft}>
                    <img className={styles.avatar} src={user?.avatarUrl || 'https://avatars.mds.yandex.net/i?id=cc7896daa9232bd32dd4f9ac0d2c9b951655c0f2-9181226-images-thumbs&n=13'} alt="avatar" />
                    <div>
                        <div className={styles.username}>{user?.username || 'Мое имя'}</div>
                        <div className={styles.sub}>{user?.city || 'Москва' + ' · '}{user?.age || 18 + ' лет'}</div>
                    </div>
                </div>
            </div>

            <main className={styles.container}>
                <section className={styles.card}>
                    <h2 className={styles.cardTitle}>О себе</h2>
                    <p className={styles.bio}>{user?.bio || 'Некоторая очень важная информация обо мне и то что я люблю котиков'}</p>

                    <div className={styles.sectionRow}>
                        <div>
                            <div className={styles.smallLabel}>Интересы</div>
                            <div className={styles.tagsWrap}>
                                {(['Шахматы', 'Покемоны']).map(id => {
                                    const it = interestsList.find(i => i.id === id) || {id, name: `#${id}`}
                                    return <span key={id} className={styles.tag}>{it.name}</span>
                                })}
                            </div>
                        </div>

                        <div>
                            <div className={styles.smallLabel}>Предпочтения</div>
                            <div className={styles.prefBox}>
                                Язык: {user?.preferences?.language || 'Руссий'}
                            </div>
                        </div>
                    </div>
                </section>

                <section className={styles.card}>
                    <h2 className={styles.cardTitle}>Активность</h2>
                    <div className={styles.tinyText}>Рейтинг: {user?.rating ?? '—'}</div>
                    <div className={styles.tinyText}>Создан: {new Date(user?.createdAt).toLocaleString()}</div>
                </section>
                <div className={styles.headerRight}>
                    <button className={styles.btn} onClick={() => setEditOpen(true)}>Редактировать профиль</button>
                    <button className={styles.btn} onClick={() => setGroupOpen(true)}>Создать группу</button>
                    <button className={styles.btn} onClick={() => setEventOpen(true)}>Создать мероприятие</button>
                    <button className={styles.btnDanger} onClick={handleLogout}>Выйти</button>
                </div>
            </main>

            <EditProfileModal open={editOpen} onClose={() => setEditOpen(false)} user={user} interests={interestsList}
                              onSave={handleSaveProfile}/>
            <CreateGroupModal open={groupOpen} onClose={() => setGroupOpen(false)} interests={interestsList}
                              onCreate={handleCreateGroup}/>
            <CreateEventModal open={eventOpen} onClose={() => setEventOpen(false)} interests={interestsList}
                              onCreate={handleCreateEvent}/>
        </div>
    )
}
