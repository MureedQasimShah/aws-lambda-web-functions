# AWS Lambda Web Functions Demo

## Full YouTube link step by step

https://youtu.be/CKZvvoOaSJY

Companion code for the YouTube walkthrough: deploy the **same style of Express app** two ways — the classic Lambda + API Gateway path, and the new **AWS Lambda Web Functions** path.

## What’s in this repo

| Folder | Pattern | Entry |
|--------|---------|--------|
| [`lambda-web-demo/`](./lambda-web-demo) | **New** — Lambda Web Functions | `index.js` listens like a normal HTTP server |
| [`lambda-old-demo/`](./lambda-old-demo) | **Classic** — Lambda handler + API Gateway | `handler.js` + `serverless-http` |

Both apps are live status dashboards (health check, runtime environment, region, uptime). No databases, no external APIs, no secrets in the code.

## Quick start (local)

### New — Lambda Web Functions demo (port 3000)

```bash
cd lambda-web-demo
npm install
npm start
# http://127.0.0.1:3000
```

### Classic — Lambda + API Gateway demo (port 3001)

```bash
cd lambda-old-demo
npm install
npm start
# http://127.0.0.1:3001
```

## Deploy

### New way (one command)

From the repo root (requires AWS CLI with `lambda-web` support and configured credentials):

```bash
aws lambda-web deploy --name lambda-web-demo --code ./lambda-web-demo --region us-east-1
```

Or from inside the folder:

```bash
cd lambda-web-demo
aws lambda-web deploy --name lambda-web-demo --code . --region us-east-1
```

The runtime sets `AWS_LAMBDA_HTTP_ENDPOINT`; the app listens on that address. Locally it falls back to `127.0.0.1:3000`.

### Classic way (SAM or console)

```bash
cd lambda-old-demo
npm install
sam build
sam deploy --guided
```

Or zip and upload via the Lambda console, set handler to `handler.handler`, then attach an HTTP API (`ANY /` and `ANY /{proxy+}`). See [`lambda-old-demo/README.md`](./lambda-old-demo/README.md).

## Contrast

| | Classic | Web Functions |
|--|---------|---------------|
| AWS entry | `handler.js` + adapter | `app.listen(...)` in `index.js` |
| Front door | API Gateway | Web Function endpoint |
| Local vs AWS | Separate `local.js` / `handler.js` | Same listen flow + env address |
| Deploy | Zip/console or `sam build` + `sam deploy` | `aws lambda-web deploy` |

## Cleanup examples

```bash
# Web Function
aws lambda-web delete-web-function --function-name lambda-web-demo --region us-east-1

# Classic Lambda
aws lambda delete-function --function-name lambda-old-demo --region us-east-1
```

## Author

**Mureed Qasim Shah** — [GitHub](https://github.com/MureedQasimShah)

## License

MIT
