import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './JoinPage.module.css';
import { Link } from 'react-router-dom';

const JoinPage = () => {
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    const username = e.target.username.value;
    const email = e.target.email.value;
    const room = e.target.room.value;

    // Redirect to the chat page with the provided username and room
    navigate(`/chat?username=${username}&room=${room}`);
  };

  return (
    <div className={styles.joincontainer}>
      <header className={styles.joinheader}>
        <h1 className={styles.heading}>Rhythm Realm</h1>
      </header>
      <main className={styles.joinmain}>
        <form>
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
            <label htmlFor="email">Email</label>
            <input
              type="email"
              name="email"
              id="email"
              placeholder="abc@gmail.com"
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
            <a href="../../../../../backend/server.js">Join Chat</a>
          </button>
        </form>
      </main>
    </div>
  );
};

export default JoinPage;
