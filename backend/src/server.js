
import 'dotenv/config';
import http from 'http';
import { app } from './app.js';
import { initSocket } from './sockets/socket.js';
import { connectDB } from './db/mongo.js';

const PORT = process.env.PORT || 3001;
const server = http.createServer(app);

initSocket(server);

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Failed to connect to DB', err);
});
