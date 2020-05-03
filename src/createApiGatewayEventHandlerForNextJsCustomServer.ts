import { APIGatewayEvent } from 'aws-lambda';
import { Express } from 'express';
import { Server } from 'http';
import { translateApiGatewayEventToHttpRequest } from './translateApiGatewayEventToHttpRequest';
import { translateHttpResponseToApiGatewayResponse } from './translateHttpResponseToApiGatewayResponse';
import { startServerOnOpenPort } from './startServerOnOpenPort';

/**
 * supports both Express and Http server
 */
export const createApiGatewayEventHandlerForNextJsCustomServer = ({ server }: { server: Express | Server }) => {
  return async (apiGatewayEvent: APIGatewayEvent) => {
    // 1. wait for server to start listening to requests
    const { closeServer, serverPort } = await startServerOnOpenPort({ server }); // start server every time because it is quick and errors wont affect subsequent invocations -> stateless ftw

    // in a try-catch to make sure server gets closed
    try {
      // 2. convert api gateway event to http request options
      const request = translateApiGatewayEventToHttpRequest({ apiGatewayEvent, serverPort }); // create the request w/ the correct port to the server

      // 3. send request and wait for response
      const response = await request();

      // 4. cast response to api gateway format
      const apiGatewayResponse = translateHttpResponseToApiGatewayResponse({ response });

      // 5. return the response to api gateway
      return apiGatewayResponse;
    } finally {
      // 6. close the server whether we fail or succeed
      await closeServer();
    }
  };
};
