'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import styles from "@/app/(tabs)/events/list.module.css";

export default function EventsPage() {
    const router = useRouter();

    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [searchName, setSearchName] = useState('');
    const [searchCity, setSearchCity] = useState('');
    const [searchInterest, setSearchInterest] = useState('');

    const [allInterests, setAllInterests] = useState([]);

    useEffect(() => {
        try {
            const raw = localStorage.getItem('interests');
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) setAllInterests(parsed);
        } catch {
            setAllInterests([]);
        }
    }, []);

    useEffect(() => {
        const fetchEvents = async () => {
            setLoading(true);
            try {
                const res = await fetch('http://localhost:8003/api/v1/groups', {
                    headers: { Authorization: localStorage.getItem('user_id') }
                });
                if (!res.ok) throw new Error('Ошибка при загрузке');
                const data = await res.json();
                setEvents(data.items || data || []);
            } catch (err) {
                setError(err.message);
                setEvents([]);
            } finally {
                setLoading(false);
            }
        };
        fetchEvents();
    }, []);

    const filteredEvents = useMemo(() => {
        return events.filter(event => {
            const matchesName = searchName
                ? (event.name ?? '').toLowerCase().includes(searchName.toLowerCase())
                : true;

            const matchesCity = searchCity
                ? (event.city ?? '').toLowerCase().includes(searchCity.toLowerCase())
                : true;

            const matchesInterest = searchInterest
                ? (event.interests || []).some(interestId => {
                    const interest = allInterests.find(
                        i => Number(i.id) === Number(interestId)
                    );
                    return interest?.name
                        ?.toLowerCase()
                        .includes(searchInterest.trim().toLowerCase());
                })
                : true;

            return matchesName && matchesCity && matchesInterest;
        });
    }, [events, searchName, searchCity, searchInterest, allInterests]);

    const navigateToGroupPage = (event) => {
        router.push(`/group/${event.groupId}`);
    };

    if (loading) return <p className={styles.loading}>Загрузка событий...</p>;
    if (error) return <p className={styles.loading}>{error}</p>;

    return (
        <div className={styles.listViewContainer}>
            <div className={styles.filters}>
                <input
                    type="text"
                    placeholder="Поиск по названию"
                    value={searchName}
                    onChange={e => setSearchName(e.target.value)}
                    className={styles.input}
                />
                <input
                    type="text"
                    placeholder="Поиск по городу"
                    value={searchCity}
                    onChange={e => setSearchCity(e.target.value)}
                    className={styles.input}
                />
                <input
                    type="text"
                    placeholder="Интересы"
                    value={searchInterest}
                    onChange={e => setSearchInterest(e.target.value)}
                    className={styles.input}
                />
            </div>

            <div className={styles.eventList}>
                {filteredEvents.map(event => (
                    <div
                        key={event.groupId}
                        className={styles.eventCard}
                        onClick={() => navigateToGroupPage(event)}
                    >
                        <img
                            src={event.imageUrl || 'https://avatars.mds.yandex.net/i?id=b4c168ff87afbf8684c309648eb46f3d02ed0e38-5031281-images-thumbs&n=13'}
                            alt={event.name}
                            className={styles.cardImage}
                        />

                        <div className={styles.cardInfo}>
                            <h3 className={styles.cardTitle}>{event.name}</h3>
                            <p className={styles.cardDetails}>
                                {event.description?.slice(0, 80)}
                                {event.description?.length > 80 && '…'}
                            </p>

                            {event.interests?.length > 0 && (
                                <div className={styles.cardInterests}>
                                    {event.interests.map(id => {
                                        const it = allInterests.find(
                                            i => Number(i.id) === Number(id)
                                        );
                                        return it ? (
                                            <span key={id} className={styles.cardInterest}>
                                                {it.icon} {it.name}
                                            </span>
                                        ) : null;
                                    })}
                                </div>
                            )}
                        </div>

                        <button
                            className={styles.cardButton}
                            onClick={(e) => {
                                e.stopPropagation();
                                navigateToGroupPage(event);
                            }}
                        >
                            Подробнее
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
