import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './JoinPage.module.css';

const JoinPage = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.username) setUsername(parsed.username);
        if (parsed.email) setEmail(parsed.email);
      }
    } catch (_) {}
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const enteredUsername = username.trim() || e.target.username.value;
    const room = e.target.room.value;

    // Redirect to the chat page with the provided username and room
    navigate(`/chat?username=${encodeURIComponent(enteredUsername)}&room=${encodeURIComponent(room)}`);
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
            <label htmlFor="email">Email</label>
            <input
              type="email"
              name="email"
              id="email"
              placeholder="abc@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-control">
            <label htmlFor="room">Room</label>
            <select name="room" id="room" required>
              <option value="">Select The Singer</option>
              <option value="Taylor-Swift">Taylor Swift</option>
              <option value="Harry-Styles">Harry Styles</option>
              <option value="mitski">mitski</option>
              <option value="The-Weekend">The-Weekend</option>
              <option value="OneRepublic">OneRepublic</option>
              <option value="OneScript">OneScript</option>
            </select>
          </div>
          <button type="submit" className={styles.btn}>
            Join Chat
          </button>
        </form>
      </main>
    </div>
  );
};

export default JoinPage;
