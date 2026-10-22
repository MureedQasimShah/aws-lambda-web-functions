'use strict';

const path = require('path');
const express = require('express');

const SERVICE_NAME = 'lambda-web-demo';
const LOCAL_HOST = '127.0.0.1';
const LOCAL_PORT = 3000;

const app = express();

app.disable('x-powered-by');

/**
 * Detect whether this process is running inside AWS Lambda Web Functions.
 * The runtime sets AWS_LAMBDA_HTTP_ENDPOINT to the host:port the app must bind to.
 */
function isLambdaWebRuntime() {
  return Boolean(process.env.AWS_LAMBDA_HTTP_ENDPOINT);
}

/**
 * Resolve the listen address.
 * - On Lambda Web Functions: parse AWS_LAMBDA_HTTP_ENDPOINT (host:port)
 * - Locally: fall back to 127.0.0.1:3000
 */
function resolveListenAddress() {
  const endpoint = process.env.AWS_LAMBDA_HTTP_ENDPOINT;

  if (!endpoint) {
    return { host: LOCAL_HOST, port: LOCAL_PORT, source: 'local' };
  }

  // Values may look like "127.0.0.1:8080" or "[::1]:8080"
  let host;
  let portString;

  if (endpoint.startsWith('[')) {
    const closeBracket = endpoint.indexOf(']');
    if (closeBracket === -1) {
      throw new Error(`Invalid AWS_LAMBDA_HTTP_ENDPOINT: ${endpoint}`);
    }
    host = endpoint.slice(1, closeBracket);
    const remainder = endpoint.slice(closeBracket + 1);
    if (!remainder.startsWith(':')) {
      throw new Error(`Invalid AWS_LAMBDA_HTTP_ENDPOINT: ${endpoint}`);
    }
    portString = remainder.slice(1);
  } else {
    const lastColon = endpoint.lastIndexOf(':');
    if (lastColon === -1) {
      throw new Error(`Invalid AWS_LAMBDA_HTTP_ENDPOINT: ${endpoint}`);
    }
    host = endpoint.slice(0, lastColon);
    portString = endpoint.slice(lastColon + 1);
  }

  const port = Number(portString);
  if (!host || !Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid AWS_LAMBDA_HTTP_ENDPOINT: ${endpoint}`);
  }

  return { host, port, source: 'lambda' };
}

function buildStatusPayload() {
  const onLambda = isLambdaWebRuntime();
  const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || null;

  return {
    status: 'ok',
    service: SERVICE_NAME,
    environment: onLambda ? 'aws-lambda-web-function' : 'local',
    environmentLabel: onLambda
      ? 'AWS LAMBDA WEB FUNCTION'
      : 'LOCAL EXPRESS SERVER',
    region: onLambda && region ? region : null,
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  };
}

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: SERVICE_NAME,
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/status', (_req, res) => {
  res.status(200).json(buildStatusPayload());
});

app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      status: 'error',
      message: 'Not found',
      path: req.path,
    });
  }
  return res.status(404).send('Not found');
});

app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    status: 'error',
    message: 'Internal server error',
  });
});

const { host, port, source } = resolveListenAddress();

const server = app.listen(port, host, () => {
  console.log(
    `[${SERVICE_NAME}] listening on http://${host}:${port} (${source})`
  );
});

server.on('error', (err) => {
  if (err && err.code === 'EADDRINUSE') {
    console.error(
      `[${SERVICE_NAME}] address already in use: ${host}:${port}`
    );
  } else {
    console.error(`[${SERVICE_NAME}] failed to start:`, err);
  }
  process.exit(1);
});
