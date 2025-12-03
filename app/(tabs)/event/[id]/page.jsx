'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import styles from './style.module.css';
import { MoveLeft, CheckCircle } from "lucide-react";

const API_BASE_URL = 'http://localhost:8005/api/v1/events';

const fallbackEvent = {
    eventId: 2,
    name: "IT-митап",
    description: "Встреча разработчиков по теме Next.js и React-Leaflet.",
    imageUrl: "https://avatars.mds.yandex.net/i?id=b4c168ff87afbf8684c309648eb46f3d02ed0e38-5031281-images-thumbs&n=13",
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
    participants: [],
    interests: [2],
    ageRestriction: 18,
    price: 0,
    requirements: "Регистрация",
    creatorId: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
};

export default function EventDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [joining, setJoining] = useState(false);
    const [error, setError] = useState(null);
    const [isJoined, setIsJoined] = useState(false);

    const userId = typeof window !== 'undefined' ? localStorage.getItem('user_id') : null;
    const eventId = params.id;

    useEffect(() => {
        if (!eventId) return;

        const fetchEvent = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(`${API_BASE_URL}/${eventId}`, {
                    headers: { 'Authorization': userId || '' }
                });
                if (!res.ok) throw new Error('Ошибка загрузки события');
                const data = await res.json();
                setEvent(data);

                if (data.participants.some(p => String(p.id) === String(userId))) {
                    setIsJoined(true);
                }

            } catch (err) {
                console.error("Ошибка загрузки:", err);
                setEvent(fallbackEvent);
                setError('Не удалось загрузить данные события.');
            } finally {
                setLoading(false);
            }
        };
        fetchEvent();
    }, [eventId, userId]);


    const handleJoin = async () => {
        if (!event || !userId) {
            setError('Для участия необходимо войти в аккаунт.');
            return;
        }

        if (isJoined) return;

        setJoining(true);
        setError(null);

        try {
            const res = await fetch(`${API_BASE_URL}/${eventId}/participants`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: userId
                },
                body: JSON.stringify({
                    action: 'join',
                    message: event.accessType === 'private' ? 'Хочу присоединиться' : ''
                })
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Не удалось присоединиться к мероприятию.');
            }

            setIsJoined(true);

            const data = await res.json();
            setEvent(prev => ({
                ...prev,
                participants: [...(prev.participants || []), data.user || { id: userId, name: 'Вы' }]
            }));

        } catch (err) {
            console.error("Ошибка присоединения:", err);
            setError(err.message || 'Произошла сетевая ошибка при попытке присоединения.');
        } finally {
            setJoining(false);
        }
    };

    const getButtonText = () => {
        if (joining) return 'Отправка...';

        if (isJoined) {
            return 'Вы присоединились к мероприятию';
        }

        return event.accessType === 'private' ? 'Подать заявку' : 'Присоединиться';
    };

    if (loading) {
        return <p className={styles.loading}>Загрузка события...</p>;
    }

    const renderJoinNotification = () => {
        if (isJoined) {
            const message = event.accessType === 'private'
                ? 'Ваша заявка на участие отправлена и ожидает одобрения.'
                : 'Вы успешно присоединились к мероприятию!';

            return (
                <div className={styles.successNotification}>
                    <CheckCircle size={24} />
                    <p>{message}</p>
                </div>
            );
        }
        if (error) {
            return (
                <div className={styles.errorNotification}>
                    <p>Ошибка: {error}</p>
                </div>
            );
        }
        return null;
    };


    return (
        <div className={styles.container}>
            <button className={styles.backButton} onClick={() => router.back()}>
                <MoveLeft /> Назад
            </button>

            {renderJoinNotification()}

            <div className={styles.card}>
                <img
                    src={event.imageUrl || fallbackEvent.imageUrl}
                    alt={event.name}
                    className={styles.image}
                />
                <div className={styles.info}>
                    <h1 className={styles.title}>{event.name}</h1>
                    <p className={styles.description}>{event.description}</p>

                    <div className={styles.meta}>
                        <p><strong>Место:</strong> {event.city}, {event.address}</p>
                        <p><strong>Дата и время:</strong> {new Date(event.startTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</p>
                        {event.price > 0 && <p><strong>Цена:</strong> {event.price} ₽</p>}
                        {event.ageRestriction > 0 && <p><strong>Возрастное ограничение:</strong> {event.ageRestriction}+</p>}
                        <p><strong>Участников:</strong> {event.participants.length} / {event.maxParticipants}</p>
                    </div>

                    <button
                        className={styles.joinButton}
                        onClick={handleJoin}
                        disabled={joining || isJoined}
                    >
                        {getButtonText()}
                    </button>
                </div>
            </div>
        </div>
    );
}