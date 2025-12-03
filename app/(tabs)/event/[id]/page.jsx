'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import styles from './style.module.css';
import { MoveLeft } from "lucide-react";


export default function EventDetailPage() {
    const router = useRouter();
    const param = useParams();
    const eventId = param.id;
    const [event, setEvent] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [joining, setJoining] = useState(false);
    const [isJoined, setIsJoined] = useState(false);
    const currentUserId = localStorage.getItem('user_id');

    useEffect(() => {
        const fetchEventAndParticipants = async () => {
            setLoading(true);
            try {
                const eventRes = await fetch(`http://localhost:8005/api/v1/events/${eventId}`, {
                    headers: { 'Authorization': currentUserId }
                });
                if (!eventRes.ok) throw new Error('Ошибка загрузки события');
                const eventData = await eventRes.json();
                setEvent(eventData);

                const userJoined = (eventData.participants || []).some(p => p.userId.toString() === currentUserId);
                setIsJoined(userJoined);

                const participantsRes = await fetch(`http://localhost:8005/api/v1/events/${eventId}/participants`, {
                    headers: { 'Authorization': currentUserId }
                });
                if (participantsRes.ok) {
                    const participantsData = await participantsRes.json();
                    setParticipants(participantsData.participants || []);
                } else {
                    setParticipants(eventData.participants || []);
                }

            } catch (err) {
                console.error(err);
                setEvent(fallbackEvent);
                setParticipants(fallbackEvent.participants);
                setIsJoined(fallbackEvent.participants.some(p => p.userId.toString() === currentUserId));
            } finally {
                setLoading(false);
            }
        };

        if (eventId) {
            fetchEventAndParticipants();
        }
    }, [eventId, currentUserId]);


    const handleJoin = async () => {
        if (!event) return;
        setJoining(true);
        try {
            const res = await fetch(`http://localhost:8005/api/v1/events/${eventId}/participants`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: currentUserId
                },
                body: JSON.stringify({
                    action: 'join',
                    message: event.accessType === 'private' ? 'Хочу присоединиться' : ''
                })
            });
            if (!res.ok) throw new Error('Не удалось присоединиться');
            const data = await res.json();
            setParticipants(prev => [
                ...(prev || []),
                {
                    ...data.user,
                    role: 'participant',
                    status: 'confirmed',
                    name: data.user?.name || 'Вы'
                }
            ]);
            setIsJoined(true);
        } catch (err) {
            console.error(err);
        } finally {
            setJoining(false);
        }
    };

    const getRoleTranslation = (role) => {
        switch (role) {
            case 'organizer': return 'Организатор';
            case 'participant': return 'Участник';
            case 'pending': return 'Ожидает';
            default: return role;
        }
    };

    if (loading) {
        return <p className={styles.loading}>Загрузка события...</p>;
    }

    if (!event) {
        return <p className={styles.error}>Событие не найдено.</p>;
    }


    return (
        <div className={styles.container}>
            <button className={styles.backButton} onClick={() => router.back()}>
                <MoveLeft />
            </button>

            <div className={styles.contentWrapper}> {/* Новый оберточный div */}
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
                            disabled={isJoined || joining}
                        >
                            {joining ? 'Присоединение...' : isJoined ? 'Вы уже присоединились' : 'Присоединиться'}
                        </button>
                    </div>
                </div>

                <div className={styles.participantsCard}>
                    <h2 className={styles.participantsTitle}>Участники ({participants.length})</h2>
                    <ul className={styles.participantsList}>
                        {participants.map(p => (
                            <li key={p.userId} className={styles.participantItem}>
                                <div className={styles.participantName}>{p.name || `Пользователь ${p.userId}`}</div>
                                <div className={`${styles.participantRole} ${styles[p.role]}`}>
                                    {getRoleTranslation(p.role)}
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}