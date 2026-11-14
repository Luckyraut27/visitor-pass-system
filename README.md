# Visitor Pass Management System (MERN)

Digitises the visitor register: pre-registration, host approval, QR-code passes with a printable PDF badge,
QR check-in / check-out, email + SMS notifications, and a dashboard with searchable, exportable logs.

**Stack:** MongoDB · Express · React (Vite) · Node.js · JWT · `qrcode` · `pdfkit` · `nodemailer` · Twilio (REST) · `html5-qrcode`

## Features (mapped to the assignment)

| # | Requirement | Where |
|---|-------------|-------|
| 1 | JWT auth + role-based access (admin, security, host, visitor) | `server/src/middleware/auth.js`, `AuthContext.jsx` |
| 2 | Visitor registration (details + photo upload) | `POST /api/appointments` (multipart), `NewAppointment.jsx` |
| 3 | Appointments: pre-register, invite, approve/reject, notify | `appointmentController.js` |
| 4 | Pass issuance: QR code + PDF badge | `passService.js`, `utils/pdf.js`, `utils/qr.js` |
| 5 | Check-in / check-out by QR scan (auto-toggles, full log) | `checkinController.js`, `Scanner.jsx` |
| 6 | Email (SMTP) + SMS (Twilio) notifications | `utils/notify.js` |
| 7 | Dashboard, search, filter, CSV export | `dashboardController.js`, `Logs.jsx` |

**Bonus included:** analytics dashboard (live "inside now" + 7-day chart), audit log (admin), multi-location
check-ins (gate/location recorded on every scan, filterable), Docker + Nginx deployment.
**Not included:** OTP verification and multi-organisation tenancy.

## Roles and flow

- **Visitor** registers an account → pre-registers a visit (with photo) → host approves → pass (QR + PDF) is emailed and shown under *My passes*.
- **Host** approves/rejects requests for their own appointments, or *invites* a visitor (approved + pass sent immediately).
- **Security / Front desk** registers walk-ins (pass issued instantly), issues/revokes passes, scans QR codes (first scan = check-in, next = check-out).
- **Admin** does everything above plus user management, audit trail and analytics.

A pass is valid for the whole day of the appointment. Check-out is always allowed, even after expiry.

## Setup (local)

Requirements: Node.js 18+, MongoDB running locally (or a MongoDB Atlas URI).

```bash
# 1. API
cd server
cp .env.example .env        # edit MONGO_URI / JWT_SECRET
npm install
npm run seed                # demo data (clears the database!)
npm run dev                 # http://localhost:5000

# 2. Web app (new terminal)
cd client
npm install
npm run dev                 # http://localhost:5173  (proxies /api to :5000)
```

### Demo logins (created by the seed script)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@example.com | Admin@123 |
| Security | security@example.com | Security@123 |
| Host | host@example.com | Host@123 |
| Visitor | visitor@example.com | Visitor@123 |

The seed prints a demo pass code you can paste into *Scan pass → Or type the pass ID* to test check-in without a camera.

### Notifications

With no SMTP/Twilio settings, emails and SMS are **printed to the server console** so the app works out of the box.
Set `SMTP_*` and `TWILIO_*` in `server/.env` to send real messages.

> The browser camera needs HTTPS (or `localhost`) to scan QR codes.

## Docker + Nginx

```bash
docker compose up --build -d
docker compose exec server npm run seed
# open http://localhost:8080
```

Set `JWT_SECRET`, SMTP and Twilio values in a root `.env` file or your shell before `up`.

## API summary

| Method | Path | Access |
|--------|------|--------|
| POST | `/api/auth/register`, `/api/auth/login` | public |
| GET | `/api/auth/me` | any user |
| GET | `/api/users/hosts` | any user |
| GET/POST/PATCH | `/api/users`, `/api/users/:id` | admin |
| GET | `/api/visitors?q=` | admin, security |
| GET | `/api/appointments?status=&date=` | any (scoped to the user's role) |
| POST | `/api/appointments` (multipart, field `photo`) | any |
| PATCH | `/api/appointments/:id/status` | host (own) / admin approve, reject; owner/staff cancel |
| POST | `/api/passes` `{appointmentId}` | admin, security |
| GET | `/api/passes/mine`, `/api/passes/:id`, `/api/passes/:id/pdf` | owner / host / staff |
| PATCH | `/api/passes/:id/revoke` | admin, security |
| POST | `/api/checkins/scan` `{code, location}` | admin, security |
| GET | `/api/checkins?q=&action=&from=&to=&location=&page=` · `/export` · `/inside` | admin, security |
| GET | `/api/dashboard/stats` | admin, security |
| GET | `/api/audit` | admin |

## Project structure

```
server/src
  config/ models/ (User, Visitor, Appointment, Pass, CheckLog, AuditLog)
  controllers/ routes/ middleware/ services/ utils/
  seed.js  app.js  server.js
client/src
  pages/ components/ AuthContext.jsx api.js
docs/screenshots   <- add your screenshots here for submission
```

## Submission checklist

- [ ] Push to GitHub (`.env` is git-ignored)
- [ ] Add screenshots to `docs/screenshots/`
- [ ] Record a short demo video: visitor pre-registers → host approves → security scans in/out → admin dashboard + CSV export
