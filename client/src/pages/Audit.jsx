import { useEffect, useState } from 'react';
import api, { errMsg, fmtDate } from '../api';
import { Empty, ErrorBox } from '../components/Bits';

export default function Audit() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { api.get('/audit').then((r) => setItems(r.data)).catch((e) => setError(errMsg(e))); }, []);
  return (
    <>
      <div className="page-head"><h1>Audit trail</h1></div>
      <ErrorBox msg={error} />
      {!items ? <p className="muted">Loading…</p> : items.length === 0 ? <Empty>No activity recorded yet.</Empty> : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Time</th><th>User</th><th>Action</th><th>Details</th></tr></thead>
            <tbody>
              {items.map((a) => (
                <tr key={a._id}><td>{fmtDate(a.at)}</td><td>{a.user?.name || '-'}<span className="muted">{a.user?.role}</span></td><td>{a.action}</td><td>{a.details || a.entityId || ''}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
