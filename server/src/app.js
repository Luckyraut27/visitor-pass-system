const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const { notFound, errorHandler } = require('./middleware/error');

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: process.env.CLIENT_URL || true }));
app.use(express.json());
app.use(morgan('dev'));

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/visitors', require('./routes/visitors'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/passes', require('./routes/passes'));
app.use('/api/checkins', require('./routes/checkins'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/audit', require('./routes/audit'));

app.use(notFound);
app.use(errorHandler);

module.exports = app;
