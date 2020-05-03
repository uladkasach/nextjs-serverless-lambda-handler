import { Express } from 'express';
import { Server } from 'http';

// https://stackoverflow.com/questions/28050171/nodejs-random-free-tcp-ports
export const startServerOnOpenPort = async ({ server }: { server: Server | Express }) => {
  // start http server
  const httpServer = await new Promise<Server>((resolve) => {
    const listener = server.listen(
      0, // specifies use any open port
      () => {
        resolve(listener);
      },
    );
  });

  // get port that server started on
  const { port } = httpServer.address();
  if (!port) throw new Error('could not get port'); // we expect to always be able to get this - but since typings are not ideal, lets fail fast if not

  // define how to close server
  const closeServer = () => new Promise((resolve) => httpServer.close(resolve));

  // return port and close method
  return { serverPort: port, closeServer };
};
