import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const NAV = [
  { to: '/', label: 'Dashboard', roles: ['admin', 'security'], end: true },
  { to: '/scan', label: 'Scan pass', roles: ['admin', 'security'] },
  { to: '/appointments', label: 'Appointments', roles: ['admin', 'security', 'host', 'visitor'] },
  { to: '/appointments/new', label: (r) => (r === 'visitor' ? 'Pre-register a visit' : r === 'host' ? 'Invite a visitor' : 'Register walk-in'), roles: ['admin', 'security', 'host', 'visitor'] },
  { to: '/my-passes', label: 'My passes', roles: ['visitor'] },
  { to: '/visitors', label: 'Visitors', roles: ['admin', 'security'] },
  { to: '/logs', label: 'Visit logs', roles: ['admin', 'security'] },
  { to: '/users', label: 'Users', roles: ['admin'] },
  { to: '/audit', label: 'Audit trail', roles: ['admin'] },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-slot" />
          Visitor Desk
        </div>
        <nav>
          {NAV.filter((n) => n.roles.includes(user.role)).map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end}>
              {typeof n.label === 'function' ? n.label(user.role) : n.label}
            </NavLink>
          ))}
        </nav>
        <div className="me">
          <strong>{user.name}</strong>
          <span>{user.role}</span>
          <button className="btn ghost small" onClick={() => { logout(); navigate('/login'); }}>
            Sign out
          </button>
        </div>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
