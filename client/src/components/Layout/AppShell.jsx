import NavBar from './NavBar';
import BottomNav from './BottomNav';
import './AppShell.css';

export default function AppShell({ children }) {
  return (
    <div className="app-shell">
      <NavBar />
      <main className="app-shell__content">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
