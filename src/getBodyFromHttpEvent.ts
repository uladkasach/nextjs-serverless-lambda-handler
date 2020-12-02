import { APIGatewayEvent } from 'aws-lambda'; // eslint-disable-line import/no-extraneous-dependencies

export const getBodyFromApiGatewayEvent = ({ apiGatewayEvent: event }: { apiGatewayEvent: APIGatewayEvent }) => {
  if (!event.body) return null;
  return Buffer.from(event.body, event.isBase64Encoded ? 'base64' : 'utf8');
};
