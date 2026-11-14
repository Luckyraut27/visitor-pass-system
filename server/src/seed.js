/* Demo data: node src/seed.js  (WARNING: clears all collections) */
require('dotenv').config();
const crypto = require('crypto');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/User');
const Visitor = require('./models/Visitor');
const Appointment = require('./models/Appointment');
const Pass = require('./models/Pass');
const CheckLog = require('./models/CheckLog');
const AuditLog = require('./models/AuditLog');

const at = (daysAgo, h, m = 0) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(h, m, 0, 0);
  return d;
};

async function makeVisit({ visitor, host, purpose, when, security, checkedIn, checkedOut, location = 'Main Gate', status = 'approved' }) {
  const appt = await Appointment.create({ visitor: visitor._id, host: host._id, purpose, scheduledAt: when, status, source: 'invite', createdBy: host._id });
  if (status !== 'approved') return { appt };
  const from = new Date(when); from.setHours(0, 0, 0, 0);
  const to = new Date(when); to.setHours(23, 59, 59, 999);
  const pass = await Pass.create({ appointment: appt._id, visitor: visitor._id, code: crypto.randomBytes(12).toString('hex'), validFrom: from, validUntil: to, issuedBy: security._id });
  const base = { pass: pass._id, visitor: visitor._id, appointment: appt._id, by: security._id, location };
  if (checkedIn) await CheckLog.create({ ...base, action: 'in', at: checkedIn });
  if (checkedOut) await CheckLog.create({ ...base, action: 'out', at: checkedOut });
  return { appt, pass };
}

(async () => {
  await connectDB();
  await Promise.all([User, Visitor, Appointment, Pass, CheckLog, AuditLog].map((m) => m.deleteMany({})));

  const admin = await User.create({ name: 'LR Admin', email: 'admin@example.com', password: 'Admin@123', role: 'admin', phone: '+910000000001' });
  const security = await User.create({ name: 'Anshul Security', email: 'security@example.com', password: 'Security@123', role: 'security', phone: '+910000000002' });
  const host1 = await User.create({ name: 'Harsh ', email: 'host@example.com', password: 'Host@123', role: 'host', department: 'Engineering', phone: '+910000000003' });
  const host2 = await User.create({ name: 'Anish', email: 'host2@example.com', password: 'Host@123', role: 'host', department: 'HR', phone: '+910000000004' });
  await User.create({ name: 'Demo Visitor', email: 'visitor@example.com', password: 'Visitor@123', role: 'visitor', phone: '+910000000005' });

  const vs = await Visitor.insertMany([
    { name: 'Demo Visitor', email: 'visitor@example.com', phone: '+910000000005', company: 'Freelance' },
    { name: 'Rohan Patil', email: 'rohan@vendor.com', phone: '+919800000001', company: 'Vendor Pvt Ltd' },
    { name: 'Priya Nair', email: 'priya@client.com', phone: '+919800000002', company: 'Client Corp' },
    { name: 'Imran Shaikh', email: 'imran@interview.com', phone: '+919800000003', company: 'Candidate' },
    { name: 'Meera Joshi', email: 'meera@audit.com', phone: '+919800000004', company: 'Audit Partners' },
    { name: 'Karan Deshmukh', email: 'karan@supply.com', phone: '+919800000005', company: 'Supply Co' },
  ]);
  const [demo, rohan, priya, imran, meera, karan] = vs;

  // History for the analytics chart
  const people = [rohan, priya, imran, meera, karan];
  for (let d = 6; d >= 1; d--) {
    const n = 2 + (d % 4);
    for (let i = 0; i < n; i++) {
      await makeVisit({
        visitor: people[(d + i) % people.length],
        host: i % 2 ? host2 : host1,
        purpose: ['Project meeting', 'Interview', 'Delivery', 'Audit review'][(d + i) % 4],
        when: at(d, 10 + i),
        security,
        checkedIn: at(d, 10 + i, 5),
        checkedOut: at(d, 12 + i, 30),
        location: i % 2 ? 'Tower B Lobby' : 'Main Gate',
      });
    }
  }

  // Today
  await makeVisit({ visitor: rohan, host: host1, purpose: 'Vendor demo', when: at(0, 9), security, checkedIn: at(0, 9, 5), checkedOut: at(0, 10, 30) });
  await makeVisit({ visitor: priya, host: host1, purpose: 'Client review', when: at(0, 10), security, checkedIn: at(0, 10, 10) }); // still inside
  await makeVisit({ visitor: imran, host: host2, purpose: 'Interview - Frontend Dev', when: at(0, 11), security, checkedIn: at(0, 11, 2) }); // still inside
  await makeVisit({ visitor: karan, host: host2, purpose: 'Contract signing', when: at(0, 15), security }); // pass issued, not arrived
  const demoVisit = await makeVisit({ visitor: demo, host: host1, purpose: 'Project kickoff', when: at(0, 16), security });
  await makeVisit({ visitor: meera, host: host1, purpose: 'Quarterly audit', when: at(-1, 11), security, status: 'pending' });
  await Appointment.updateOne({ _id: (await Appointment.findOne({ status: 'pending' }))._id }, { source: 'pre-registration' });

  console.log('\nSeed complete. Demo logins:');
  console.table([
    { role: 'admin', email: 'admin@example.com', password: 'Admin@123' },
    { role: 'security', email: 'security@example.com', password: 'Security@123' },
    { role: 'host', email: 'host@example.com', password: 'Host@123' },
    { role: 'host', email: 'host2@example.com', password: 'Host@123' },
    { role: 'visitor', email: 'visitor@example.com', password: 'Visitor@123' },
  ]);
  console.log('Demo visitor pass code (for manual scan):', demoVisit.pass.code);
  await mongoose.disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
