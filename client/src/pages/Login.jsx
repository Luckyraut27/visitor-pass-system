import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, homeFor } from '../AuthContext';
import { errMsg } from '../api';
import { ErrorBox } from '../components/Bits';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const u = await login(form.email, form.password);
      navigate(homeFor(u.role));
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  const demo = (email, password) => setForm({ email, password });

  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={submit}>
        <div className="brand dark"><span className="brand-slot" />Visitor Desk</div>
        <h1>Sign in</h1>
        <ErrorBox msg={error} />
        <label>Email<input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
        <label>Password<input type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>
        <button className="btn" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
        <p className="muted">New visitor? <Link to="/register">Create an account</Link></p>
        <div className="demo">
          <span>Demo accounts (after running the seed script)</span>
          <div>
            <button type="button" onClick={() => demo('admin@example.com', 'Admin@123')}>Admin</button>
            <button type="button" onClick={() => demo('security@example.com', 'Security@123')}>Security</button>
            <button type="button" onClick={() => demo('host@example.com', 'Host@123')}>Host</button>
            <button type="button" onClick={() => demo('visitor@example.com', 'Visitor@123')}>Visitor</button>
          </div>
        </div>
      </form>
    </div>
  );
}
