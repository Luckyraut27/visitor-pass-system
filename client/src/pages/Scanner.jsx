import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import api, { errMsg, fmtDate } from '../api';
import { Avatar } from '../components/Bits';

export default function Scanner() {
  const scanner = useRef(null);
  const busy = useRef(false);
  const [running, setRunning] = useState(false);
  const [manual, setManual] = useState('');
  const [location, setLocation] = useState(localStorage.getItem('vpms_location') || 'Main Gate');
  const [result, setResult] = useState(null);
  const [camError, setCamError] = useState('');

  const submit = async (code) => {
    if (busy.current) return;
    busy.current = true;
    try {
      const { data } = await api.post('/checkins/scan', { code, location });
      setResult({ ok: true, ...data });
    } catch (e) {
      setResult({ ok: false, message: errMsg(e, 'Scan failed') });
    } finally {
      setTimeout(() => { busy.current = false; }, 2500); // avoid double scans of the same QR
    }
  };

  const start = async () => {
    setCamError('');
    try {
      const s = new Html5Qrcode('qr-reader');
      scanner.current = s;
      await s.start({ facingMode: 'environment' }, { fps: 10, qrbox: 240 }, (text) => submit(text), () => {});
      setRunning(true);
    } catch (e) {
      setCamError('Could not open the camera. Allow camera access, or type the pass ID below.');
    }
  };

  const stop = async () => {
    const s = scanner.current;
    scanner.current = null;
    if (s) { try { await s.stop(); s.clear(); } catch { /* already stopped */ } }
    setRunning(false);
  };

  useEffect(() => () => { stop(); }, []); // eslint-disable-line

  return (
    <>
      <div className="page-head"><h1>Scan pass</h1></div>
      <div className="grid-2">
        <section className="card">
          <label>Gate / location
            <input value={location} onChange={(e) => { setLocation(e.target.value); localStorage.setItem('vpms_location', e.target.value); }} />
          </label>
          <div id="qr-reader" className="qr-reader" />
          {camError && <div className="alert error">{camError}</div>}
          {running ? <button className="btn ghost" onClick={stop}>Stop camera</button> : <button className="btn" onClick={start}>Start camera</button>}
          <form className="inline-form" onSubmit={(e) => { e.preventDefault(); if (manual.trim()) { submit(manual.trim()); setManual(''); } }}>
            <input placeholder="Or type the pass ID" value={manual} onChange={(e) => setManual(e.target.value)} />
            <button className="btn">Check</button>
          </form>
        </section>

        <section className={`card result ${result ? (result.ok ? result.action : 'bad') : ''}`}>
          {!result ? <p className="muted">Scan results appear here. The first scan checks a visitor in, the next one checks them out.</p> : result.ok ? (
            <>
              <div className="verdict">{result.action === 'in' ? 'Checked in' : 'Checked out'}</div>
              <div className="cell big"><Avatar visitor={result.visitor} size={64} /><div><h2>{result.visitor.name}</h2><span className="muted">{result.visitor.company || 'Guest'}</span></div></div>
              <p>Host: <strong>{result.host?.name || '-'}</strong></p>
              <p>Purpose: {result.purpose}</p>
              <p className="muted">{fmtDate(result.at)} · {result.location}</p>
            </>
          ) : (
            <><div className="verdict">Pass not accepted</div><p>{result.message}</p></>
          )}
        </section>
      </div>
    </>
  );
}
