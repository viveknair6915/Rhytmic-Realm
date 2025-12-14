import React, { useEffect } from 'react';
import { FaUserCircle } from "react-icons/fa";
import { FaMusic } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import styles from './Navbar.module.css';

export function Navbar() {
  useEffect(() => {
    // Animation for the Navbar
    gsap.from('.nav', {
      opacity: 0,
      y: -50,
      duration: 1,
      delay: 0.5,
      ease: 'power3.out',
    });
  }, []);

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div>
      <nav>
        <div className={styles.nav}>
          <ul className='navlist'>
            <li className={styles.brand}>
              <Link to="/" onClick={() => scrollToSection('home')} className={styles.linkel} style={{ fontSize: '1.5em', fontWeight: 'bold' }}>Rhythmic Realm</Link>
            </li>
            <li>
              {/* Check if we are on home page to scroll, else link to home with hash (simple Link works with hash usually but let's be explicit) */}
              <Link className={styles.linkel} to="/" onClick={() => setTimeout(() => scrollToSection('about'), 100)}>About</Link>
            </li>
            <li><Link to={process.env.REACT_APP_BACKEND_URL || "http://localhost:3009/"} className={styles.linkel}><FaMusic /> Music Party</Link></li>
            <li><Link to={process.env.REACT_APP_MUSIC_PLAYER_URL || "http://localhost:3000/"} className={styles.linkel} target="_blank"><FaMusic /> Music Player</Link></li>
            <li><Link className={styles.linkel} to="/signup">Sign Up</Link></li>
            <li><Link to="/profile" className={styles.linkel}><FaUserCircle style={{ fontSize: '1.8em' }} /></Link></li>
          </ul>
        </div>
      </nav>
    </div>
  );
}

export default Navbar;
