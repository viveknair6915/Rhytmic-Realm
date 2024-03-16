import React from 'react';
import { useState } from 'react';
import styles from './CreateRoom.module.css';
import { v4 as uuidv4 } from 'uuid';

const JoinPage = () => {
    const [room, setRoom] = useState('');
    
    const generateUniqueRoomName = () => {
        // Generate a unique room name using uuid
        return uuidv4();
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const username = e.target.username.value;

        // If the user entered a custom room, use it; otherwise, generate a unique room name
        const selectedRoom = room.trim() !== '' ? room : generateUniqueRoomName();

        // Redirect to the chat page with the provided username and room
        window.location.href = `http://localhost:3009/chat.html?username=${username}&room=${selectedRoom}`;
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

export default JoinPage;
