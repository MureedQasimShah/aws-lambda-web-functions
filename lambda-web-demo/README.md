# Lambda Web Functions Demo

A polished single-page Express application that demonstrates deploying a standard Node.js HTTP server as an **AWS Lambda Web Function**.

The UI is a live status dashboard: it calls real backend endpoints, shows the detected runtime environment, and measures browser-observed health-check latency.

## Prerequisites

- Node.js 18 or later
- npm

For deployment:

- An AWS CLI build that includes the `lambda-web` commands
- Configured AWS credentials
- An AWS region where Lambda Web Functions is available
- IAM permissions required to create and update Lambda Web Functions

## Local development

```bash
cd lambda-web-demo
npm install
npm start
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000).

Useful checks:

```bash
curl -s http://127.0.0.1:3000/api/health
curl -s http://127.0.0.1:3000/api/status
```

No AWS credentials are required for local development.

## How listening works

When the process starts:

1. If `AWS_LAMBDA_HTTP_ENDPOINT` is set, the app parses that `host:port` value and listens on it.
2. Otherwise it listens on `127.0.0.1:3000` for local development.

There is no Lambda event handler, API Gateway adapter, or `serverless-http` wrapper. The app is a normal Express HTTP server.

Environment detection for the dashboard also uses `AWS_LAMBDA_HTTP_ENDPOINT`. The AWS region is read from `AWS_REGION` or `AWS_DEFAULT_REGION` when present.

## Deploy to AWS Lambda Web Functions

From the **parent directory** of this project:

```bash
aws lambda-web deploy --name lambda-web-demo --code ./lambda-web-demo
```

The deployment package is the `lambda-web-demo` folder. Keep `index.js` at the package root so the Lambda Web Functions runtime can start the Express server.

After deploy, open the function URL provided by the CLI or AWS console and use **Run Health Check** to verify the live API path.

## Project layout

```text
lambda-web-demo/
├── index.js          # Express server (deployment entry point)
├── package.json
├── README.md
└── public/
    ├── index.html
    ├── styles.css
    └── app.js
```

## API

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | Dashboard UI |
| `GET` | `/api/health` | Health check (`status`, `service`, `timestamp`) |
| `GET` | `/api/status` | Runtime status, environment, region, process uptime |
