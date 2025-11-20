'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Navbar.module.css';
import { Home, Users, Calendar, User } from 'lucide-react';

const navItems = [
    { name: 'Главная', path: '/', icon: Home },
    { name: 'Мои комнаты', path: '/rooms', icon: Users },
    { name: 'Мероприятия', path: '/events', icon: Calendar },
    { name: 'Профиль', path: '/profile', icon: User },
];

export default function Navbar() {
    const pathname = usePathname();

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