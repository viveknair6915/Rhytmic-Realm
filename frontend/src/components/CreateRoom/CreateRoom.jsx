import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './CreateRoom.module.css';
import { v4 as uuidv4 } from 'uuid';

const CreateRoom = () => {
    const navigate = useNavigate();
    const [room, setRoom] = useState('');
    const [username, setUsername] = useState('');

    useEffect(() => {
        // Pre-fill username if user is logged in
        try {
            const stored = localStorage.getItem('user');
            if (stored) {
                const parsed = JSON.parse(stored);
                if (parsed.username) setUsername(parsed.username);
            }
        } catch (_) {}
    }, []);

    const generateUniqueRoomName = () => {
        return uuidv4().slice(0, 8); // Clean, unique room code
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const enteredUsername = username.trim() || e.target.username.value;
        const selectedRoom = room.trim() !== '' ? room.trim() : generateUniqueRoomName();

        // Register room with backend (optional failure tolerant)
        const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3009';
        const token = localStorage.getItem('token');
        try {
            await fetch(`${BACKEND_URL}/api/rooms`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify({
                    name: selectedRoom,
                    code: selectedRoom,
                    isPrivate: true
                })
            });
        } catch (_) {
            // Proceed to chat even if room auto-register succeeds via socket
        }

        // Navigate within React Router
        navigate(`/chat?username=${encodeURIComponent(enteredUsername)}&room=${encodeURIComponent(selectedRoom)}`);
    };

    return (
        <div className={styles.joincontainer}>
            <header className={styles.joinheader}>
                <h1 className={styles.heading}>Rhythm Realm</h1>
            </header>
            <main className={styles.joinmain}>
                <form onSubmit={handleSubmit}>
                    <div className="form-control">
                        <label htmlFor="username">Username</label>
                        <input
                            type="text"
                            name="username"
                            id="username"
                            placeholder="Naruto"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-control">
                        <label htmlFor="room">Enter Custom Room ID</label>
                        <input
                            type="text"
                            name="room"
                            id="room"
                            placeholder="Custom Room"
                            value={room}
                            onChange={(e) => setRoom(e.target.value)}
                        />
                    </div>

                    <button type="submit" className={styles.btn}>
                        Create Room
                    </button>
                </form>
            </main>
        </div>
    );
};

export default CreateRoom;
