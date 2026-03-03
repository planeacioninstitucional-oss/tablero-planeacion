import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useApp } from './context';
import logoImg from './assets/logo.PNG';

const nav = [
    { to: '/', icon: 'dashboard', label: 'Panel Central' },
    { to: '/responsabilidades', icon: 'track_changes', label: 'Control de actividades' },
    { to: '/mis-misiones', icon: 'assignment_turned_in', label: 'Mis Misiones' },
];
const workspace = [
    { to: '/idea-lab', icon: 'lightbulb', label: 'Ideas Lab' },
    { to: '/oracle-chat', icon: 'chat_bubble', label: 'Oracle Chat' },
];

const avatarColors = ['#6C63FF', '#00D4AA', '#FF6B35', '#FFD166', '#FF6B9D'];
const getColor = (name) => avatarColors[name?.charCodeAt(0) % avatarColors.length] || '#6C63FF';

export default function Layout({ children }) {
    const { user, signOut } = useApp();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Theme logic
    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');
    const navigate = useNavigate();

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    };

    return (
        <div className="app-layout">
            <div className={'sidebar-overlay' + (sidebarOpen ? ' show' : '')} onClick={() => setSidebarOpen(false)} />
            <aside className={'sidebar' + (sidebarOpen ? ' open' : '')}>
                <div className="sidebar-logo">
                    <div className="logo-badge">
                        <img src={logoImg} alt="Logo" style={{ width: 44, height: 44, objectFit: 'contain' }} />
                        <div>
                            <div className="logo-text">PLANEACION <span>INSTITUCIONAL</span></div>
                            <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>Tablero de mando</div>
                        </div>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <div className="nav-section-label">Principal</div>
                    {nav.map(({ to, icon, label }) => (
                        <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')} onClick={() => setSidebarOpen(false)}>
                            <span className="material-icons nav-icon">{icon}</span>
                            {label}
                        </NavLink>
                    ))}
                    <div className="nav-section-label" style={{ marginTop: 8 }}>Workspace</div>
                    {workspace.map(({ to, icon, label }) => (
                        <NavLink key={to} to={to} className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')} onClick={() => setSidebarOpen(false)}>
                            <span className="material-icons nav-icon">{icon}</span>
                            {label}
                        </NavLink>
                    ))}
                </nav>
                <div className="sidebar-user">
                    <div className="user-card" title="Perfil">
                        <div className="user-avatar" style={{ background: getColor(user?.nombre) }}>
                            {user?.nombre?.charAt(0) || 'U'}
                        </div>
                        <div className="user-info">
                            <div className="user-name">{user?.nombre || 'Usuario'}</div>
                            <div className="user-role">{user?.rol === 'jefe' ? 'Jefe de Oficina' : 'Funcionario'}</div>
                        </div>
                        <span className={'role-badge ' + (user?.rol === 'jefe' ? 'badge-jefe' : 'badge-func')}>
                            {user?.rol === 'jefe' ? 'JEFE' : 'FUNC'}
                        </span>
                    </div>
                    <button onClick={handleLogout} className="btn btn-secondary" style={{ width: '100%', marginTop: 12, justifyContent: 'center', fontSize: '0.8rem' }}>
                        <span className="material-icons" style={{ fontSize: 18 }}>logout</span> Cerrar sesión
                    </button>
                </div>
            </aside>

            <div className="main-content">
                <header className="topbar">
                    <button className="hamburger icon-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
                        <span className="material-icons">{sidebarOpen ? 'close' : 'menu'}</span>
                    </button>
                    <div style={{ flex: 1 }} />
                    <div className="topbar-actions">
                        <button className="icon-btn" title="Alternar tema claro/oscuro" onClick={toggleTheme}>
                            <span className="material-icons">{theme === 'light' ? 'dark_mode' : 'light_mode'}</span>
                        </button>
                        <button className="icon-btn" title="Notificaciones">
                            <span className="material-icons">notifications_none</span>
                        </button>
                        <button className="icon-btn" title="Ayuda">
                            <span className="material-icons">help_outline</span>
                        </button>
                    </div>
                </header>
                <main className="fade-in">{children}</main>
            </div>
        </div >
    );
}
