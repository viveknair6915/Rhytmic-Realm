import React, { useEffect } from 'react';
import styles from './Hero.module.css';
import { FaMusic } from 'react-icons/fa';
import gsap from 'gsap';

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
  
  return (
    <>
      <div className={styles.heading}>
        <h1>RHYTHMIC REALM
        <br/>WHERE VIBES MATCH</h1>
        <button className={styles.herocta}>
          <FaMusic /> <b><a href="http://localhost:3000/">LISTEN NOW</a></b>
        </button>
      </div>
    </>
  );
}
