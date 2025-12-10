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

const safeParseJSON = (v) => {
    if (!v) return {}
    if (typeof v === 'object') return v
    try {
        return JSON.parse(v)
    } catch (e) {
        try {
            const cleaned = String(v).replace(/\\"/g, '"').replace(/'/g, '"')
            return JSON.parse(cleaned)
        } catch (e2) {
            return {}
        }
    }
}

function convertLocalToUtcString(localString) {
    if (!localString) return null
    const dateWithSeconds = `${localString}:00`
    const date = new Date(dateWithSeconds)
    if (isNaN(date.getTime())) return null
    return date.toISOString().slice(0, 19) + 'Z'
}

const safeBase64Decode = (str) => {
    if (!str || typeof str !== 'string' || str.length % 4 !== 0) return str;

    const isBase64 = /^[A-Za-z0-9+/=]+$/.test(str);
    if (!isBase64) return str;

    try {
        return decodeURIComponent(atob(str).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
    } catch (e) {
        console.error("Base64 decode error:", e);
        return str;
    }
}

const FullScreenModal = ({ open, title, onClose, children }) => {
    if (!open) return null
    return (
        <div className={styles.fullscreenOverlay} role="dialog" aria-modal="true">
            <div className={styles.fullscreenCard}>
                {title && <div className={styles.modalHeader}><h3>{title}</h3></div>}
                <div className={styles.fullscreenBody}>{children}</div>
            </div>
        </div>
    )
}

const InterestsSelector = ({ available = [], selectedIds = [], onChange, defaultIds }) => {
    const normalizedAvailable = useMemo(() => (
        Array.isArray(available) ? available.map(it => ({ ...it, id: Number(it.id) })) : []
    ), [available])

    const defaults = useMemo(() => {
        if (Array.isArray(defaultIds) && defaultIds.length) return defaultIds.map(Number)
        return normalizedAvailable.filter(a => a.is_default).map(a => Number(a.id))
    }, [normalizedAvailable, defaultIds])

    const selectedNums = useMemo(() => Array.from(new Set((selectedIds || []).map(Number).filter(Boolean))), [selectedIds])

    const mergedSelected = useMemo(() => {
        const set = new Set([...defaults, ...selectedNums])
        return Array.from(set)
    }, [defaults, selectedNums])

    const toggle = (id) => {
        id = Number(id)
        if (mergedSelected.includes(id)) {
            if (defaults.includes(id)) return // Запрещаем снять дефолтные
            const next = mergedSelected.filter(i => i !== id)
            onChange?.(next)
        } else {
            onChange?.([...mergedSelected, id])
        }
    }

    return (
        <div className={styles.interestsGrid}>
            {normalizedAvailable.map(it => (
                <button
                    key={it.id}
                    type="button"
                    className={`${styles.tag} ${mergedSelected.includes(it.id) ? styles.tagActive : ''}`}
                    onClick={() => toggle(it.id)}
                    aria-pressed={mergedSelected.includes(it.id)}
                    title={it.name}
                >
                    {it.name}
                </button>
            ))}
        </div>
    )
}

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
        onSelectPlace?.({ address, latitude: lat, longitude: lon, raw: place })
        setQ(address)
        setSuggestions([])
    }

    const useMyLocation = () => {
        if (!navigator.geolocation) return alert('Геолокация не поддерживается')
        navigator.geolocation.getCurrentPosition(async (pos) => {
            const { latitude, longitude } = pos.coords
            try {
                const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
                const res = await fetch(url)
                const json = await res.json()
                const address = json.display_name || `${latitude}, ${longitude}`
                onSelectPlace?.({ address, latitude, longitude, raw: json })
                setQ(address)
                setSuggestions([])
            } catch (e) {
                console.error(e)
                onSelectPlace?.({ address: `${latitude}, ${longitude}`, latitude, longitude })
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

const EditProfileModal = ({ open, onClose, user, interests = [], onSave }) => {
    const [form, setForm] = useState({
        username: '',
        age: '',
        city: '',
        bio: '',
        avatarUrl: '',
        interestIds: [],
        preferences: { language: 'ru' }
    })

    useEffect(() => {
        if (!open) return

        const prefs = safeParseJSON(user?.preferences)
        const language = prefs?.language || 'ru'
        const interestIds = Array.isArray(user?.interestIds) ? user.interestIds.map(Number) : []

        // eslint-disable-next-line react-hooks/set-state-in-effect
        setForm({
            username: user?.username || '',
            age: user?.age ?? '',
            city: user?.city || '',
            bio: user?.bio || '',
            avatarUrl: safeBase64Decode(user?.avatarUrl) || user?.avatarUrl || '', // 💡 Декодируем для отображения в поле ввода
            interestIds: interestIds.length
                ? interestIds
                : (interests.filter(i => i.is_default).map(i => Number(i.id)) || []),
            preferences: { ...prefs, language }
        })
    }, [user, open, interests])

    const handleInputChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

    const handleLanguageChange = (e) => {
        const newLanguage = e.target.value
        setForm(prev => ({ ...prev, preferences: { ...prev.preferences, language: newLanguage } }))
    }

    const handleSave = async () => {
        try {
            const payload = {
                username: form.username,
                age: Number(form.age) || 0,
                city: form.city,
                bio: form.bio,
                avatarUrl: form.avatarUrl,
                interestIds: (form.interestIds || []).map(Number),
                preferences: { language: form.preferences?.language || 'ru' }
            }
            await onSave(payload)
            onClose()
        } catch (e) {
            alert('Ошибка при сохранении: ' + (e.message || e))
        }
    }

    if (!open) return null

    return (
        <FullScreenModal open={open} title="Редактировать профиль" onClose={onClose}>
            <div className={styles.formGrid}>
                <label className={styles.label}>
                    URL Аватара (если сервер требует Base64, он закодирует этот URL)
                    <input
                        className={styles.input}
                        value={form.avatarUrl}
                        onChange={e => handleInputChange('avatarUrl', e.target.value)}
                    />
                </label>

                <label className={styles.label}>
                    Имя
                    <input className={styles.input} value={form.username} onChange={e => handleInputChange('username', e.target.value)} />
                </label>

                <label className={styles.label}>
                    Возраст
                    <input className={styles.input} type="number" value={form.age} onChange={e => handleInputChange('age', e.target.value)} />
                </label>

                <label className={styles.label}>
                    Город
                    <input className={styles.input} value={form.city} onChange={e => handleInputChange('city', e.target.value)} />
                </label>

                <label className={styles.label}>
                    О себе
                    <textarea className={styles.input} rows={4} value={form.bio} onChange={e => handleInputChange('bio', e.target.value)} />
                </label>

                <div className={styles.label}>
                    Предпочитаемый язык
                    <div className={styles.row}>
                        <select className={styles.input} value={form.preferences.language || 'ru'} onChange={handleLanguageChange}>
                            <option value="ru">Русский</option>
                            <option value="en">English</option>
                        </select>
                    </div>
                </div>

                <div className={styles.label}>
                    Интересы
                    <InterestsSelector
                        available={interests}
                        selectedIds={form.interestIds}
                        onChange={(ids) => setForm(prev=>({...prev, interestIds: ids}))}
                    />
                </div>

                <div className={styles.modalActions}>
                    <button className={styles.btnPrimary} onClick={handleSave}>Сохранить</button>
                    <button className={styles.btnGhost} onClick={onClose}>Отмена</button>
                </div>
            </div>
        </FullScreenModal>
    )
}

const CreateEventModal = ({ open, onClose, interests = [], onCreate }) => {
    const [form, setForm] = useState({ name: '', description: '', city: '', address: '', latitude: null, longitude: null, startTime: '', endTime: '', maxParticipants: 10, accessType: 'public', interests: [], ageRestriction: 0, price: 0, requirements: '' })

    // eslint-disable-next-line react-hooks/set-state-in-effect
    useEffect(() => { if (!open) setForm({ name: '', description: '', city: '', address: '', latitude: null, longitude: null, startTime: '', endTime: '', maxParticipants: 10, accessType: 'public', interests: [], ageRestriction: 0, price: 0, requirements: '' }) }, [open])

    const handleAddressSelect = ({ address, latitude, longitude }) => setForm(prev => ({ ...prev, address, latitude, longitude }))

    const submit = async () => {
        try {
            const start = new Date(form.startTime).getTime();
            const end = new Date(form.endTime).getTime();

            if (!form.startTime || !form.endTime) {
                alert('Пожалуйста, укажите и начало, и конец мероприятия.');
                return;
            }

            if (start >= end) {
                alert('Ошибка: Время начала мероприятия должно быть раньше времени его окончания.');
                return;
            }

            const payload = {
                name: form.name,
                description: form.description,
                city: form.city,
                address: form.address,
                latitude: Number(form.latitude) || null,
                longitude: Number(form.longitude) || null,
                startTime: convertLocalToUtcString(form.startTime),
                endTime: convertLocalToUtcString(form.endTime),
                maxParticipants: Number(form.maxParticipants) || 10,
                accessType: form.accessType,
                interests: (form.interests||[]).map(Number),
                ageRestriction: Number(form.ageRestriction) || 0,
                price: Number(form.price) || 0,
                requirements: form.requirements
            }
            await onCreate(payload)
            onClose()
        } catch (e) { alert('Ошибка создания: ' + (e.message || e)) }
    }

    if (!open) return null
    return (
        <FullScreenModal open={open} title="Создать мероприятие" onClose={onClose}>
            <div className={styles.formGrid}>
                <label className={styles.label}>Название<input className={styles.input} value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></label>
                <label className={styles.label}>Описание<textarea className={styles.input} rows={4} value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></label>
                <label className={styles.label}>Город<input className={styles.input} value={form.city} onChange={e => setForm({...form, city: e.target.value})} /></label>

                <label className={styles.label}>
                    Адрес
                    <AddressAutocomplete value={form.address} onChangeAddress={(v)=>setForm({...form, address:v})} onSelectPlace={handleAddressSelect} />
                </label>

                {form.latitude && form.longitude && (
                    <div className={styles.mapPreview}>
                        <iframe title="map" className={styles.mapIframe} src={`https://www.openstreetmap.org/export/embed.html?marker=${form.latitude}%2C${form.longitude}&layer=mapnik`} />
                        <div className={styles.tinyText}>lat: {Number(form.latitude).toFixed(5)}, lon: {Number(form.longitude).toFixed(5)}</div>
                    </div>
                )}

                <label className={styles.label}>Начало<input className={styles.input} type="datetime-local" value={form.startTime} onChange={e => setForm({...form, startTime: e.target.value})} /></label>
                <label className={styles.label}>Конец<input className={styles.input} type="datetime-local" value={form.endTime} onChange={e => setForm({...form, endTime: e.target.value})} /></label>

                <div className={styles.label}>
                    Интересы
                    <InterestsSelector available={interests} selectedIds={form.interests} onChange={(ids)=>setForm({...form, interests: ids})} />
                </div>

                <label className={styles.label}>Требования<input className={styles.input} value={form.requirements} onChange={e => setForm({...form, requirements: e.target.value})} /></label>

                <div className={styles.fullActions}>
                    <button className={styles.btnPrimary} onClick={onClose}>Отменить</button>
                    <button className={styles.btnPrimary} onClick={submit}>Создать мероприятие</button>
                </div>
            </div>
        </FullScreenModal>
    )
}

const CreateGroupModal = ({ open, onClose, interests = [], onCreate }) => {
    const [form, setForm] = useState({ type: 'PUBLIC', name: '', description: '', avatarUrl: '', maxMembers: 100, interests: [] })

    // eslint-disable-next-line react-hooks/set-state-in-effect
    useEffect(() => { if (!open) setForm({ type: 'PUBLIC', name: '', description: '', avatarUrl: '', maxMembers: 100, interests: [] }) }, [open])

    const submit = async () => {
        try {
            const payload = {
                ...form,
                maxMembers: Number(form.maxMembers) || 100,
                interests: (form.interests||[]).map(Number),
                isActive: true
            }
            await onCreate(payload)
            onClose()
        } catch (e) { alert('Ошибка создания: ' + (e.message || e)) }
    }

    if (!open) return null
    return (
        <FullScreenModal open={open} title="Создать группу" onClose={onClose}>
            <div className={styles.formGrid}>
                <label className={styles.label}>Название<input className={styles.input} value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></label>
                <label className={styles.label}>Описание<textarea className={styles.input} rows={4} value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></label>
                <label className={styles.label}>Изображение (URL)<input className={styles.input} value={form.avatarUrl} onChange={e => setForm({...form, avatarUrl: e.target.value})} /></label>

                <label className={styles.label}>
                    Тип
                    <select className={styles.input} value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                        <option value="PUBLIC">public</option>
                        <option value="PRIVATE">private</option>
                        <option value="DIRECT">direct</option>
                    </select>
                </label>

                <label className={styles.other}>
                    Максимум участников
                    <input className={styles.input} type="number" value={form.maxMembers} onChange={e => setForm({...form, maxMembers: e.target.value})} />
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

export default function ProfilePage() {
    const [user, setUser] = useState(null)
    const [interestsList, setInterestsList] = useState([])
    const [loading, setLoading] = useState(true)
    const [editOpen, setEditOpen] = useState(false)
    const [groupOpen, setGroupOpen] = useState(false)
    const [eventOpen, setEventOpen] = useState(false)
    const [avatarKey, setAvatarKey] = useState(Date.now()); // Ключ для принудительного обновления кэша аватара


    useEffect(() => {
        let mounted = true
        const load = async () => {
            setLoading(true)
            try {
                const token = localStorage.getItem('user_id')
                if (!token) throw new Error('Token not found')

                const userRes = await fetch(`http://localhost:8002/api/v1/users/me`, { method: 'GET', headers: { 'Content-Type': 'application/json', 'Authorization': token } })
                const u = await userRes.json()

                const response = await fetch('http://localhost:8001/api/v1/interests', { method: 'GET', headers: { 'Content-Type': 'application/json', 'Authorization': token } })
                const ints = await response.json()

                if (!mounted) return

                const normalized = Array.isArray(ints) ? ints.map((it, idx) => {
                    if (typeof it === 'string') return { id: idx + 1, name: it }
                    return { ...it, id: Number(it.id), name: it.name }
                }) : []

                setUser(u)
                setInterestsList(normalized)

                // Обновляем ключ при загрузке данных
                if (u?.avatarUrl) {
                    setAvatarKey(Date.now());
                }

            } catch (e) {
                console.error('load error', e)
                setUser({ userId: 0, username: 'Гость (ошибка)', avatarUrl: '', age: 0, city: '', bio: '', interestIds: [] })
            } finally {
                if (mounted) setLoading(false)
            }
        }

        if (localStorage.getItem('user_id')) load()
        else { console.warn('Токен авторизации отсутствует в localStorage.'); setLoading(false) }

        return () => { mounted = false }
    }, [])

    const handleSaveProfile = useCallback(async (patchBody) => {
        const res = await fetch('http://localhost:8002/api/v1/users/me', {
            method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: localStorage.getItem('user_id') }, body: JSON.stringify(patchBody)
        })
        if (!res.ok) {
            const txt = await res.text()
            throw new Error(txt || `Ошибка ${res.status}`)
        }
        const updated = await res.json()
        setUser(updated)

        if (updated.avatarUrl) {
            setAvatarKey(Date.now());
        }
    }, [])

    const handleCreateEvent = useCallback(async (eventBody) => {
        const res = await fetch('http://localhost:8005/api/v1/events', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: localStorage.getItem('user_id')
            },
            body: JSON.stringify(eventBody)
        });

        if (!res.ok) {
            const txt = await res.text();
            console.error("Ошибка при создании мероприятия:", txt);
            throw new Error(txt || `Ошибка ${res.status}`);
        }

        const created = await res.json();
        alert('Создано: ' + (created.name || created.id || 'успешно'));
        return created;
    }, []);

    const handleCreateGroup = useCallback(async (eventBody) => {
        const payload = { type: eventBody.type || 'PUBLIC', name: eventBody.name, description: eventBody.description, avatarUrl: eventBody.avatarUrl, maxMembers: Number(eventBody.maxMembers) || 100, interests: eventBody.interests || [], isActive: true }
        const res = await fetch('http://localhost:8003/api/v1/groups', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: localStorage.getItem('user_id') }, body: JSON.stringify(payload) })
        if (!res.ok) { const txt = await res.text(); throw new Error(txt || `Ошибка ${res.status}`) }
        const created = await res.json()
        alert('Создано: ' + (created.name || created.id || 'успешно'))
        return created
    }, [])

    const handleLogout = () => { localStorage.removeItem('user_id'); window.location.href = '/auth' }

    if (loading) return <div className={styles.root}><div className={styles.center}>Загрузка профиля…</div></div>

    const interestNameById = (id) => {
        const it = interestsList.find(i => Number(i.id) === Number(id))
        return it ? it.name : `#${id}`
    }

    const displayLanguage = (() => {
        const prefs = safeParseJSON(user?.preferences)
        return prefs?.language === 'en' ? 'English' : 'Русский'
    })()

    const defaultAvatarUrl = 'https://avatars.mds.yandex.net/i?id=cc7896daa9232bd32dd4f9ac0d2c9b951655c0f2-9181226-images-thumbs&n=13';

    let decodedAvatarUrl = safeBase64Decode(user?.avatarUrl);

    const currentAvatarUrl = decodedAvatarUrl || user?.avatarUrl || defaultAvatarUrl;

    const finalAvatarSrc = currentAvatarUrl === defaultAvatarUrl || currentAvatarUrl.includes('yandex.net')
        ? currentAvatarUrl
        : `${currentAvatarUrl}?v=${avatarKey}`;


    return (
        <div className={styles.root}>
            <div className={styles.headerBar}>
                <div className={styles.headerLeft}>
                    <img className={styles.avatar} src={finalAvatarSrc} alt="avatar" />
                    <div>
                        <div className={styles.username}>{user?.username || 'Мое имя'}</div>
                        <div className={styles.sub}>{(user?.city || 'Москва')} · {(user?.age ?? 18) + ' лет'}</div>
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
                                {Array.isArray(user?.interestIds) && user.interestIds.length ? (
                                    user.interestIds.map(id => <span key={id} className={styles.tag}>{interestNameById(id)}</span>)
                                ) : (
                                    <span className={styles.tag}>—</span>
                                )}
                            </div>
                        </div>

                        <div>
                            <div className={styles.smallLabel}>Предпочтения</div>
                            <div className={styles.prefBox}>Язык: {displayLanguage}</div>
                        </div>
                    </div>
                </section>

                <section className={styles.card}>
                    <h2 className={styles.cardTitle}>Активность</h2>
                    <div className={styles.tinyText}>
                        Рейтинг: {
                        user?.rating
                            ? user.rating
                            : Math.floor(Math.random() * 5) + 1
                    }
                    </div>
                    <div className={styles.tinyText}>Создан: {user?.createdAt ? new Date(user.createdAt).toLocaleString() : '—'}</div>
                </section>

                <div className={styles.headerRight}>
                    <button className={styles.btn} onClick={() => setEditOpen(true)}>Редактировать профиль</button>
                    <button className={styles.btn} onClick={() => setGroupOpen(true)}>Создать группу</button>
                    <button className={styles.btn} onClick={() => setEventOpen(true)}>Создать мероприятие</button>
                    <button className={styles.btnDanger} onClick={handleLogout}>Выйти</button>
                </div>
            </main>

            <EditProfileModal open={editOpen} onClose={() => setEditOpen(false)} user={user} interests={interestsList} onSave={handleSaveProfile} />
            <CreateGroupModal open={groupOpen} onClose={() => setGroupOpen(false)} interests={interestsList} onCreate={handleCreateGroup} />
            <CreateEventModal open={eventOpen} onClose={() => setEventOpen(false)} interests={interestsList} onCreate={handleCreateEvent} />
        </div>
    )
}