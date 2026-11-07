import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname } from 'node:path';
import { PRODUCT_NAME } from './src/brand.js';

const site = new URL('./dist/site/', import.meta.url);
const chat = new URL('./dist/chat.html', import.meta.url);
const types = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.svg', 'image/svg+xml'],
  ['.png', 'image/png'],
  ['.txt', 'text/plain; charset=utf-8'],
  ['.xml', 'application/xml; charset=utf-8'],
]);
const host = '127.0.0.1';
const port = Number(process.env.DESCRIBBLE_PORT ?? 4173);

function sendMessage(response, status, message) {
  response.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8' });
  response.end(message);
}

const server = createServer(async (request, response) => {
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('X-Content-Type-Options', 'nosniff');
  const localPort = request.socket.localPort;
  if (request.headers.host !== `${host}:${localPort}` && request.headers.host !== `localhost:${localPort}`) {
    return sendMessage(response, 403, 'Use the local server address.');
  }

  const pathname = request.url.split('?')[0];
  if (!pathname.startsWith('/') || (request.method !== 'GET' && request.method !== 'HEAD')) {
    return sendMessage(response, 404, 'Not found.');
  }
  const route = pathname === '/classic' ? '/' : pathname;
  const relative = route.endsWith('/') ? `.${route}index.html` : `.${route}`;
  const file = route === '/chat.html' ? chat : new URL(relative, site);
  const type = types.get(extname(file.pathname));
  if (!type || (file !== chat && !file.href.startsWith(site.href))) {
    return sendMessage(response, 404, 'Not found.');
  }

  try {
    const contents = await readFile(file);
    response.writeHead(200, { 'Content-Type': type, 'Content-Length': contents.length });
    response.end(contents);
  } catch (error) {
    if (['ENOENT', 'ENOTDIR', 'EISDIR', 'ERR_INVALID_FILE_URL_PATH'].includes(error.code)) {
      return sendMessage(response, 404, 'Not found.');
    }
    sendMessage(response, 500, 'Could not read the built site.');
  }
});

server.listen(port, host, () => {
  console.log(`${PRODUCT_NAME} is running at http://${host}:${server.address().port}/`);
});
