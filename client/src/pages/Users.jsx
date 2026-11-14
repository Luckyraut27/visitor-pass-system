import { useEffect, useState } from 'react';
import api, { errMsg } from '../api';
import { useAuth } from '../AuthContext';
import { ErrorBox } from '../components/Bits';

const ROLES = ['admin', 'security', 'host', 'visitor'];
const blank = { name: '', email: '', password: '', role: 'security', phone: '', department: '' };

export default function Users() {
  const { user: me } = useAuth();
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(blank);
  const [error, setError] = useState('');
  const load = () => api.get('/users').then((r) => setItems(r.data)).catch((e) => setError(errMsg(e)));
  useEffect(() => { load(); }, []);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const run = async (fn) => { setError(''); try { await fn(); await load(); } catch (e) { setError(errMsg(e)); } };

  return (
    <>
      <div className="page-head"><h1>Users and staff</h1></div>
      <ErrorBox msg={error} />
      <form className="card form-grid" onSubmit={(e) => { e.preventDefault(); run(async () => { await api.post('/users', form); setForm(blank); }); }}>
        <h2 className="span-2">Add a user</h2>
        <label>Name<input required value={form.name} onChange={set('name')} /></label>
        <label>Email<input type="email" required value={form.email} onChange={set('email')} /></label>
        <label>Temporary password<input required minLength={6} value={form.password} onChange={set('password')} /></label>
        <label>Role<select value={form.role} onChange={set('role')}>{ROLES.map((r) => <option key={r}>{r}</option>)}</select></label>
        <label>Mobile number<input value={form.phone} onChange={set('phone')} /></label>
        <label>Department<input value={form.department} onChange={set('department')} /></label>
        <div className="span-2"><button className="btn">Add user</button></div>
      </form>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Department</th><th>Status</th></tr></thead>
          <tbody>
            {items.map((u) => (
              <tr key={u._id}>
                <td><strong>{u.name}</strong></td><td>{u.email}</td>
                <td>
                  <select disabled={u._id === me._id} value={u.role} onChange={(e) => run(() => api.patch(`/users/${u._id}`, { role: e.target.value }))}>
                    {ROLES.map((r) => <option key={r}>{r}</option>)}
                  </select>
                </td>
                <td>{u.department || '-'}</td>
                <td>
                  <button disabled={u._id === me._id} className={`btn small ${u.active ? 'ghost' : ''}`} onClick={() => run(() => api.patch(`/users/${u._id}`, { active: !u.active }))}>
                    {u.active ? 'Disable' : 'Enable'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
