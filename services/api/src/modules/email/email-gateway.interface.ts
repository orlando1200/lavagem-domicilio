export interface SendEmailParams {
  to: string;
  subject: string;
  body: string;
}

export interface EmailGatewayAdapter {
  send(params: SendEmailParams): Promise<void>;
}

export const EMAIL_GATEWAY_ADAPTER = Symbol('EMAIL_GATEWAY_ADAPTER');
