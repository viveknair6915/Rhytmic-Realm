import styles from "../About/About.module.css"
export function About() {
  return (
    <div class={styles.complete}>  
        <div class={styles.data}>
            <article>
                <h1>About Us</h1>
                <img src="https://as2.ftcdn.net/v2/jpg/01/06/47/61/1000_F_106476142_zMZkkTkhMeq0DIjV20oJI00e3QXLYIGN.jpg" alt="Description of the image" />
                <blockquote>
                    "Welcome to RHYTHMIC REALM, where the rhythm meets your soul! We are more than just a music app: we're your personal gateway to a world of endless melodies, diverse genres, and unparalleled musical experiences. At RHYTHM REALM ,we strive to create a space where music enthusiasts, trendsetters, friends and casual listeners come together to listen and chat. Connect with fellow music lovers, share playlists, and engage in discussions about the songs that resonate with you.Together, let's amplify the joy, the emotion, and the connection that music brings to our lives. Welcome to a symphony of endless possibilities at RHYTHMIC REALM."
                </blockquote>
                
            </article>
        </div>
    </div>
  )
}

export default About
