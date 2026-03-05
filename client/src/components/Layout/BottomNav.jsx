import { useLocation, useNavigate } from 'react-router-dom';
import { Camera, StickyNote, Clock, Settings } from 'lucide-react';
import './BottomNav.css';

const NAV_ITEMS = [
  { path: '/', icon: Camera, label: 'Snap' },
  { path: '/notes', icon: StickyNote, label: 'Notes' },
  { path: '/activity', icon: Clock, label: 'Activity' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  if (location.pathname.startsWith('/result')) return null;

  return (
    <nav className="btmnav" aria-label="Tab navigation">
      <div className="btmnav__inner">
        {NAV_ITEMS.map(({ path, icon: Icon, label }) => {
          const active = location.pathname === path;
          return (
            <button
              key={path}
              className={`btmnav__tab ${active ? 'btmnav__tab--active' : ''}`}
              onClick={() => navigate(path)}
              aria-current={active ? 'page' : undefined}
              aria-label={label}
            >
              <Icon size={20} strokeWidth={active ? 2 : 1.5} />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
