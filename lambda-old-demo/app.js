'use strict';

/**
 * Shared Express application.
 *
 * Used two ways:
 * - local.js  → normal app.listen() for local development
 * - handler.js → wrapped with serverless-http for classic AWS Lambda
 *
 * This is the "old" pattern: Express is not a real HTTP server on AWS.
 * API Gateway sends a Lambda event; serverless-http translates it for Express.
 */

const path = require('path');
const express = require('express');

const SERVICE_NAME = 'lambda-old-demo';

const app = express();

app.disable('x-powered-by');

/**
 * Classic Lambda sets AWS_LAMBDA_FUNCTION_NAME.
 * Lambda Web Functions instead sets AWS_LAMBDA_HTTP_ENDPOINT (not used here).
 */
function isClassicLambdaRuntime() {
  return Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME);
}

function buildStatusPayload() {
  const onLambda = isClassicLambdaRuntime();
  const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || null;

  return {
    status: 'ok',
    service: SERVICE_NAME,
    environment: onLambda ? 'aws-lambda-classic' : 'local',
    environmentLabel: onLambda
      ? 'CLASSIC LAMBDA + API GATEWAY'
      : 'LOCAL EXPRESS SERVER',
    region: onLambda && region ? region : null,
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    pattern: 'handler + serverless-http + API Gateway',
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

module.exports = app;
