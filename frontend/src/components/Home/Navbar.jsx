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

  return (
    <div>
      <nav>
        <div className={styles.nav}>
          <ul className='navlist'>
            <div>
              <li>Rhythmic Realm </li>
            </div>
            <li><Link className={styles.linkel} to="/">Home</Link></li>
            <li><Link className={styles.linkel} to="/about">About</Link></li>
            <li><Link className={styles.linkel} to="/signup">Sign Up</Link></li>
            <li><Link to="http://localhost:3009/" className={styles.linkel}><FaMusic />Music Party</Link></li>
            <li><Link to="/profile" className={styles.linkel}><FaUserCircle style={{ fontSize: '2em' }} /></Link></li>
            <div>
            </div>
          </ul>
        </div>
      </nav>
    </div>
  );
}

export default Navbar;
