import styles from './Info.module.css'
import { useEffect } from 'react';
import gsap from 'gsap';
import { BsFillSearchHeartFill } from "react-icons/bs";
function Info(){
    useEffect(() => {
        const tl = gsap.timeline();
    
        
    
        tl.to(`.${styles.parent} > h1`, {
          y: 10,
          opacity: 1,
          delay: 2,
          duration: 0.8,
          stagger: 0.8,
        });
    
        tl.to(`.${styles.infocta}`, {
            y: 8,
            
            opacity: 1,
            duration: 0.8,
            stagger: 0.8,
          });
        
      }, []);
    return(
        <div className={styles.parent}>
            <h1>KNOW WHAT YOUR <br />
            BUDDIES ARE LISTENIN'</h1>
           <button className={styles.infocta}>
          < BsFillSearchHeartFill /> <b>FIND OUT</b>
        </button>
        </div>
    )
}
export default Info;