import { APIGatewayEvent } from 'aws-lambda';

export const getBodyFromApiGatewayEvent = ({ apiGatewayEvent: event }: { apiGatewayEvent: APIGatewayEvent }) => {
  if (!event.body) return null;
  return Buffer.from(event.body, event.isBase64Encoded ? 'base64' : 'utf8');
};
