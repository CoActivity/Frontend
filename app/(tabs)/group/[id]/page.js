'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import styles from './style.module.css';
import { MoveLeft } from "lucide-react";

const getRoleTranslation = (role) => {
    switch (role) {
        case 'owner':
            return 'Владелец';
        case 'admin':
            return 'Администратор';
        case 'member':
            return 'Участник';
        case 'pending':
            return 'Ожидает';
        default:
            return role;
    }
};

export default function GroupDetailPage() {
    const router = useRouter();

    const [group, setGroup] = useState(null);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [membersLoading, setMembersLoading] = useState(true);
    const [joining, setJoining] = useState(false);

    const [isJoined, setIsJoined] = useState(false);

    const [currentUserId, setCurrentUserId] = useState(null);

    const param = useParams();
    const groupId = param.id;

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const userId = localStorage.getItem('user_id');
            setCurrentUserId(userId);
        }
    }, []);

    const fetchGroup = useCallback(async (id, userId) => {
        setLoading(true);
        if (!id || !userId) {
            setLoading(false);
            return;
        }

        try {
            const res = await fetch(`http://localhost:8003/api/v1/groups/${id}`, {
                headers: { Authorization: userId }
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
    }, []);

    const fetchMembers = useCallback(async (id, userId) => {
        setMembersLoading(true);
        if (!id || !userId) {
            setMembersLoading(false);
            return;
        }

        try {
            const res = await fetch(`http://localhost:8003/api/v1/groups/${id}/members`, {
                headers: { Authorization: userId }
            });
            if (!res.ok) {
                console.warn('Failed to load members', res.status, await res.text());
                setMembers([]);
                return;
            }
            const data = await res.json();
            const fetchedMembers = Array.isArray(data) ? data : [];
            setMembers(fetchedMembers);

            const joinedStatus = fetchedMembers.some(
                p => p.userId && p.userId.toString() === userId
            );
            setIsJoined(joinedStatus);

        } catch (err) {
            console.error(err);
            setMembers([]);
        } finally {
            setMembersLoading(false);
        }
    }, []);

    useEffect(() => {
        if (groupId && currentUserId) {
            fetchGroup(groupId, currentUserId);
            fetchMembers(groupId, currentUserId);
        } else if (groupId && currentUserId === null && !loading) {
            // Если ID еще не загружен (в начале)
            setLoading(false);
            setMembersLoading(false);
        }
    }, [groupId, currentUserId, fetchGroup, fetchMembers]);

    const handleJoin = async () => {
        if (isJoined || !group || !currentUserId) return;

        setJoining(true);
        try {
            const userIdNum = Number(currentUserId);

            const res = await fetch(`http://localhost:8003/api/v1/groups/${groupId}/join`, {
                method: 'POST',
                headers: {
                    Authorization: currentUserId
                }
            });

            if (!res.ok && res.status !== 204) {
                throw new Error('Ошибка при присоединении');
            }

            const newMember = {
                userId: userIdNum,
                username: 'Вы',
                role: 'member'
            };

            setIsJoined(true);
            setMembers(prev => [newMember, ...prev.filter(m => m.userId.toString() !== currentUserId)]); // Добавляем себя и убираем дубликат, если есть

            setGroup(prev => prev ? {
                ...prev,
                memberCount: (prev.memberCount ?? prev.memberIds?.length ?? 0) + 1,
                memberIds: prev.memberIds ? [...prev.memberIds, userIdNum] : [userIdNum]
            } : prev);

            if (res.status !== 204) {
                const data = await res.json();
                setGroup(data);
            }

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
                    <p className={styles.description}>{group.description || 'Здесь должно было быть описание'}</p>

                    <div className={styles.meta}>
                        <p><strong>Описание:</strong> {group.address || '—'}</p>
                        <p><strong>Создано:</strong> {group.createdAt ? new Date(group.createdAt).toLocaleString() : '—'}</p>
                        <p><strong>Тип:</strong> {group.type}</p>
                        <p><strong>Участники:</strong> {(group.memberCount ?? group.memberIds?.length ?? members.length)}/{group.maxMembers ?? '∞'}</p>
                    </div>

                    <button
                        className={`${styles.joinButton} ${isJoined ? styles.joined : ''}`}
                        onClick={handleJoin}
                        disabled={joining || isJoined}
                    >
                        {isJoined ? 'Вы присоединились' : joining ? 'Присоединение...' : 'Присоединиться'}
                    </button>

                    <div className={styles.participants}>
                        <h4 style={{marginTop: '20px'}}>Участники</h4>
                        {membersLoading ? (
                            <p>Загрузка участников...</p>
                        ) : (
                            <ul className={styles.participantsList}>
                                {members.map(p => {
                                    const isCurrentUser = p.userId && currentUserId && p.userId.toString() === currentUserId;
                                    return (
                                        <li key={p.userId || `guest-${p.name}`} className={styles.participantItem}>
                                            <div className={styles.participantName}>
                                                {p.name || `Пользователь ${p.userId}`}
                                                {isCurrentUser && <span className={styles.youTag}> (Вы)</span>}
                                            </div>
                                            <div className={`${styles.participantRole} ${styles[p.role]}`}>
                                                {getRoleTranslation(p.role)}
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}