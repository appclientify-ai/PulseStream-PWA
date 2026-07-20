const fs = require('fs');
let c = fs.readFileSync('backend/src/sockets/socket.js', 'utf8');

c = c.replace(/socket\.on\('disconnect', \(\) => \{/g,
  `socket.on('data_updated', () => {\n      console.log('Received data_updated, broadcasting sync_data');\n      socket.broadcast.emit('sync_data');\n      io.emit('db_item_change', { type: 'update' });\n    });\n    socket.on('disconnect', () => {`
);

fs.writeFileSync('backend/src/sockets/socket.js', c);
