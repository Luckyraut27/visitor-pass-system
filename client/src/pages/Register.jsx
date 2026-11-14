import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, homeFor } from '../AuthContext';
import { errMsg } from '../api';
import { ErrorBox } from '../components/Bits';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const u = await register(form);
      navigate(homeFor(u.role));
    } catch (err) {
      setError(errMsg(err));
    }
  };

  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={submit}>
        <div className="brand dark"><span className="brand-slot" />Visitor Desk</div>
        <h1>Create a visitor account</h1>
        <ErrorBox msg={error} />
        <label>Full name<input required value={form.name} onChange={set('name')} /></label>
        <label>Email<input type="email" required value={form.email} onChange={set('email')} /></label>
        <label>Mobile number<input value={form.phone} onChange={set('phone')} placeholder="+91…" /></label>
        <label>Password (min 6 characters)<input type="password" minLength={6} required value={form.password} onChange={set('password')} /></label>
        <button className="btn">Create account</button>
        <p className="muted">Already registered? <Link to="/login">Sign in</Link></p>
      </form>
    </div>
  );
}
