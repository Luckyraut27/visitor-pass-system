require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is missing. Copy .env.example to .env and set it.');
  process.exit(1);
}

const port = process.env.PORT || 5000;
connectDB()
  .then(() => app.listen(port, () => console.log(`API running on http://localhost:${port}`)))
  .catch((err) => {
    console.error('Failed to start:', err.message);
    process.exit(1);
  });
