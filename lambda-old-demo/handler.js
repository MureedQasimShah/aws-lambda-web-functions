'use strict';

/**
 * Classic AWS Lambda entry point.
 *
 * Flow on AWS:
 *   Browser → API Gateway → Lambda event → serverless-http → Express
 *
 * Contrast with Lambda Web Functions (lambda-web-demo):
 *   Browser → Express HTTP server (no handler, no adapter)
 */

const serverless = require('serverless-http');
const app = require('./app');

// This is the function AWS Lambda invokes for every request.
exports.handler = serverless(app);
