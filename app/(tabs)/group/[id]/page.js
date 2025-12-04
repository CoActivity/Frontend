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
                if (!res.ok) {
                    console.warn('Failed to load group', res.status, await res.text());
                    setGroup(null);
                    return;
                }
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
                if (!res.ok) {
                    console.warn('Failed to load members', res.status, await res.text());
                    setMembers([]);
                    return;
                }
                const data = await res.json();
                setMembers(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error(err);
                setMembers([]);
            } finally {
                setMembersLoading(false);
            }
        };
        fetchMembers();
    }, [param.id]);

    const handleJoin = async () => {
        setJoining(true);
        try {
            const userId = Number(localStorage.getItem('user_id'));
            const res = await fetch(`http://localhost:8003/api/v1/groups/${param.id}/join`, {
                method: 'POST',
                headers: {
                    Authorization: localStorage.getItem('user_id')
                }
            });
            if (res.status === 204) {
                setJoined(true);
                setGroup(prev => prev ? {
                    ...prev,
                    memberCount: (prev.memberCount ?? prev.memberIds?.length ?? 0) + 1,
                    memberIds: prev.memberIds ? [...prev.memberIds, userId] : [userId]
                } : prev);
                setMembers(prev => [{ userId, username: 'Вы', role: 'member' }, ...prev]);
                return;
            }
            if (!res.ok) throw new Error('Ошибка при присоединении');
            const data = await res.json();
            setJoined(true);
            setGroup(data);
            setMembers(prev => [{ userId, username: 'Вы', role: 'member' }, ...prev]);
        } catch (err) {
            console.error(err);
            alert('Не удалось присоединиться к группе');
        } finally {
            setJoining(false);
        }
    };

    if (loading) return <p className={styles.loading}>Загрузка группы...</p>;
    if (!group) return <p className={styles.loading}>Группа недоступна.</p>;

    return (
        <div className={styles.container}>
            <button className={styles.backButton} onClick={() => router.back()}>
                <MoveLeft/>
            </button>

            <div className={styles.card}>
                <img
                    src={group.avatarUrl || "https://avatars.mds.yandex.net/i?id=b4c168ff87afbf8684c309648eb46f3d02ed0e38-5031281-images-thumbs&n=13"}
                    alt={group.name}
                    className={styles.image}
                />

                <div className={styles.info}>
                    <h1 className={styles.title}>{group.name}</h1>
                    <p className={styles.description}>{group.description}</p>

                    <div className={styles.meta}>
                        <p><strong>Местоположение:</strong> {group.address || '—'}</p>
                    <p><strong>Создано:</strong> {group.createdAt ? new Date(group.createdAt).toLocaleString() : '—'}</p>
                    <p><strong>Тип:</strong> {group.type}</p>
                    <p><strong>Участники:</strong> {(group.memberCount ?? group.memberIds?.length ?? 0)}/{group.maxMembers ?? 0}</p>
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
                                {members.map((member, idx) => (
                                    <li
                                        key={`${member.userId ?? member.id ?? 'member'}-${idx}`}
                                        className={styles.memberItem}
                                    >
                                        <div className={styles.avatar}>A</div>
                                        <span>{member.username || member.userId}</span>
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
