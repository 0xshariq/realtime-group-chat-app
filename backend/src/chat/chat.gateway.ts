import { SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import type { Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:5173',
  },
})
export class ChatGateway {
  @SubscribeMessage('joinRoom')
  async handleMessage(client: Socket, payload: any) {
    console.log(`${payload} is joining the group.`);

    await client.join('group');

    // send to all
    // io.to(ROOM).emit('roomNotice', userName);

    // broadcast
    client.to('group').emit('roomNotice', payload);
    console.log('Received:', payload);
  }

  @SubscribeMessage('chatMessage')
  handleChatMessage(client: Socket, payload: any) {
    client.to('group').emit('chatMessage', payload);
  }

  @SubscribeMessage('typing')
  handleTyping(client: Socket, payload: any) {
    client.to('group').emit('typing', payload);
  }

  @SubscribeMessage('stopTyping')
  handleStopTyping(client: Socket, payload: any) {
    client.to('group').emit('stopTyping', payload);
  }

  handleConnection(conn) {
    console.log(`New client connected.`, conn.id);
  }

  handleDisconnect() {
    console.log('Client has been disconnected');
  }
}