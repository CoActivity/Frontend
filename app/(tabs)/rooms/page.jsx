'use client';

import { useState, useEffect } from 'react';
import styles from './style.module.css';
import { useRouter } from 'next/navigation';

const fallbackGroups = [
    {
        groupId: 0,
        name: "Пример группы",
        description: "Описание группы отсутствует",
        avatarUrl: "https://avatars.mds.yandex.net/i?id=b4c168ff87afbf8684c309648eb46f3d02ed0e38-5031281-images-thumbs&n=13",
        type: "PUBLIC",
        maxMembers: 100,
        memberCount: 5,
        interests: [1,2,3],
        isActive: true,
        createdAt: "2025-11-20T01:00:55.617Z",
        updatedAt: "2025-11-20T01:00:55.617Z"
    }
];

function GroupCard({ group, onClick }) {
    return (
        <div className={styles.groupCard} onClick={() => onClick(group)}>
            <img
                src={group.avatarUrl || "https://avatars.mds.yandex.net/i?id=b4c168ff87afbf8684c309648eb46f3d02ed0e38-5031281-images-thumbs&n=13"}
                alt={group.name}
                className={styles.groupImage}
            />
            <div className={styles.groupInfo}>
                <h3>{group.name}</h3>
                <p>{group.description}</p>
                <p><strong>Тип:</strong> {group.type}</p>
                <p><strong>Участники:</strong> {group.memberCount ?? group.memberIds?.length ?? 0}/{group.maxMembers ?? 0}</p>
            </div>
        </div>
    );
}

export default function MyGroupsPage() {
    const router = useRouter();

    const [adminGroups, setAdminGroups] = useState([]);
    const [myGroups, setMyGroups] = useState([]);
    const [loadingAdmin, setLoadingAdmin] = useState(true);
    const [loadingMy, setLoadingMy] = useState(true);

    useEffect(() => {
        const fetchAdminGroups = async () => {
            setLoadingAdmin(true);
            try {
                const res = await fetch('http://localhost:8002/api/v1/users/me/admin-groups', {
                    headers: {
                        Authorization: localStorage.getItem('user_id')
                    }
                });
                if (!res.ok) {
                    console.warn('Failed to load admin groups', res.status, await res.text());
                    setAdminGroups(fallbackGroups);
                    return;
                }
                const data = await res.json();
                setAdminGroups(Array.isArray(data) && data.length ? data : fallbackGroups);
            } catch (err) {
                console.error(err);
                setAdminGroups(fallbackGroups);
            } finally {
                setLoadingAdmin(false);
            }
        };

        const fetchMyGroups = async () => {
            setLoadingMy(true);
            try {
                const res = await fetch('http://localhost:8002/api/v1/users/me/groups', {
                    headers: { Authorization: localStorage.getItem('user_id') }
                });
                if (!res.ok) {
                    console.warn('Failed to load groups', res.status, await res.text());
                    setMyGroups(fallbackGroups);
                    return;
                }
                const data = await res.json();
                setMyGroups(Array.isArray(data) && data.length ? data : fallbackGroups);
            } catch (err) {
                console.error(err);
                setMyGroups(fallbackGroups);
            } finally {
                setLoadingMy(false);
            }
        };

        fetchAdminGroups();
        fetchMyGroups();
    }, []);

    const handleGroupClick = (group) => {
        router.push(`/group/${group.groupId}`);
    };

    return (
        <div className={styles.container}>
            <h3>Администрируемые группы</h3>
            {loadingAdmin ? <p>Загрузка...</p> :
                <div className={styles.groupList}>
                    {adminGroups.map(group => (
                        <GroupCard key={group.groupId} group={group} onClick={handleGroupClick} />
                    ))}
                </div>
            }

            <h3>Мои группы</h3>
            {loadingMy ? <p>Загрузка...</p> :
                <div className={styles.groupList}>
                    {myGroups.map(group => (
                        <GroupCard key={group.groupId} group={group} onClick={handleGroupClick} />
                    ))}
                </div>
            }
        </div>
    );
}
