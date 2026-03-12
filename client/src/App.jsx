import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppShell from './components/Layout/AppShell';
import Onboarding from './pages/Onboarding';
import Welcome from './pages/Welcome';
import Home from './pages/Home';
import Result from './pages/Result';
import Activity from './pages/Activity';
import Notes from './pages/Notes';
import DailySnap from './pages/DailySnap';
import Library from './pages/Library';
import Settings from './pages/Settings';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';

function AppRoutes() {
  const location = useLocation();
  const { authenticated, loading } = useAuth();
  const isWelcome = location.pathname === '/welcome';
  const isOnboarding = location.pathname === '/onboarding';

  if (loading) return null;

  if (isOnboarding) {
    if (authenticated || localStorage.getItem('snappy_onboarded')) {
      return <Navigate to="/" replace />;
    }
    return <Onboarding />;
  }

  if (isWelcome) {
    return <Welcome />;
  }

  // First-time visitors: show onboarding, then welcome
  if (!authenticated && location.pathname === '/' && !localStorage.getItem('snappy_visited')) {
    if (!localStorage.getItem('snappy_onboarded')) {
      return <Navigate to="/onboarding" replace />;
    }
    return <Navigate to="/welcome" replace />;
  }

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/result" element={<Result />} />
        <Route path="/daily" element={<DailySnap />} />
        <Route path="/notes" element={<Notes />} />
        <Route path="/library" element={<Library />} />
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
