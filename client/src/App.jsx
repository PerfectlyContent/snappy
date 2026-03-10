import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AppShell from './components/Layout/AppShell';
import Welcome from './pages/Welcome';
import Home from './pages/Home';
import Result from './pages/Result';
import Activity from './pages/Activity';
import Notes from './pages/Notes';
import DailySnap from './pages/DailySnap';
import Settings from './pages/Settings';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';

function AppRoutes() {
  const location = useLocation();
  const isWelcome = location.pathname === '/welcome';

  if (isWelcome) {
    return <Welcome />;
  }

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/result" element={<Result />} />
        <Route path="/daily" element={<DailySnap />} />
        <Route path="/notes" element={<Notes />} />
        <Route path="/activity" element={<Activity />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
      </Routes>
    </AppShell>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
