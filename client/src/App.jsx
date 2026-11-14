import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth, homeFor } from './AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Appointments from './pages/Appointments';
import NewAppointment from './pages/NewAppointment';
import MyPasses from './pages/MyPasses';
import Scanner from './pages/Scanner';
import Logs from './pages/Logs';
import Visitors from './pages/Visitors';
import Users from './pages/Users';
import Audit from './pages/Audit';

function Guard({ roles, children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="center-screen">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to={homeFor(user.role)} replace />;
  return children;
}

export default function App() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={homeFor(user.role)} replace /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to={homeFor(user.role)} replace /> : <Register />} />
      <Route element={<Guard><Layout /></Guard>}>
        <Route path="/" element={<Guard roles={['admin', 'security']}><Dashboard /></Guard>} />
        <Route path="/appointments" element={<Appointments />} />
        <Route path="/appointments/new" element={<NewAppointment />} />
        <Route path="/my-passes" element={<Guard roles={['visitor']}><MyPasses /></Guard>} />
        <Route path="/scan" element={<Guard roles={['admin', 'security']}><Scanner /></Guard>} />
        <Route path="/logs" element={<Guard roles={['admin', 'security']}><Logs /></Guard>} />
        <Route path="/visitors" element={<Guard roles={['admin', 'security']}><Visitors /></Guard>} />
        <Route path="/users" element={<Guard roles={['admin']}><Users /></Guard>} />
        <Route path="/audit" element={<Guard roles={['admin']}><Audit /></Guard>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
