import { IncomingMessage, OutgoingHttpHeaders } from 'http';

export interface BuiltUpHttpResponse {
  statusCode?: number;
  body: Buffer;
  headers: OutgoingHttpHeaders;
}

export const sendHttpRequestAndBuildUpResponse = async ({ response }: { response: IncomingMessage }): Promise<BuiltUpHttpResponse> => {
  return new Promise((resolve) => {
    // build up the buffer as we get chunks of data
    const buf: Buffer[] = [];
    response.on('data', (chunk) => buf.push(chunk instanceof Buffer ? chunk : Buffer.from(chunk))); // queue up response chunks

    // resolve the api gateway response when we get signal its completed; note: api-gateway does not support chunked responses, so we just build up the response
    response.on('end', () => {
      const { statusCode, headers } = response;
      const body = Buffer.concat(buf);
      resolve({ statusCode, headers, body });
    });
  });
};
