'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import styles from './style.module.css';
import { MoveLeft } from "lucide-react";

export default function EventDetailPage() {
    const { eventId } = useParams();
    const router = useRouter();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [joining, setJoining] = useState(false);
    const param = useParams();
    const [isJoined, setIsJoined] = useState(false);

    useEffect(() => {
        const fetchEvent = async () => {
            setLoading(true);
            try {
                const res = await fetch(`http://localhost:8005/api/v1/events/${param.id}`, {
                    headers: {
                        'Authorization': localStorage.getItem('user_id')
                    }
                });
                if (!res.ok) throw new Error('Ошибка загрузки события');
                const data = await res.json();
                setEvent(data);
            } catch (err) {
                console.error(err);
                setEvent(fallbackEvent);
            } finally {
                setLoading(false);
            }
        };
        fetchEvent();
    }, [eventId]);

    const handleJoin = async () => {
        if (!event) return;
        setJoining(true);
        try {
            const res = await fetch(`http://localhost:8005/api/v1/events/${param.id}/participants`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: localStorage.getItem('user_id')
                },
                body: JSON.stringify({
                    action: 'join',
                    message: event.accessType === 'private' ? 'Хочу присоединиться' : ''
                })
            });
            if (!res.ok) throw new Error('Не удалось присоединиться');
            const data = await res.json();
            setEvent(prev => ({
                ...prev,
                participants: [...(prev.participants || []), data.user || { name: 'Вы' }]
            }));
            if (res.ok) {
                setIsJoined(true);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setJoining(false);
        }
    };

    if (loading) {
        return <p className={styles.loading}>Загрузка события...</p>;
    }

    return (
        <div className={styles.container}>
            <button className={styles.backButton} onClick={() => router.back()}>
                <MoveLeft />
            </button>

            <div className={styles.card}>
                <img
                    src={event.imageUrl || "https://avatars.mds.yandex.net/i?id=b4c168ff87afbf8684c309648eb46f3d02ed0e38-5031281-images-thumbs&n=13"}
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
                    </div>

                    <button
                        className={styles.joinButton}
                        onClick={handleJoin}
                        disabled={isJoined}
                    >
                        {isJoined ? 'Вы уже присоединились' : 'Присоединиться'}
                    </button>
                </div>
            </div>
        </div>
    );
}
