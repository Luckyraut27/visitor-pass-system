import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { errMsg } from '../api';
import { useAuth } from '../AuthContext';
import { ErrorBox } from '../components/Bits';

const localNow = (offsetMin = 0) => {
  const d = new Date(Date.now() + offsetMin * 60000);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

export default function NewAppointment() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isVisitor = user.role === 'visitor';
  const isHost = user.role === 'host';
  const [hosts, setHosts] = useState([]);
  const [photo, setPhoto] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: isVisitor ? user.name : '',
    email: isVisitor ? user.email : '',
    phone: isVisitor ? user.phone || '' : '',
    company: '',
    hostId: '',
    purpose: '',
    scheduledAt: localNow(isVisitor || isHost ? 60 : 0),
  });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  useEffect(() => { api.get('/users/hosts').then((r) => setHosts(r.data)); }, []);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => k === 'scheduledAt' ? fd.append(k, new Date(v).toISOString()) : fd.append(k, v));
      if (photo) fd.append('photo', photo);
      await api.post('/appointments', fd);
      navigate('/appointments');
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  const title = isVisitor ? 'Pre-register a visit' : isHost ? 'Invite a visitor' : 'Register a walk-in visitor';
  const hint = isVisitor
    ? 'Your host will be notified and must approve before you receive a QR pass.'
    : isHost
    ? 'The visitor gets their QR pass by email and SMS straight away.'
    : 'A pass is issued immediately. You can print the badge from the appointments list.';

  return (
    <>
      <div className="page-head"><h1>{title}</h1></div>
      <p className="muted lead">{hint}</p>
      <form className="card form-grid" onSubmit={submit}>
        <ErrorBox msg={error} />
        <label>Visitor name<input required value={form.name} onChange={set('name')} /></label>
        <label>Visitor email<input type="email" required readOnly={isVisitor} value={form.email} onChange={set('email')} /></label>
        <label>Mobile number<input value={form.phone} onChange={set('phone')} placeholder="+91…" /></label>
        <label>Company<input value={form.company} onChange={set('company')} /></label>
        {!isHost && (
          <label>Person to meet
            <select required value={form.hostId} onChange={set('hostId')}>
              <option value="">Choose a host…</option>
              {hosts.map((h) => <option key={h._id} value={h._id}>{h.name}{h.department ? ` - ${h.department}` : ''}</option>)}
            </select>
          </label>
        )}
        <label>Date and time<input type="datetime-local" required value={form.scheduledAt} onChange={set('scheduledAt')} /></label>
        <label className="span-2">Purpose of visit<input required value={form.purpose} onChange={set('purpose')} /></label>
        <label className="span-2">Visitor photo (JPG or PNG, up to 3 MB)
          <input type="file" accept="image/jpeg,image/png" onChange={(e) => setPhoto(e.target.files[0] || null)} />
        </label>
        {photo && <img className="preview" src={URL.createObjectURL(photo)} alt="Selected visitor" />}
        <div className="span-2"><button className="btn" disabled={busy}>{busy ? 'Saving…' : isVisitor ? 'Send for approval' : isHost ? 'Send invite' : 'Register and issue pass'}</button></div>
      </form>
    </>
  );
}
