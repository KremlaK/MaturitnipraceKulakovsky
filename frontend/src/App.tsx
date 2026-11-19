import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CarDetailPage from './pages/CarDetailPage';
import GaragePage from './pages/GaragePage';
import CarOverviewPage from './pages/CarOverviewPage';
import AccountPage from './pages/AccountPage';
import HelpPage from './pages/HelpPage';
import ReviewsPage from './pages/ReviewsPage';
import MapPage from './pages/MapPage';
import AccountActionPage from './pages/AccountActionPage';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, offline, refreshUser } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-ink-muted">Načítám…</p>
      </div>
    );
  }

  if (!user && offline) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <p className="font-display font-bold text-2xl">Server je nedostupný</p>
          <p className="text-ink-muted mt-2">Nepodařilo se spojit s aplikací. Zkontroluj připojení, nebo to zkus za chvíli.</p>
          <button onClick={() => refreshUser()} className="mt-5 h-11 px-5 rounded bg-accent text-on-accent label-caps">Zkusit znovu</button>
        </div>
      </div>
    );
  }

  if (!user) {
    // po přihlášení se vrátíme tam, kam uživatel chtěl
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/verify-email" element={<AccountActionPage key="verify-email" action="verify-email" />} />
            <Route path="/forgot-password" element={<AccountActionPage key="forgot-password" action="forgot-password" />} />
            <Route path="/reset-password" element={<AccountActionPage key="reset-password" action="reset-password" />} />
            <Route path="/dashboard" element={<PrivateRoute><GaragePage /></PrivateRoute>} />
            <Route path="/cars" element={<Navigate to="/dashboard" replace />} />
            <Route path="/cars/:id" element={<PrivateRoute><CarOverviewPage /></PrivateRoute>} />
            <Route path="/cars/:id/kniha" element={<PrivateRoute><CarDetailPage /></PrivateRoute>} />
            <Route path="/map" element={<PrivateRoute><MapPage /></PrivateRoute>} />
            <Route path="/account" element={<PrivateRoute><AccountPage /></PrivateRoute>} />
            <Route path="/help" element={<PrivateRoute><HelpPage /></PrivateRoute>} />
            <Route path="/reviews" element={<PrivateRoute><ReviewsPage /></PrivateRoute>} />
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;