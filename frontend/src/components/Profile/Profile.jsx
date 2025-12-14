import React, { useEffect, useState } from 'react';
import { FaUserAstronaut, FaMusic, FaSignOutAlt, FaEdit } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import styles from './Profile.module.css';

function Profile() {
    const navigate = useNavigate();
    const [user, setUser] = useState({
        username: 'Guest User',
        email: 'guest@rhythmicrealm.com',
        vibe: 'Exploring',
        genre: 'Mix'
    });

    useEffect(() => {
        // Try to get user from localStorage
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                const parsed = JSON.parse(storedUser);
                setUser({
                    ...parsed,
                    vibe: 'Chill Lo-Fi', // Mock data for "Music Identity"
                    genre: 'Pop / Indie'
                });
            } catch (e) {
                console.error("Failed to parse user data");
            }
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token'); // usage if exists
        navigate('/'); // Redirect to Home
        window.location.reload(); // Ensure state clears
    };

    return (
        <div className={styles.profileContainer}>
            <div className={styles.card}>
                <div className={styles.avatarContainer}>
                    <FaUserAstronaut className={styles.avatar} />
                </div>

                <div className={styles.header}>
                    <h1>{user.username}</h1>
                    <p className={styles.status}>Music Enthusiast</p>
                </div>

                <div className={styles.infoGrid}>
                    <div className={styles.infoItem}>
                        <span className={styles.label}>Email</span>
                        <span className={styles.value}>{user.email}</span>
                    </div>
                    <div className={styles.infoItem}>
                        <span className={styles.label}><FaMusic style={{ marginRight: '5px' }} /> Vibe</span>
                        <span className={styles.value}>{user.vibe}</span>
                    </div>
                    <div className={styles.infoItem}>
                        <span className={styles.label}>Favorite Genre</span>
                        <span className={styles.value}>{user.genre}</span>
                    </div>
                </div>

                <div className={styles.actions}>
                    <button className={`${styles.btn} ${styles.editBtn}`}>
                        <FaEdit /> Edit
                    </button>
                    <button className={`${styles.btn} ${styles.logoutBtn}`} onClick={handleLogout}>
                        <FaSignOutAlt /> Logout
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Profile;