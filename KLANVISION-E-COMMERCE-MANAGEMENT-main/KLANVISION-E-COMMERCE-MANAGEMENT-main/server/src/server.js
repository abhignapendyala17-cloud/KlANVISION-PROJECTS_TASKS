require('./config/loadEnv');
const app = require('./app');
const connectDB = require('./config/db');

const port = process.env.PORT || 5000;
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32 || process.env.JWT_SECRET.startsWith('replace-with-')) {
  console.error('Set JWT_SECRET to a unique random value of at least 32 characters in server/.env');
  process.exit(1);
}

connectDB()
  .then(() => {
    const server = app.listen(port, () => console.log(`API listening on port ${port}`));
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`Cannot start API: port ${port} is already in use. Stop the other server using this port, then restart.`);
      } else {
        console.error('Failed to start API listener:', error.message);
      }
      process.exit(1);
    });
  })
  .catch((error) => {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  });
