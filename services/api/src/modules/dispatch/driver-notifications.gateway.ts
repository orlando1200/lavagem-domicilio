import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  namespace: 'drivers',
  cors: { origin: '*' },
})
export class DriverNotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(DriverNotificationsGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Driver client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Driver client disconnected: ${client.id}`);
  }

  /**
   * Driver joins their personal notification room.
   * Payload: { driverUserId: string }
   */
  @SubscribeMessage('join_driver')
  async handleJoinDriver(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { driverUserId: string },
  ) {
    if (!data?.driverUserId) {
      return { event: 'error', message: 'driverUserId is required' };
    }
    const room = `driver:${data.driverUserId}`;
    await client.join(room);
    this.logger.log(`Socket ${client.id} joined room ${room}`);
    return { event: 'joined', room };
  }

  /**
   * Emit a new order offer to a specific driver.
   */
  emitOffer(driverUserId: string, offer: Record<string, unknown>) {
    const room = `driver:${driverUserId}`;
    this.server.to(room).emit('new_order', offer);
    this.logger.log(`Emitted new_order to ${room}`);
  }

  /**
   * Emit order cancellation to a specific driver.
   */
  emitOrderCancelled(driverUserId: string, orderId: string) {
    const room = `driver:${driverUserId}`;
    this.server.to(room).emit('order_cancelled', { orderId });
  }
}

