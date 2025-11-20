import BottomNav from "@/components/Navbar";
import styles from "./layout.module.css";

export default function TabsLayout({ children }) {
    return (
        <div className={styles.layoutContainer}>
            <main className={styles.mainContent}>
                {children}
            </main>
            <BottomNav />
        </div>
    );
}