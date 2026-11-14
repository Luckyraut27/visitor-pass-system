import { useEffect, useState } from 'react';
import api, { downloadFile, errMsg, fmtDate } from '../api';
import { Avatar, Empty, ErrorBox } from '../components/Bits';

export default function Logs() {
  const [f, setF] = useState({ q: '', action: '', from: '', to: '', location: '' });
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const set = (k) => (e) => { setF({ ...f, [k]: e.target.value }); setPage(1); };
  const params = () => Object.fromEntries(Object.entries(f).filter(([, v]) => v));

  useEffect(() => {
    const t = setTimeout(() => {
      api.get('/checkins', { params: { ...params(), page } }).then((r) => setData(r.data)).catch((e) => setError(errMsg(e)));
    }, 250);
    return () => clearTimeout(t);
  }, [f, page]); // eslint-disable-line

  return (
    <>
      <div className="page-head">
        <h1>Visit logs</h1>
        <button className="btn" onClick={() => downloadFile('/checkins/export', 'visitor-logs.csv', params()).catch((e) => setError(errMsg(e)))}>Export CSV</button>
      </div>
      <div className="filters">
        <input placeholder="Search name, email, company…" value={f.q} onChange={set('q')} />
        <select value={f.action} onChange={set('action')}>
          <option value="">Check-in and out</option><option value="in">Check-in only</option><option value="out">Check-out only</option>
        </select>
        <input placeholder="Location" value={f.location} onChange={set('location')} />
        <label className="inline">From <input type="date" value={f.from} onChange={set('from')} /></label>
        <label className="inline">To <input type="date" value={f.to} onChange={set('to')} /></label>
      </div>
      <ErrorBox msg={error} />
      {!data ? <p className="muted">Loading…</p> : data.items.length === 0 ? <Empty>No logs match these filters.</Empty> : (
        <>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Time</th><th>Visitor</th><th>Event</th><th>Host</th><th>Location</th><th>Recorded by</th></tr></thead>
              <tbody>
                {data.items.map((l) => (
                  <tr key={l._id}>
                    <td>{fmtDate(l.at)}</td>
                    <td><div className="cell"><Avatar visitor={l.visitor} /><div><strong>{l.visitor?.name}</strong><span className="muted">{l.visitor?.company || l.visitor?.email}</span></div></div></td>
                    <td><span className={`tag tag-${l.action}`}>{l.action === 'in' ? 'Check-in' : 'Check-out'}</span></td>
                    <td>{l.appointment?.host?.name || '-'}</td>
                    <td>{l.location}</td>
                    <td>{l.by?.name || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="pager">
            <button className="btn ghost small" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
            <span>Page {data.page} of {data.pages} · {data.total} records</span>
            <button className="btn ghost small" disabled={page >= data.pages} onClick={() => setPage(page + 1)}>Next</button>
          </div>
        </>
      )}
    </>
  );
}
