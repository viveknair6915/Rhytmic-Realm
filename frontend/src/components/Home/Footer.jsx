// Footer.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { FaGithub } from "react-icons/fa";
import styles from './Footer.module.css'; // Import the styles

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.contact}>
        <Link to="https://github.com/viveknair6915" className={styles.link}><FaGithub />Vivek Nair</Link>
        <Link to="https://github.com/vanshiz" target="_blank" rel="noopener noreferrer" className={styles.link}><FaGithub />Vanshika B.</Link>
      </div>
      <div className={styles.copyright}>
        <p>&copy; 2024 Rhythm Realm</p>
      </div>
    </footer>
  );
};

export default Footer;
