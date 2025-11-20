'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import styles from './list.module.css';

export default function ListView({ events }) {
    const router = useRouter();
    const [searchCity, setSearchCity] = useState('');
    const [searchName, setSearchName] = useState('');
    const [filterDate, setFilterDate] = useState('');

    const filteredEvents = useMemo(() => {
        return events.filter(event => {
            const matchesCity = event.city.toLowerCase().includes(searchCity.trim().toLowerCase());
            const matchesName = event.name.toLowerCase().includes(searchName.trim().toLowerCase());

            let matchesDate = true;
            if (filterDate) {
                const eventDate = new Date(event.startTime);
                const [year, month, day] = filterDate.split('-').map(Number);
                matchesDate = eventDate.getUTCFullYear() === year &&
                    eventDate.getUTCMonth() + 1 === month &&
                    eventDate.getUTCDate() === day;
            }

            return matchesCity && matchesName && matchesDate;
        });
    }, [events, searchCity, searchName, filterDate]);


    const navigateToGroupPage = (event) => {
        router.push(`/event/${event.eventId}`);
    };

    return (
        <div className={styles.listViewContainer}>
            <div className={styles.filters}>
                <input
                    type="text"
                    placeholder="Поиск по городу"
                    value={searchCity}
                    onChange={(e) => setSearchCity(e.target.value)}
                    className={styles.input}
                />
                <input
                    type="text"
                    placeholder="Поиск по названию"
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value)}
                    className={styles.input}
                />
                <input
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className={styles.input}
                />
            </div>

            <div className={styles.eventList}>
                {filteredEvents.map(event => (
                    <div
                        key={event.eventId}
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
                            <p className={styles.cardCity}>Город: {event.city}</p>
                            <p className={styles.cardDate}>
                                {new Date(event.startTime).toLocaleDateString()}{" "}
                                {new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })}
                            </p>
                            <p className={styles.cardDetails}>
                                {(event.description || '').substring(0, 80)}
                                {event.description && event.description.length > 80 ? '...' : ''}
                            </p>
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
