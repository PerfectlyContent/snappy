import { User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './NavBar.css';

export default function NavBar() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="navbar" aria-label="Main navigation">
      <div className="navbar__inner">
        <div className="navbar__brand">
          <img className="navbar__logo" src="/logo.svg" alt="Snappy" />
          <span className="navbar__wordmark">snappy</span>
        </div>
        <button className="navbar__avatar" onClick={() => navigate('/settings')} aria-label="Settings">
          {user?.picture ? (
            <img src={user.picture} alt={user.name} />
          ) : (
            <User size={16} />
          )}
        </button>
      </div>
    </nav>
  );
}
