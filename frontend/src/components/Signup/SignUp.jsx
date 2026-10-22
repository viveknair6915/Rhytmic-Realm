import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaGoogle, FaEnvelope, FaLock, FaUser } from 'react-icons/fa';
import styles from './SignUp.module.css';

const SignUp = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(false); // Default to Sign Up
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3009';

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setFormData({ username: '', email: '', password: '' });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: formData.email, password: formData.password })
        });

        const data = await res.json();

        if (res.ok) {
          if (data.token) localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          navigate('/musicparty');
        } else {
          alert(data.message || 'Login failed. Please check your credentials.');
        }
      } else {
        const res = await fetch(`${BACKEND_URL}/api/auth/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: formData.username,
            email: formData.email,
            password: formData.password
          })
        });

        const data = await res.json();

        if (res.ok) {
          alert("Account created successfully! Please sign in with your credentials.");
          setIsLogin(true);
          setFormData({ username: '', email: formData.email, password: '' });
        } else {
          alert(data.message || 'Registration failed.');
        }
      }
    } catch (err) {
      console.error(err);
      alert("Unable to connect to server. Please ensure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    const email = prompt("Enter your Google Account email to authenticate via Google OAuth:");
    if (!email) return;

    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          username: email.split('@')[0]
        })
      });

      const data = await res.json();
      if (res.ok) {
        if (data.token) localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        navigate('/musicparty');
      } else {
        alert(data.message || "Google sign-in requires GOOGLE_CLIENT_ID configuration on server.");
      }
    } catch (err) {
      alert("Google sign-in endpoint error: " + err.message);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    const email = prompt("Enter your registered email address to receive password reset instructions:");
    if (!email) return;

    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      alert(data.message + (data.devResetToken ? `\n[Development Reset Token]: ${data.devResetToken}` : ''));
    } catch (err) {
      alert("Error requesting password reset: " + err.message);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.glassCard}>
        <div className={styles.header}>
          <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
          <p>{isLogin ? 'Enter your details to sign in' : 'Sign up to get started!'}</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          {!isLogin && (
            <div className={styles.inputGroup}>
              <FaUser className={styles.icon} />
              <input
                type="text"
                name="username"
                placeholder="Username"
                value={formData.username}
                onChange={handleInputChange}
                required={!isLogin}
              />
            </div>
          )}
          <div className={styles.inputGroup}>
            <FaEnvelope className={styles.icon} />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className={styles.inputGroup}>
            <FaLock className={styles.icon} />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleInputChange}
              required
            />
          </div>

          {isLogin && (
            <a href="#forgot" onClick={handleForgotPassword} className={styles.forgotPass}>
              Forgot Password?
            </a>
          )}

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Sign Up')}
          </button>

          <div className={styles.divider}>
            <span>OR</span>
          </div>

          <button type="button" className={styles.googleBtn} onClick={handleGoogleSignIn}>
            <FaGoogle className={styles.googleIcon} />
            Sign in with Google
          </button>
        </form>

        <div className={styles.footer}>
          <p>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button className={styles.toggleBtn} onClick={toggleMode}>
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;