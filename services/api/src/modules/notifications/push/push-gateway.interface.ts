export interface PushMessage {
  title: string;
  body: string;
}

export interface PushGatewayAdapter {
  send(tokens: string[], message: PushMessage): Promise<void>;
}

export const PUSH_GATEWAY_ADAPTER = Symbol('PUSH_GATEWAY_ADAPTER');
