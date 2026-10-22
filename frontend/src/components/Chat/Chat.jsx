import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import styles from './Chat.module.css';
import { FaPaperPlane, FaComments, FaUsers, FaSignOutAlt } from 'react-icons/fa';

const ENDPOINT = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3009';

const Chat = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [socket, setSocket] = useState(null);
    const [ready, setReady] = useState(false);

    // State
    const [room, setRoom] = useState('');
    const [users, setUsers] = useState([]);
    const [messages, setMessages] = useState([]);
    const [inputMsg, setInputMsg] = useState('');
    const [currentUser, setCurrentUser] = useState('');

    // Refs
    const messagesEndRef = useRef(null);
    const iframeRef = useRef(null);
    const socketRef = useRef(null);

    useEffect(() => {
        // Parse query params
        const searchParams = new URLSearchParams(location.search);
        let usernameParam = searchParams.get('username');
        const roomParam = searchParams.get('room');

        if (!roomParam) {
            navigate('/musicparty');
            return;
        }

        // Try getting verified username from localStorage if missing or generic
        if (!usernameParam) {
            try {
                const stored = localStorage.getItem('user');
                if (stored) {
                    const parsed = JSON.parse(stored);
                    if (parsed.username) usernameParam = parsed.username;
                }
            } catch (_) {}
        }

        const finalUsername = usernameParam || 'Guest';
        setCurrentUser(finalUsername);
        setRoom(roomParam);

        const token = localStorage.getItem('token');

        // Connect Socket with Auth Token
        const newSocket = io(ENDPOINT, {
            auth: { token },
            query: { token },
            transports: ['websocket', 'polling']
        });

        socketRef.current = newSocket;
        setSocket(newSocket);

        // Join Room
        newSocket.emit('joinRoom', { username: finalUsername, room: roomParam });

        // Listen for message history from MongoDB
        newSocket.on('messageHistory', (history) => {
            if (Array.isArray(history) && history.length > 0) {
                setMessages(history);
            }
        });

        // Listen for new messages
        newSocket.on('message', (message) => {
            setMessages((prev) => [...prev, message]);
        });

        // Listen for room users update
        newSocket.on('roomUsers', ({ users }) => {
            setUsers(users);
        });

        // Listen for synchronized music state updates
        newSocket.on('music:stateUpdate', (musicState) => {
            if (iframeRef.current && iframeRef.current.contentWindow) {
                iframeRef.current.contentWindow.postMessage({
                    type: 'SYNC_MUSIC_STATE',
                    ...musicState
                }, '*');
            }
        });

        setReady(true);

        // Listen for events sent from the music player iframe
        const handleIframeMessage = (event) => {
            if (!event.data || event.data.type !== 'MUSIC_PLAYER_ACTION') return;
            const { action, ...payload } = event.data;

            if (newSocket && newSocket.connected) {
                if (action === 'play') {
                    newSocket.emit('music:play', payload);
                } else if (action === 'pause') {
                    newSocket.emit('music:pause', payload);
                } else if (action === 'seek') {
                    newSocket.emit('music:seek', payload);
                } else if (action === 'changeTrack') {
                    newSocket.emit('music:changeTrack', payload);
                }
            }
        };

        window.addEventListener('message', handleIframeMessage);

        // Cleanup
        return () => {
            window.removeEventListener('message', handleIframeMessage);
            newSocket.disconnect();
        };
    }, [location.search, navigate]);

    // Auto-scroll to bottom of chat
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
            if (socket) socket.disconnect();
            navigate('/musicparty');
        }
    };

    // Construct Music Player URL
    const MUSIC_PLAYER_BASE_URL =
        process.env.REACT_APP_MUSIC_PLAYER_URL ||
        (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
            ? 'http://localhost:3000'
            : 'https://rhytmic-realm-tgx5.vercel.app');
    const musicPlayerUrl = `${MUSIC_PLAYER_BASE_URL}/?room=${encodeURIComponent(room)}`;

    if (!ready) return <div style={{ color: 'white', textAlign: 'center', marginTop: '50px' }}>Connecting to Realm...</div>;

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
                        ref={iframeRef}
                        src={musicPlayerUrl}
                        className={styles.musicPlayerFrame}
                        title="Music Player"
                        allow="autoplay"
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
