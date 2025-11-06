export function registerOrderSocket(io) {
  const nsp = io.of('/orders');
  nsp.on('connection', (socket) => {
    // Clients may join rooms by role or user
    socket.on('join', ({ room }) => {
      if (room) socket.join(room);
    });

    // Staff can emit order:update-status if authenticated via token in handshake in future
    socket.on('order:update-status', ({ orderId, status }) => {
      // For now, this event only rebroadcasts; authoritative update happens via REST
      nsp.emit('order:update-status', { orderId, status });
    });

    socket.on('disconnect', () => {});
  });
}
