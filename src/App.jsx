import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './AppContext';
import { useApp } from './context';
import Layout from './Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Responsabilidades from './pages/Responsabilidades';
import MisMisiones from './pages/MisMisiones';
import IdeaLab from './pages/IdeaLab';
import OracleChat from './pages/OracleChat';

function ProtectedRoute({ children }) {
  const { user, authLoading } = useApp();

  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)', flexDirection: 'column', gap: 20 }}>
        <div style={{ width: 60, height: 60, background: 'linear-gradient(135deg, #6C63FF, #00D4AA)', borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, animation: 'pulse 1.5s infinite' }}>⚡</div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Cargando Vibrant Flow...</div>
        <style>{`@keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.6;transform:scale(0.95)} }`}</style>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
}

function AppRoutes() {
  const { user, authLoading } = useApp();

  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)' }}>
        <div style={{ color: 'var(--text-muted)', fontFamily: 'Space Grotesk, sans-serif' }}>Cargando...</div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/*" element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/responsabilidades" element={<Responsabilidades />} />
                <Route path="/mis-misiones" element={<MisMisiones />} />
                <Route path="/idea-lab" element={<IdeaLab />} />
                <Route path="/oracle-chat" element={<OracleChat />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppRoutes />
    </AppProvider>
  );
}
