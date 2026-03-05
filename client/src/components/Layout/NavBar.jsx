import { User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './NavBar.css';

export default function NavBar() {
  const { user } = useAuth();

  return (
    <nav className="navbar" aria-label="Main navigation">
      <div className="navbar__inner">
        <div className="navbar__brand">
          <img className="navbar__logo" src="/logo.svg" alt="Snappy" />
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
