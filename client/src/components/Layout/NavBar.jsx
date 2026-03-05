import { Zap, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './NavBar.css';

export default function NavBar() {
  const { user } = useAuth();

  return (
    <nav className="navbar" aria-label="Main navigation">
      <div className="navbar__inner">
        <div className="navbar__brand">
          <div className="navbar__logo">
            <Zap size={16} fill="currentColor" />
          </div>
          <span className="navbar__wordmark">snappy</span>
        </div>
        <div className="navbar__avatar">
          {user?.picture ? (
            <img src={user.picture} alt={user.name} />
          ) : (
            <User size={16} />
          )}
        </div>
      </div>
    </nav>
  );
}
