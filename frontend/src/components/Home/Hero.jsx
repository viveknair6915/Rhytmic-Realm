import React, { useEffect } from 'react';
import styles from './Hero.module.css';
import { FaMusic } from 'react-icons/fa';
import gsap from 'gsap';

const getMusicPlayerUrl = () => {
  if (process.env.REACT_APP_MUSIC_PLAYER_URL) {
    return process.env.REACT_APP_MUSIC_PLAYER_URL;
  }
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return 'http://localhost:3000';
  }
  return 'https://rhytmic-realm-tgx5.vercel.app';
};

export function Hero() {
  useEffect(() => {
    const tl = gsap.timeline();

    tl.to(`.${styles.heading} > h1`, {
      y: 30,
      opacity: 1,
      delay: 0.5,
      duration: 0.8,
      stagger: 0.8,
    });

    tl.to(`.${styles.herocta}`, {
      y: 30,
      opacity: 1,
      duration: 0.8,
      stagger: 0.8,
    });
  }, []);

  const playerUrl = getMusicPlayerUrl();

  return (
    <>
      <div className={styles.heading}>
        <h1>RHYTHMIC REALM
        <br/>WHERE VIBES MATCH</h1>
        <button className={styles.herocta}>
          <FaMusic /> <b><a href={playerUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>LISTEN NOW</a></b>
        </button>
      </div>
    </>
  );
}

export default Hero;
