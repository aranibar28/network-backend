require('dotenv').config();
const mongoose = require('mongoose');
const compression = require('compression');
const express = require('express');
const cors = require('cors');

// sockets
const { createServer } = require('http');
const { Server } = require('socket.io');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: '*' } });

io.on('connection', (socket) => {
  socket.on('send-post', (data) => {
    io.emit('new-post', data);
  });
  socket.on('update-post', (data) => {
    io.emit('renew-post', data);
  });
  socket.on('delete-post', (data) => {
    io.emit('remove-post', data);
  });
  socket.on('update-friends', (data) => {
    io.emit('renew-friends', data);
  });
  socket.on('send-invitation', (data) => {
    io.emit('new-invitation', data);
  });
  socket.on('send-like', (data) => {
    io.emit('new-like', data);
  });
  socket.on('send-comment', (data) => {
    io.emit('new-comment', data);
  });
});

app.use(cors());
app.use(express.json());
app.use(compression());

mongoose.set('strictQuery', true);
mongoose.connect(process.env.MONGO_DB || 3000).then(() => console.log('DB Online'));

// Rutas API
app.get('/', (req, res) => res.json({ welcome: 'Server online' }));
app.use('/api/users', require('./routes/users'));
app.use('/api/stories', require('./routes/stories'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/social', require('./routes/social'));
app.use('/api/uploads', require('./routes/uploads'));

httpServer.listen(process.env.PORT, () => {
  console.log('Servidor corriendo Puerto: ' + process.env.PORT);
});
