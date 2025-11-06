import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

export function getSocket() {
  if (!socket) {
    const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
    socket = io(base + '/orders', { withCredentials: true })
  }
  return socket
}
