'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import styles from './style.module.css';
import {MoveLeft} from "lucide-react";

export default function GroupDetailPage() {
    const router = useRouter();

    const [group, setGroup] = useState(null);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [membersLoading, setMembersLoading] = useState(true);
    const [joining, setJoining] = useState(false);
    const [joined, setJoined] = useState(false);

    const param = useParams();
    console.log(param.id)
    useEffect(() => {
        const fetchGroup = async () => {
            setLoading(true);
            try {
                const res = await fetch(`http://localhost:8003/api/v1/groups/${param.id}`, {
                    headers: { Authorization: localStorage.getItem('user_id') }
                });
                if (!res.ok) throw new Error('Ошибка загрузки группы');
                const data = await res.json();
                setGroup(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchGroup();
    }, [param.id]);

    useEffect(() => {
        const fetchMembers = async () => {
            setMembersLoading(true);
            try {
                const res = await fetch(`http://localhost:8003/api/v1/groups/${param.id}/members`, {
                    headers: { Authorization: localStorage.getItem('user_id') }
                });
                if (!res.ok) throw new Error('Ошибка загрузки участников');
                const data = await res.json();
                setMembers(data || []);
            } catch (err) {
                console.error(err);
            } finally {
                setMembersLoading(false);
            }
        };
        fetchMembers();
    }, [param.id]);

    const handleJoin = async () => {
        setJoining(true);
        try {
            const res = await fetch(`http://localhost:8003/api/v1/groups/${param.id}/join`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: localStorage.getItem('user_id')
                },
                body: JSON.stringify({ action: 'join', message: 'Хочу присоединиться!' })
            });
            if (!res.ok) throw new Error('Ошибка при присоединении');
            setJoined(true);
            setGroup(prev => ({
                ...prev,
                currentParticipants: prev.currentParticipants + 1
            }));
            setMembers(prev => [{ id: 0, name: 'Вы' }, ...prev]);
        } catch (err) {
            console.error(err);
            alert('Не удалось присоединиться к группе');
        } finally {
            setJoining(false);
        }
    };

    if (loading) return <p className={styles.loading}>Загрузка группы...</p>;

    return (
        <div className={styles.container}>
            <button className={styles.backButton} onClick={() => router.back()}>
                <MoveLeft/>
            </button>

            <div className={styles.card}>
                <img
                    src={group.imageUrl || "https://avatars.mds.yandex.net/i?id=b4c168ff87afbf8684c309648eb46f3d02ed0e38-5031281-images-thumbs&n=13"}
                    alt={group.name}
                    className={styles.image}
                />

                <div className={styles.info}>
                    <h1 className={styles.title}>{group.name}</h1>
                    <p className={styles.description}>{group.description}</p>

                    <div className={styles.meta}>
                        <p><strong>Местоположение:</strong> {group.address}</p>
                        <p><strong>Дата и время:</strong> {new Date(group.startTime).toLocaleString()}</p>
                        {group.price > 0 && <p><strong>Цена:</strong> {group.price} ₽</p>}
                        {group.ageRestriction > 0 && <p><strong>Возрастное ограничение:</strong> {group.ageRestriction}+</p>}
                        <p><strong>Участники:</strong> {group.currentParticipants}/{group.maxParticipants}</p>
                    </div>

                    <button
                        className={styles.joinButton}
                        onClick={handleJoin}
                        disabled={joining || joined}
                    >
                        {joined ? 'Вы присоединились' : joining ? 'Присоединение...' : 'Присоединиться'}
                    </button>

                    <div className={styles.participants}>
                        <h4>Участники</h4>
                        {membersLoading ? (
                            <p>Загрузка участников...</p>
                        ) : (
                            <ul>
                                {members.map(member => (
                                    <li key={member.id} className={styles.memberItem}>
                                        <div className={styles.avatar}>{member.name[0]}</div>
                                        <span>{member.name}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
