'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import ListView from './ListView';
import styles from './styles.module.css';
import useWindowSize from "@/hooks/useWindow";


const MapView = dynamic(() => import("./MapView"), {
    ssr: false,
    loading: () => <p>Загрузка карты...</p>
});

const EventDetailView = ({ event, onBack }) => (
    <div className={styles.detailCard}>
        <div className={styles.detailHeader}>
            <h2 className={styles.detailTitle}>{event.title}</h2>
            <button onClick={onBack} className={styles.backButton}>&#x2715;</button>
        </div>
        <p className={styles.detailContent}>{event.details}</p>
        <p className={styles.detailCoords}>Координаты: **{event.lat}, {event.lng}**</p>
        <p className={styles.detailDate}>Дата и время: Сегодня, 18:00</p>
    </div>
);

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
    const { isMobile } = useWindowSize();

    const [viewMode, setViewMode] = useState(isMobile ? 'list' : 'map');
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [eventsData, setEventsData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchEvents = async () => {
            setLoading(true);
            try {
                const res = await fetch('http://localhost:8005/api/v1/events', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: localStorage.getItem('user_id')
                    },
                });
                if (!res.ok) throw new Error('Ошибка при загрузке событий');
                const data = await res.json();
                setEventsData(data.items || data); // вот здесь берем массив
            } catch (err) {
                console.error(err);
                setError(err.message);
                setEventsData(fallbackEvents.items);
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, []);


    const handleSelectEvent = (event) => setSelectedEvent(event);
    const handleClearSelection = () => setSelectedEvent(null);
    const switchToMap = () => { setSelectedEvent(null); setViewMode('map'); };
    const switchToList = () => { setSelectedEvent(null); setViewMode('list'); };

    const isMapVisible = viewMode === 'map';
    const isListVisible = viewMode === 'list';
    const isDetailViewActive = selectedEvent !== null;
    const isSplitView = !isMobile && isMapVisible && isDetailViewActive;
    const isRightPanelVisible = isListVisible || isSplitView || (isMobile && isDetailViewActive);

    let rightPanelContent;
    if (loading) {
        rightPanelContent = <p>Загрузка событий...</p>;
    } else if (error && eventsData.length === 0) {
        rightPanelContent = <p>Ошибка: {error}</p>;
    } else if (isDetailViewActive) {
        rightPanelContent = <EventDetailView event={selectedEvent} onBack={handleClearSelection} />;
    } else if (isListVisible) {
        rightPanelContent = (
            <ListView
                events={eventsData}
                selectedEvent={selectedEvent}
                onSelectEvent={handleSelectEvent}
                isMobile={isMobile}
            />
        );
    } else {
        rightPanelContent = null;
    }

    return (
        <div className={styles.container}>
            <h1 className={styles.header}>Мероприятия</h1>

            <div className={styles.toggleButtons}>
                <button onClick={switchToMap} className={isMapVisible ? styles.active : ''}>Карта</button>
                <button onClick={switchToList} className={isListVisible ? styles.active : ''}>Список</button>
            </div>

            <div className={styles.contentArea}>
                {isMapVisible && !loading && (
                    <div className={`${styles.mapPanel} ${isSplitView ? styles.mapPanelSplit : ''}`}>
                        <MapView
                            events={eventsData}
                            onSelectEvent={handleSelectEvent}
                            selectedEvent={selectedEvent}
                        />
                    </div>
                )}
                {isRightPanelVisible && <div>{rightPanelContent}</div>}
            </div>
        </div>
    );
}
