import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import styles from './Chat.module.css';
import { FaPaperPlane, FaComments, FaUsers, FaSignOutAlt } from 'react-icons/fa';

// For local development, assume backend is local. 
// In production, this should be an env variable.
const ENDPOINT = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3009';

const Chat = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [socket, setSocket] = useState(null);
    const [ready, setReady] = useState(false); // To ensure socket is connected before render interactions if needed

    // State
    const [room, setRoom] = useState('');
    const [users, setUsers] = useState([]);
    const [messages, setMessages] = useState([]);
    const [inputMsg, setInputMsg] = useState('');
    const [currentUser, setCurrentUser] = useState('');

    // Refs for scrolling
    const messagesEndRef = useRef(null);

    useEffect(() => {
        // Parse query params
        const searchParams = new URLSearchParams(location.search);
        const usernameParam = searchParams.get('username');
        const roomParam = searchParams.get('room');

        if (!usernameParam || !roomParam) {
            navigate('/musicparty'); // Redirect back if missing params
            return;
        }

        setCurrentUser(usernameParam);
        setRoom(roomParam);

        // Connect Socket
        const newSocket = io(ENDPOINT, {
            transports: ['websocket'] // Force websocket for better consistency
        });
        setSocket(newSocket);

        // Join Room
        newSocket.emit('joinRoom', { username: usernameParam, room: roomParam });

        // Listeners
        newSocket.on('roomUsers', ({ room, users }) => {
            setUsers(users);
        });

        newSocket.on('message', (message) => {
            setMessages((prev) => [...prev, message]);
        });

        setReady(true);

        // Cleanup
        return () => {
            newSocket.disconnect();
        };
    }, [location.search, navigate]);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!inputMsg.trim() || !socket) return;

        socket.emit('chatMessage', inputMsg);
        setInputMsg('');
    };

    const handleLeave = () => {
        if (window.confirm('Are you sure you want to leave the chatroom?')) {
            navigate('/');
        }
    };

    // Construct Music Player URL (Local/Production agnostic)
    const MUSIC_PLAYER_BASE_URL = process.env.REACT_APP_MUSIC_PLAYER_URL || 'http://localhost:3000';
    const musicPlayerUrl = `${MUSIC_PLAYER_BASE_URL}/?room=${encodeURIComponent(room)}`;

    if (!ready) return <div style={{ color: 'white', textAlign: 'center', marginTop: '50px' }}>Connecting...</div>;

    return (
        <div className={styles.chatContainer}>
            <header className={styles.chatHeader}>
                <h1 className={styles.heading}>Rhythmic Realm</h1>
                <button onClick={handleLeave} className={styles.btnChat}>
                    <FaSignOutAlt style={{ marginRight: '5px' }} /> Leave Room
                </button>
            </header>

            <main className={styles.chatMain}>
                <div className={styles.chatSidebar}>
                    <h3><FaComments /> Room Name:</h3>
                    <h2 id="room-name">{room}</h2>
                    <h3><FaUsers /> Users</h3>
                    <ul id="users">
                        {users.map((user, index) => (
                            <li key={index}>{user.username}</li>
                        ))}
                    </ul>
                </div>

                <div className={styles.chatMessages}>
                    {messages.map((msg, index) => (
                        <div
                            key={index}
                            className={`${styles.message} ${msg.username === currentUser ? styles.currentUser : styles.otherUser}`}
                        >
                            <p className={styles.meta}>
                                {msg.username} <span>{msg.time}</span>
                            </p>
                            <p className={styles.text}>{msg.text}</p>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                <div className={styles.musicPlayerContainer}>
                    <iframe
                        src={musicPlayerUrl}
                        className={styles.musicPlayerFrame}
                        title="Music Player"
                    />
                </div>
            </main>

            <div className={styles.footerDiv}>
                <form id="chat-form" className={styles.chatForm} onSubmit={handleSubmit}>
                    <input
                        className={styles.msgInput}
                        type="text"
                        placeholder="Enter Message"
                        required
                        autoComplete="off"
                        value={inputMsg}
                        onChange={(e) => setInputMsg(e.target.value)}
                    />
                    <button className={styles.btnSend} type="submit">
                        <FaPaperPlane /> Send
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Chat;
