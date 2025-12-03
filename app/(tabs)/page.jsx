'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import styles from "@/app/(tabs)/events/list.module.css";

const fallbackEvents = {
    items: [
        {
            eventId: 1,
            name: "Концерт в парке",
            description: "Красивое выступление в ЦПКиО имени Горького.",
            imageUrl: "",
            city: "Москва",
            address: "ЦПКиО им. Горького",
            latitude: 55.7558,
            longitude: 37.6176,
            accessType: "public",
            status: "planned",
            startTime: "2025-11-20T18:00:00.000Z",
            endTime: "2025-11-20T20:00:00.000Z",
            maxParticipants: 100,
            currentParticipants: 0,
            interests: [1],
            ageRestriction: 0,
            price: 0,
            requirements: "",
            creatorId: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            eventId: 2,
            name: "IT-митап",
            description: "Встреча разработчиков по теме Next.js и React-Leaflet.",
            imageUrl: "",
            city: "Москва",
            address: "Сколково",
            latitude: 55.70,
            longitude: 37.55,
            accessType: "public",
            status: "planned",
            startTime: "2025-11-21T18:00:00.000Z",
            endTime: "2025-11-21T20:00:00.000Z",
            maxParticipants: 50,
            currentParticipants: 0,
            interests: [2],
            ageRestriction: 18,
            price: 0,
            requirements: "Регистрация",
            creatorId: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            eventId: 3,
            name: "Кинопоказ",
            description: "Открытый показ классики в Сокольниках.",
            imageUrl: "",
            city: "Москва",
            address: "Сокольники",
            latitude: 55.80,
            longitude: 37.75,
            accessType: "public",
            status: "planned",
            startTime: "2025-11-22T18:00:00.000Z",
            endTime: "2025-11-22T20:00:00.000Z",
            maxParticipants: 150,
            currentParticipants: 0,
            interests: [3],
            ageRestriction: 0,
            price: 0,
            requirements: "",
            creatorId: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
        {
            eventId: 4,
            name: "Фестиваль еды",
            description: "Гастрономическое событие на Красной площади.",
            imageUrl: "",
            city: "Москва",
            address: "Красная площадь",
            latitude: 55.76,
            longitude: 37.60,
            accessType: "public",
            status: "planned",
            startTime: "2025-11-23T12:00:00.000Z",
            endTime: "2025-11-23T18:00:00.000Z",
            maxParticipants: 200,
            currentParticipants: 0,
            interests: [4],
            ageRestriction: 0,
            price: 0,
            requirements: "",
            creatorId: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        },
    ],
    pagination: {
        limit: 10,
        offset: 0,
        total: 4
    }
};

export default function EventsPage() {
    const router = useRouter();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [searchName, setSearchName] = useState('');
    const [searchCity, setSearchCity] = useState('');
    const [filterDate, setFilterDate] = useState('');
    const [filterAge, setFilterAge] = useState('');

    useEffect(() => {
        const fetchEvents = async () => {
            setLoading(true);
            try {
                const res = await fetch('http://localhost:8003/api/v1/groups', {
                    headers: { Authorization: localStorage.getItem('user_id') }
                });
                if (!res.ok) throw new Error('Ошибка при загрузке событий');
                const data = await res.json();
                setEvents(data.items || data);
            } catch (err) {
                console.error(err);
                setError(err.message);
                setEvents(fallbackEvents.items);
            } finally {
                setLoading(false);
            }
        };
        fetchEvents();
    }, []);

    const filteredEvents = useMemo(() => {
        return events.filter(event => {
            const matchesName = searchName
                ? (event.name ?? '').toLowerCase().includes(searchName.trim().toLowerCase())
                : true;

            const matchesCity = searchCity
                ? (event.city ?? '').toLowerCase().includes(searchCity.trim().toLowerCase())
                : true;

            const matchesDate = filterDate
                ? new Date(event.startTime ?? '').toLocaleDateString('sv-SE') === filterDate
                : true;

            const matchesAge = filterAge
                ? (event.ageRestriction ?? 0) <= parseInt(filterAge)
                : true;

            return matchesName && matchesCity && matchesDate && matchesAge;
        });
    }, [events, searchName, searchCity, filterDate, filterAge]);

    const navigateToGroupPage = (event) => {
        router.push(`/group/${event.groupId}`);
    };

    if (loading) return <p className={styles.loading}>Загрузка событий...</p>;

    return (
        <div className={styles.listViewContainer}>
            {/* Фильтры */}
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
                    type="date"
                    value={filterDate}
                    onChange={e => setFilterDate(e.target.value)}
                    className={styles.input}
                />
                <input
                    type="number"
                    min="0"
                    placeholder="Возрастное ограничение"
                    value={filterAge}
                    onChange={e => setFilterAge(e.target.value)}
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
                                {event.description?.substring(0, 80)}
                                {event.description && event.description.length > 80 ? '...' : ''}
                            </p>
                            <p className={styles.cardCity}>Город: {event.city}</p>
                            <p className={styles.cardDate}>
                                {new Date(event.startTime).toLocaleDateString()}{" "}
                                {new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })}
                            </p>
                            {event.ageRestriction > 0 && <p><strong>Возраст:</strong> {event.ageRestriction}+</p>}
                        </div>
                        <button
                            className={styles.cardButton}
                            onClick={(e) => { e.stopPropagation(); navigateToGroupPage(event); }}
                        >
                            Подробнее
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
