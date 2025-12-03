'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import styles from './Navbar.module.css';
import { Home, Users, Calendar, User, LogIn } from 'lucide-react'; // Добавляем LogIn

const baseNavItems = [
    { name: 'Главная', path: '/', icon: Home },
    { name: 'Мои комнаты', path: '/rooms', icon: Users },
    { name: 'Мероприятия', path: '/events', icon: Calendar },
];

const authItem = { name: 'Профиль', path: '/profile', icon: User };
const guestItem = { name: 'Войти', path: '/auth', icon: LogIn };

export default function Navbar() {
    const pathname = usePathname();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsClient(true);
        if (typeof window !== 'undefined' && window.localStorage.getItem('user_id')) {
            setIsAuthenticated(true);
        } else {
            setIsAuthenticated(false);
        }
    }, []);

    const navItems = useMemo(() => {
        if (!isClient) {
            return [...baseNavItems, authItem];
        }

        if (isAuthenticated) {
            return [...baseNavItems, authItem];
        } else {
            return [...baseNavItems, guestItem];
        }
    }, [isAuthenticated, isClient]);


    return (
        <nav className={styles.nav}>
            {navItems.map((item) => {
                const isActive = pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path));
                const linkStyle = {
                    color: isActive ? '#0070f3' : '#333',
                    fontWeight: isActive ? 'bold' : 'normal',
                }
                const IconComponent = item.icon;

                return (
                    <Link
                        key={item.name}
                        href={item.path}
                        className={styles.link}
                        style={linkStyle}
                    >
                        <div className={styles.iconWrapper}>
                            <IconComponent size={20} />
                        </div>

                        <span className={styles.linkText}>
                            {item.name}
                        </span>
                    </Link>
                );
            })}
        </nav>
    );
}