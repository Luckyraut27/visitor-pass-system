import { useEffect, useState } from 'react';
import api, { errMsg } from '../api';
import { Avatar, Empty, ErrorBox } from '../components/Bits';

export default function Visitors() {
  const [q, setQ] = useState('');
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    const t = setTimeout(() => api.get('/visitors', { params: { q: q || undefined } }).then((r) => setItems(r.data)).catch((e) => setError(errMsg(e))), 250);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <>
      <div className="page-head"><h1>Visitors</h1></div>
      <div className="filters"><input placeholder="Search name, email, phone, company…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      <ErrorBox msg={error} />
      {!items ? <p className="muted">Loading…</p> : items.length === 0 ? <Empty>No visitors found.</Empty> : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Visitor</th><th>Email</th><th>Phone</th><th>Company</th></tr></thead>
            <tbody>
              {items.map((v) => (
                <tr key={v._id}>
                  <td><div className="cell"><Avatar visitor={v} /><strong>{v.name}</strong></div></td>
                  <td>{v.email}</td><td>{v.phone || '-'}</td><td>{v.company || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
