import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Welcome.css';

export default function Welcome() {
  const navigate = useNavigate();
  const { authenticated, loading, login } = useAuth();
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setEntered(true));
  }, []);

  // If already authenticated, skip to home
  useEffect(() => {
    if (!loading && authenticated) {
      navigate('/', { replace: true });
    }
  }, [authenticated, loading, navigate]);

  function handleGoogleLogin() {
    login();
  }

  function handleGuestContinue(e) {
    e.preventDefault();
    sessionStorage.setItem('guest', 'true');
    navigate('/');
  }

  if (loading) return null;

  return (
    <div className={`welcome ${entered ? 'welcome--entered' : ''}`}>
      <div className="welcome__card">
        {/* Logo */}
        <div className="welcome__logo-wrap">
          <div className="welcome__logo-icon">
            <img src="/logo.svg" alt="Snappy" width="40" height="40" />
          </div>
          <h2 className="welcome__brand">Snappy</h2>
        </div>

        {/* Heading */}
        <div className="welcome__heading">
          <h1 className="welcome__title">Welcome to Snappy</h1>
          <p className="welcome__subtitle">Your peaceful, AI-powered workspace</p>
        </div>

        {/* Google Sign In (primary) */}
        <button className="welcome__google-btn" onClick={handleGoogleLogin}>
          <svg className="welcome__google-icon" width="20" height="20" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Continue with Google
        </button>

        {/* Divider */}
        <div className="welcome__divider">
          <span>or</span>
        </div>

        {/* Guest continue */}
        <button className="welcome__guest-btn" onClick={handleGuestContinue}>
          Continue without signing in
        </button>

        {/* Footer */}
        <p className="welcome__footer-text">
          Sign in to get AI-powered daily snapshots of your agenda.
        </p>
      </div>

      {/* Legal links */}
      <div className="welcome__legal">
        <a href="/privacy">Privacy Policy</a>
        <span className="welcome__legal-dot" />
        <a href="/terms">Terms of Service</a>
      </div>

      {/* Background blobs */}
      <div className="welcome__bg" aria-hidden="true">
        <div className="welcome__blob welcome__blob--1" />
        <div className="welcome__blob welcome__blob--2" />
        <div className="welcome__blob welcome__blob--3" />
      </div>
    </div>
  );
}
