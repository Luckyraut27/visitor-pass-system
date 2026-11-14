import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { downloadFile, errMsg, fmtDate } from '../api';
import { useAuth } from '../AuthContext';
import { Avatar, Empty, ErrorBox, Status } from '../components/Bits';

export default function Appointments() {
  const { user } = useAuth();
  const [items, setItems] = useState(null);
  const [status, setStatus] = useState('');
  const [date, setDate] = useState('');
  const [error, setError] = useState('');

  const load = () =>
    api
      .get('/appointments', { params: { status: status || undefined, date: date || undefined } })
      .then((r) => setItems(r.data))
      .catch((e) => setError(errMsg(e)));
  useEffect(() => { load(); }, [status, date]); // eslint-disable-line

  const act = async (fn) => {
    setError('');
    try { await fn(); await load(); } catch (e) { setError(errMsg(e)); }
  };
  const setApptStatus = (id, s) => act(() => api.patch(`/appointments/${id}/status`, { status: s }));
  const issue = (id) => act(() => api.post('/passes', { appointmentId: id }));
  const canDecide = (a) => a.status === 'pending' && (user.role === 'admin' || (user.role === 'host' && a.host?._id === user._id));
  const staff = ['admin', 'security'].includes(user.role);

  return (
    <>
      <div className="page-head">
        <h1>Appointments</h1>
        <Link className="btn" to="/appointments/new">{user.role === 'visitor' ? 'Pre-register a visit' : user.role === 'host' ? 'Invite a visitor' : 'Register walk-in'}</Link>
      </div>
      <div className="filters">
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {['pending', 'approved', 'rejected', 'cancelled'].map((s) => <option key={s}>{s}</option>)}
        </select>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        {date && <button className="btn ghost small" onClick={() => setDate('')}>Clear date</button>}
      </div>
      <ErrorBox msg={error} />
      {!items ? <p className="muted">Loading…</p> : items.length === 0 ? (
        <Empty>No appointments match. Use the button above to create one.</Empty>
      ) : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Visitor</th><th>Host</th><th>When</th><th>Purpose</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {items.map((a) => (
                <tr key={a._id}>
                  <td><div className="cell"><Avatar visitor={a.visitor} /><div><strong>{a.visitor?.name}</strong><span className="muted">{a.visitor?.company || a.visitor?.email}</span></div></div></td>
                  <td>{a.host?.name}<span className="muted">{a.host?.department}</span></td>
                  <td>{fmtDate(a.scheduledAt)}<span className="muted">{a.source}</span></td>
                  <td>{a.purpose}</td>
                  <td><Status value={a.status} />{a.pass && <Status value={a.pass.state} />}</td>
                  <td className="actions">
                    {canDecide(a) && (<>
                      <button className="btn small" onClick={() => setApptStatus(a._id, 'approved')}>Approve</button>
                      <button className="btn ghost small" onClick={() => setApptStatus(a._id, 'rejected')}>Reject</button>
                    </>)}
                    {staff && a.status === 'approved' && (!a.pass || ['expired', 'revoked'].includes(a.pass.state)) && (
                      <button className="btn small" onClick={() => issue(a._id)}>Issue pass</button>
                    )}
                    {a.pass && a.pass.state !== 'revoked' && (
                      <button className="btn ghost small" onClick={() => act(() => downloadFile(`/passes/${a.pass._id}/pdf`, 'visitor-pass.pdf'))}>Badge PDF</button>
                    )}
                    {staff && a.pass?.state === 'active' && (
                      <button className="btn ghost small" onClick={() => act(() => api.patch(`/passes/${a.pass._id}/revoke`))}>Revoke</button>
                    )}
                    {!['rejected', 'cancelled'].includes(a.status) && (user.role !== 'host' || a.host?._id === user._id) && (
                      <button className="btn ghost small" onClick={() => setApptStatus(a._id, 'cancelled')}>Cancel</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
