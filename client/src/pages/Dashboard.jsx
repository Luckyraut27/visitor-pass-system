import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errMsg, fmtTime } from '../api';
import { Avatar, Empty, ErrorBox } from '../components/Bits';

export default function Dashboard() {
  const [s, setS] = useState(null);
  const [error, setError] = useState('');

  const load = () => api.get('/dashboard/stats').then((r) => setS(r.data)).catch((e) => setError(errMsg(e)));
  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, []);

  if (error) return <ErrorBox msg={error} />;
  if (!s) return <p className="muted">Loading…</p>;
  const max = Math.max(1, ...s.last7.map((d) => d.count));

  return (
    <>
      <div className="page-head"><h1>Today at the front desk</h1></div>

      <section className="inside-hero">
        <div className="count">{s.insideCount}</div>
        <div>
          <strong>{s.insideCount === 1 ? 'visitor is' : 'visitors are'} inside the building right now</strong>
          <p className="muted">{s.checkInsToday} check-ins today · {s.activePasses} passes active</p>
        </div>
        <Link className="btn" to="/scan">Scan a pass</Link>
      </section>

      <div className="stats">
        <Link to="/appointments" className="stat"><b>{s.pending}</b><span>awaiting host approval</span></Link>
        <div className="stat"><b>{s.appointmentsToday}</b><span>appointments today</span></div>
        <div className="stat"><b>{s.byStatus.approved || 0}</b><span>approved in total</span></div>
        <div className="stat"><b>{(s.byStatus.rejected || 0) + (s.byStatus.cancelled || 0)}</b><span>rejected or cancelled</span></div>
      </div>

      <div className="grid-2">
        <section className="card">
          <h2>Check-ins, last 7 days</h2>
          <div className="bars">
            {s.last7.map((d) => (
              <div className="bar-col" key={d.date}>
                <span className="bar-val">{d.count}</span>
                <div className="bar" style={{ height: `${(d.count / max) * 100}%` }} />
                <span className="bar-lbl">{new Date(d.date).toLocaleDateString('en-GB', { weekday: 'short' })}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="card">
          <h2>Currently inside</h2>
          {s.insideNow.length === 0 ? (
            <Empty>No visitors on site. Scan a pass to check someone in.</Empty>
          ) : (
            <ul className="list">
              {s.insideNow.map((l) => (
                <li key={l._id}>
                  <Avatar visitor={l.visitor} />
                  <div><strong>{l.visitor?.name}</strong><span className="muted">{l.visitor?.company || 'Guest'} · to see {l.appointment?.host?.name || '-'}</span></div>
                  <span className="muted">since {fmtTime(l.at)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
