import express, { Request, Response } from 'express';

import { createApiGatewayEventHandlerForNextJsCustomServer } from './createApiGatewayEventHandlerForNextJsCustomServer';

const placeholderApiGatewayEventParams = {
  headers: {},
  multiValueHeaders: {},
  queryStringParameters: {},
  pathParameters: {},
  multiValueQueryStringParameters: {},
  stageVariables: {} as any,
  requestContext: {} as any,
  resource: {} as any,
};

describe('createApiGatewayEventHandlerForNextJsCustomServer', () => {
  it('should be able to create the handler', () => {
    const server = express();
    const handler = createApiGatewayEventHandlerForNextJsCustomServer({ server });
    expect(handler).not.toEqual(null); // sanity check
  });
  it('should be able to return a plaintext response from a server', async () => {
    const server = express();
    server.get('*', async (req: Request, res: Response) => {
      res.send(`response: ${JSON.stringify({ url: req.url })}`); // parrot out the url
      res.end();
    });
    const handler = createApiGatewayEventHandlerForNextJsCustomServer({ server });
    const response = await handler({
      ...placeholderApiGatewayEventParams,
      path: '/cool-page',
      queryStringParameters: {
        a: '1',
        b: '2',
      },
      body: null,
      httpMethod: 'GET',
      isBase64Encoded: false,
    });
    expect(response).toMatchObject({
      statusCode: 200,
      body: 'response: {"url":"/cool-page?a=1&b=2"}',
      headers: {
        'content-length': '38',
        'content-type': 'text/html; charset=utf-8',
      },
      isBase64Encoded: false,
    });
    expect(response.headers.date).toBeDefined();
  });
  it('should be able to return a compressed (gzip) response from a server', async () => {
    const server = express();
    server.get('*', async (req: Request, res: Response) => {
      res.setHeader('content-encoding', 'gzip'); // compressed
      res.send(`response: ${JSON.stringify({ url: req.url })}`); // parrot out the url
      res.end();
    });
    const handler = createApiGatewayEventHandlerForNextJsCustomServer({ server });
    const response = await handler({
      ...placeholderApiGatewayEventParams,
      path: '/cool-page',
      queryStringParameters: {
        a: '1',
        b: '2',
      },
      body: null,
      httpMethod: 'GET',
      isBase64Encoded: false,
    });
    expect(response).toMatchObject({
      statusCode: 200,
      body: Buffer.from(`response: {"url":"/cool-page?a=1&b=2"}`).toString('base64'),
      headers: {
        'content-length': '38',
        'content-type': 'text/html; charset=utf-8',
        'content-encoding': 'gzip',
      },
      isBase64Encoded: true,
    });
    expect(response.headers.date).toBeDefined();
  });
});
