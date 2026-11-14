const nodemailer = require('nodemailer');
const { qrBuffer } = require('./qr');
const { generatePassPdf } = require('./pdf');

let transporter = null;
function getTransporter() {
  if (transporter) return transporter;
  if (!process.env.SMTP_HOST) return null;
  const port = Number(process.env.SMTP_PORT) || 587;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  });
  return transporter;
}

async function sendEmail({ to, subject, html, attachments }) {
  if (!to) return;
  const t = getTransporter();
  if (!t) {
    console.log(`[email:dev] to=${to} subject="${subject}"`);
    return;
  }
  try {
    await t.sendMail({ from: process.env.MAIL_FROM || 'no-reply@example.com', to, subject, html, attachments });
  } catch (e) {
    console.error('Email failed:', e.message);
  }
}

async function sendSms(to, body) {
  if (!to) return;
  const { TWILIO_ACCOUNT_SID: sid, TWILIO_AUTH_TOKEN: token, TWILIO_FROM: from } = process.env;
  if (!sid || !token || !from) {
    console.log(`[sms:dev] to=${to} body="${body}"`);
    return;
  }
  try {
    const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ To: to, From: from, Body: body }),
    });
    if (!r.ok) console.error('SMS failed:', r.status, await r.text());
  } catch (e) {
    console.error('SMS failed:', e.message);
  }
}

const org = () => process.env.ORG_NAME || 'Visitor Management System';
const when = (d) => new Date(d).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });

// Host is asked to approve a pre-registration
exports.hostApprovalRequest = async (host, visitor, appt) => {
  await sendEmail({
    to: host.email,
    subject: `Visitor approval needed: ${visitor.name}`,
    html: `<p>Hi ${host.name},</p><p><b>${visitor.name}</b>${visitor.company ? ' (' + visitor.company + ')' : ''} wants to visit on <b>${when(appt.scheduledAt)}</b>.</p><p>Purpose: ${appt.purpose}</p><p>Please sign in to approve or reject this request.</p>`,
  });
  await sendSms(host.phone, `${org()}: ${visitor.name} requests a visit on ${when(appt.scheduledAt)}. Please approve in the portal.`);
};

// Visitor receives the pass (QR + PDF badge)
exports.notifyPassIssued = async (pass) => {
  const { visitor, appointment } = pass;
  const host = appointment.host;
  const qr = await qrBuffer(pass.code);
  const pdf = await generatePassPdf({ pass, visitor, host, qr });
  await sendEmail({
    to: visitor.email,
    subject: `Your visitor pass - ${org()}`,
    html: `<p>Hi ${visitor.name},</p><p>Your visit to <b>${org()}</b> is confirmed${host ? ' with ' + host.name : ''}.</p><p>Valid: ${when(pass.validFrom)} to ${when(pass.validUntil)}</p><p>Show this QR code at the front desk:</p><img src="cid:qrcode" width="200" alt="QR"/><p>Your printable badge is attached.</p>`,
    attachments: [
      { filename: 'visitor-pass.pdf', content: pdf },
      { filename: 'qr.png', content: qr, cid: 'qrcode' },
    ],
  });
  await sendSms(visitor.phone, `${org()}: your visit is confirmed. Pass valid until ${when(pass.validUntil)}. Pass ID: ${pass.code.slice(0, 8)}. Check your email for the QR.`);
};

exports.visitorRejected = async (visitor, host, appt) => {
  await sendEmail({
    to: visitor.email,
    subject: 'Your visit request was not approved',
    html: `<p>Hi ${visitor.name},</p><p>${host ? host.name : 'The host'} could not approve your visit on ${when(appt.scheduledAt)}. You can submit a new request from the portal.</p>`,
  });
  await sendSms(visitor.phone, `${org()}: your visit request for ${when(appt.scheduledAt)} was not approved.`);
};

exports.hostCheckIn = async (host, visitor, at) => {
  if (!host) return;
  await sendEmail({
    to: host.email,
    subject: `${visitor.name} has arrived`,
    html: `<p>Hi ${host.name},</p><p><b>${visitor.name}</b> checked in at ${when(at)}.</p>`,
  });
  await sendSms(host.phone, `${org()}: ${visitor.name} has arrived at ${when(at)}.`);
};
