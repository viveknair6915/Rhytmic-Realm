import React, { useEffect, useState } from 'react';
import { FaUserAstronaut, FaMusic, FaSignOutAlt, FaEdit, FaCheck, FaTimes } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import styles from './Profile.module.css';

function Profile() {
    const navigate = useNavigate();
    const [user, setUser] = useState({
        username: 'Guest User',
        email: 'guest@rhythmicrealm.com',
        vibe: 'Chill Lo-Fi',
        genre: 'Pop / Indie'
    });

    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        username: '',
        vibe: '',
        genre: ''
    });

    const [isLoggedIn, setIsLoggedIn] = useState(Boolean(localStorage.getItem('token') || localStorage.getItem('user')));

    const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3009';

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            setIsLoggedIn(true);
            fetch(`${BACKEND_URL}/api/auth/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
                .then(res => res.json())
                .then(data => {
                    if (data.user) {
                        setUser(data.user);
                        setIsLoggedIn(true);
                        setEditForm({
                            username: data.user.username || '',
                            vibe: data.user.vibe || 'Chill Lo-Fi',
                            genre: data.user.genre || 'Pop / Indie'
                        });
                        localStorage.setItem('user', JSON.stringify(data.user));
                    }
                })
                .catch(() => {
                    loadFromLocalStorage();
                });
        } else {
            loadFromLocalStorage();
        }
    }, [BACKEND_URL]);

    const loadFromLocalStorage = () => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                const parsed = JSON.parse(storedUser);
                setIsLoggedIn(true);
                setUser({
                    username: parsed.username || 'Music Enthusiast',
                    email: parsed.email || 'guest@rhythmicrealm.com',
                    vibe: parsed.vibe || 'Chill Lo-Fi',
                    genre: parsed.genre || 'Pop / Indie'
                });
                setEditForm({
                    username: parsed.username || '',
                    vibe: parsed.vibe || 'Chill Lo-Fi',
                    genre: parsed.genre || 'Pop / Indie'
                });
            } catch (_) {}
        } else {
            setIsLoggedIn(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        sessionStorage.clear();
        setUser({
            username: 'Guest User',
            email: 'guest@rhythmicrealm.com',
            vibe: 'Chill Lo-Fi',
            genre: 'Pop / Indie'
        });
        setIsLoggedIn(false);
        // Explicit full-page redirect to Sign Up/Login screen
        window.location.href = '/signup';
    };

    const handleEditToggle = () => {
        if (!isEditing) {
            setEditForm({
                username: user.username,
                vibe: user.vibe,
                genre: user.genre
            });
            setIsEditing(true);
        } else {
            setIsEditing(false);
        }
    };

    const handleSaveProfile = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            // Local guest update
            const updated = { ...user, ...editForm };
            setUser(updated);
            localStorage.setItem('user', JSON.stringify(updated));
            setIsEditing(false);
            return;
        }

        try {
            const res = await fetch(`${BACKEND_URL}/api/auth/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(editForm)
            });
            const data = await res.json();
            if (res.ok && data.user) {
                setUser(data.user);
                localStorage.setItem('user', JSON.stringify(data.user));
                setIsEditing(false);
            } else {
                alert(data.message || 'Failed to update profile.');
            }
        } catch (err) {
            alert('Error updating profile: ' + err.message);
        }
    };

    return (
        <div className={styles.profileContainer}>
            <div className={styles.card}>
                <div className={styles.avatarContainer}>
                    <FaUserAstronaut className={styles.avatar} />
                </div>

                <div className={styles.header}>
                    {isEditing ? (
                        <input
                            type="text"
                            value={editForm.username}
                            onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                            style={{
                                background: 'rgba(255,255,255,0.1)',
                                border: '1px solid rgba(255,255,255,0.3)',
                                borderRadius: '8px',
                                color: '#fff',
                                padding: '6px 12px',
                                fontSize: '1.4rem',
                                textAlign: 'center',
                                outline: 'none'
                            }}
                        />
                    ) : (
                        <h1>{user.username}</h1>
                    )}
                    <p className={styles.status}>Music Enthusiast</p>
                </div>

                <div className={styles.infoGrid}>
                    <div className={styles.infoItem}>
                        <span className={styles.label}>Email</span>
                        <span className={styles.value}>{user.email}</span>
                    </div>
                    <div className={styles.infoItem}>
                        <span className={styles.label}><FaMusic style={{ marginRight: '5px' }} /> Vibe</span>
                        {isEditing ? (
                            <input
                                type="text"
                                value={editForm.vibe}
                                onChange={(e) => setEditForm({ ...editForm, vibe: e.target.value })}
                                style={{
                                    background: 'rgba(255,255,255,0.1)',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    borderRadius: '6px',
                                    color: '#fff',
                                    padding: '4px 8px',
                                    outline: 'none',
                                    width: '100%'
                                }}
                            />
                        ) : (
                            <span className={styles.value}>{user.vibe}</span>
                        )}
                    </div>
                    <div className={styles.infoItem}>
                        <span className={styles.label}>Favorite Genre</span>
                        {isEditing ? (
                            <input
                                type="text"
                                value={editForm.genre}
                                onChange={(e) => setEditForm({ ...editForm, genre: e.target.value })}
                                style={{
                                    background: 'rgba(255,255,255,0.1)',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    borderRadius: '6px',
                                    color: '#fff',
                                    padding: '4px 8px',
                                    outline: 'none',
                                    width: '100%'
                                }}
                            />
                        ) : (
                            <span className={styles.value}>{user.genre}</span>
                        )}
                    </div>
                </div>

                <div className={styles.actions}>
                    {isEditing ? (
                        <>
                            <button className={`${styles.btn} ${styles.editBtn}`} onClick={handleSaveProfile}>
                                <FaCheck /> Save
                            </button>
                            <button className={`${styles.btn} ${styles.logoutBtn}`} onClick={handleEditToggle}>
                                <FaTimes /> Cancel
                            </button>
                        </>
                    ) : (
                        <button className={`${styles.btn} ${styles.editBtn}`} onClick={handleEditToggle}>
                            <FaEdit /> Edit
                        </button>
                    )}
                    {!isEditing && (
                        <button className={`${styles.btn} ${styles.logoutBtn}`} onClick={handleLogout}>
                            <FaSignOutAlt /> {isLoggedIn ? 'Logout' : 'Sign In'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Profile;