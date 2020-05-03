import { APIGatewayEvent } from 'aws-lambda';
import http, { IncomingMessage } from 'http';
import url from 'url';

import { getBodyFromApiGatewayEvent } from './getBodyFromHttpEvent';
import { sendHttpRequestAndBuildUpResponse, BuiltUpHttpResponse } from './sendHttpRequestAndBuildUpResponse';

export const translateApiGatewayEventToHttpRequest = ({
  apiGatewayEvent: event,
  serverPort,
}: {
  apiGatewayEvent: APIGatewayEvent;
  serverPort: number;
}): (() => Promise<BuiltUpHttpResponse>) => {
  // define headers object for us to build up
  const headers = { ...event.headers }; // spread to make sure headers is new object, not orig reference to event.headers object

  // define a content length header if one is not already defined; API Gateway may do this
  const body = getBodyFromApiGatewayEvent({ apiGatewayEvent: event });
  if (body && !headers['Content-Length']) {
    headers['Content-Length'] = `${Buffer.byteLength(body)}`;
  }

  // define the full path
  const path = url.format({ pathname: event.path, query: event.queryStringParameters });

  // build up the request options based on this
  const requestOptions = {
    path,
    headers,
    port: serverPort, // the next.js server will be running on `localhost:${port}`
    method: event.httpMethod,
  };

  // create a function with resolves the response - or throws the error
  return () =>
    new Promise((resolve, reject) => {
      const request = http.request(requestOptions, (response: IncomingMessage) => resolve(sendHttpRequestAndBuildUpResponse({ response })));
      if (body) request.write(body);
      request.on('error', (error) => reject(error));
      request.end();
    });
};
