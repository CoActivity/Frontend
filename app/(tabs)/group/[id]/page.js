'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
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
    const { id: groupId } = useParams();

    const [group, setGroup] = useState(null);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [membersLoading, setMembersLoading] = useState(true);
    const [joining, setJoining] = useState(false);
    const [isJoined, setIsJoined] = useState(false);
    const [currentUserId, setCurrentUserId] = useState(null);

    const [allInterests, setAllInterests] = useState([]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setCurrentUserId(localStorage.getItem('user_id'));
            try {
                const raw = localStorage.getItem('interests');
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) setAllInterests(parsed);
            } catch {}
        }
    }, []);


    const fetchGroup = useCallback(async () => {
        if (!groupId || !currentUserId) return;

        setLoading(true);
        try {
            const res = await fetch(`http://localhost:8003/api/v1/groups/${groupId}`, {
                headers: { Authorization: currentUserId }
            });

            if (!res.ok) {
                setGroup(null);
                return;
            }

            const data = await res.json();
            setGroup(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [groupId, currentUserId]);


    const fetchMembers = useCallback(async () => {
        if (!groupId || !currentUserId) return;

        setMembersLoading(true);
        try {
            const res = await fetch(`http://localhost:8003/api/v1/groups/${groupId}/members`, {
                headers: { Authorization: currentUserId }
            });

            const data = await res.json();
            const list = Array.isArray(data) ? data : [];
            setMembers(list);

            setIsJoined(
                list.some(m => m.userId?.toString() === currentUserId)
            );
        } catch (e) {
            setMembers([]);
        } finally {
            setMembersLoading(false);
        }
    }, [groupId, currentUserId]);

    useEffect(() => {
        if (groupId && currentUserId) {
            fetchGroup();
            fetchMembers();
        }
    }, [groupId, currentUserId, fetchGroup, fetchMembers]);


    const handleJoin = async () => {
        if (!group || isJoined || !currentUserId) return;

        setJoining(true);
        try {
            const res = await fetch(
                `http://localhost:8003/api/v1/groups/${groupId}/join`,
                { method: 'POST', headers: { Authorization: currentUserId } }
            );

            if (!res.ok && res.status !== 204) throw new Error();

            setIsJoined(true);
            fetchMembers();
        } catch {
            alert('Не удалось присоединиться');
        } finally {
            setJoining(false);
        }
    };

    const groupInterests = useMemo(() => {
        if (!group?.interests?.length || !allInterests.length) return [];

        return group.interests
            .map(id =>
                allInterests.find(i => Number(i.id) === Number(id))
            )
            .filter(Boolean);
    }, [group, allInterests]);

    console.log(localStorage.getItem('interests'))

    if (loading) return <p className={styles.loading}>Загрузка группы…</p>;
    if (!group) return <p className={styles.loading}>Группа недоступна</p>;

    return (
        <div className={styles.container}>
            <button className={styles.backButton} onClick={() => router.back()}>
                <MoveLeft />
            </button>

            <div className={styles.card}>
                <img
                    src={group.avatarUrl || "https://avatars.mds.yandex.net/i?id=b4c168ff87afbf8684c309648eb46f3d02ed0e38-5031281-images-thumbs&n=13"}
                    className={styles.image}
                    alt={group.name}
                />

                <div className={styles.info}>
                    <h1 className={styles.title}>{group.name}</h1>
                    <p className={styles.description}>
                        {group.description || 'Описание отсутствует'}
                    </p>

                    {/* 🔥 ИНТЕРЕСЫ */}
                    {groupInterests.length > 0 && (
                        <div className={styles.interestsSection}>
                            <div className={styles.sectionTitle}>Интересы группы</div>
                            <div className={styles.interestsList}>
                                {groupInterests.map(it => (
                                    <span key={it.id} className={styles.interestTag}>
                                        <span className={styles.interestIcon}>{it.icon}</span>
                                        {it.name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className={styles.meta}>
                        <p><strong>Тип:</strong> {group.type}</p>
                        <p><strong>Участники:</strong> {group.memberCount}/{group.maxMembers}</p>
                        <p><strong>Создано:</strong> {new Date(group.createdAt).toLocaleString()}</p>
                    </div>

                    <button
                        className={`${styles.joinButton} ${isJoined ? styles.joined : ''}`}
                        onClick={handleJoin}
                        disabled={joining || isJoined}
                    >
                        {isJoined ? 'Вы участник' : joining ? 'Подключение...' : 'Присоединиться'}
                    </button>

                    {/* 👥 УЧАСТНИКИ */}
                    <div className={styles.participants}>
                        <h4>Участники</h4>
                        {membersLoading ? (
                            <p>Загрузка…</p>
                        ) : (
                            <ul className={styles.participantsList}>
                                {members.map(m => (
                                    <li key={m.userId} className={styles.participantItem}>
                                        <span>
                                            {m.name || `Пользователь ${m.userId}`}
                                            {m.userId?.toString() === currentUserId && ' (Вы)'}
                                        </span>
                                        <span className={`${styles.role} ${styles[m.role]}`}>
                                            {getRoleTranslation(m.role)}
                                        </span>
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
