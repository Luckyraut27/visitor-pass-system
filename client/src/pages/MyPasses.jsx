import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { downloadFile, errMsg, fmtDate } from '../api';
import { Empty, ErrorBox, Status } from '../components/Bits';

export default function MyPasses() {
  const [passes, setPasses] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { api.get('/passes/mine').then((r) => setPasses(r.data)).catch((e) => setError(errMsg(e))); }, []);

  return (
    <>
      <div className="page-head"><h1>My passes</h1><Link className="btn" to="/appointments/new">Pre-register a visit</Link></div>
      <ErrorBox msg={error} />
      {!passes ? <p className="muted">Loading…</p> : passes.length === 0 ? (
        <Empty>No passes yet. Pre-register a visit; once your host approves it, your QR pass appears here.</Empty>
      ) : (
        <div className="badges">
          {passes.map((p) => (
            <article className={`badge-card ${p.state}`} key={p._id}>
              <div className="lanyard"><span /></div>
              <h2>{p.visitor.name}</h2>
              <p className="muted">{p.visitor.company || 'Guest'}</p>
              <img className="qr" src={p.qr} alt="Pass QR code" />
              <p className="code">{p.code}</p>
              <dl>
                <dt>Host</dt><dd>{p.appointment?.host?.name || '-'}</dd>
                <dt>Valid</dt><dd>{fmtDate(p.validFrom)} to {fmtDate(p.validUntil)}</dd>
              </dl>
              <Status value={p.state} />
              <button className="btn small" onClick={() => downloadFile(`/passes/${p._id}/pdf`, 'visitor-pass.pdf').catch((e) => setError(errMsg(e)))}>Download badge PDF</button>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
