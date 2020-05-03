import { OutgoingHttpHeaders } from 'http';

import { BuiltUpHttpResponse } from './sendHttpRequestAndBuildUpResponse';

export interface ApiGatewayResponse {
  statusCode?: number;
  headers: OutgoingHttpHeaders;
  body: string;
  isBase64Encoded: boolean;
}
export const translateHttpResponseToApiGatewayResponse = async ({ response }: { response: BuiltUpHttpResponse }): Promise<ApiGatewayResponse> => {
  const { statusCode, headers, body: bodyBuffer } = response;

  // chunked transfer not currently supported by API Gateway
  if (headers['transfer-encoding'] === 'chunked') delete headers['transfer-encoding'];

  // determine whether to encode as base64 or not, based on whether it was compressed
  const isCompressed = headers['content-encoding'] === 'gzip';
  const body = bodyBuffer.toString(isCompressed ? 'base64' : 'utf8'); // return as base64 if compressed, else, dont
  const isBase64Encoded = isCompressed; // https://stackoverflow.com/a/47780921/3068233

  // resolve the response
  return {
    body,
    headers,
    statusCode,
    isBase64Encoded,
  };
};
