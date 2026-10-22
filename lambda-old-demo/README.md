# Classic Lambda Demo (old pattern)

Same style of Express dashboard as `lambda-web-demo`, but deployed the **classic** way:

**Browser → API Gateway → Lambda handler → `serverless-http` → Express**

Use this next to `lambda-web-demo` in a tutorial to show why Lambda Web Functions feels faster and simpler.

## How the code is split

| File | Role |
|------|------|
| `app.js` | Express routes and static files (shared) |
| `local.js` | `app.listen()` — **local only** |
| `handler.js` | `exports.handler = serverless(app)` — **AWS entry** |
| `template.yaml` | SAM: Lambda + HTTP API (API Gateway) |

On AWS there is **no** long-running HTTP listen. Lambda invokes `handler.handler` for each request.

## Local development

Runs on port **3001** so it does not clash with `lambda-web-demo` on 3000.

```bash
cd lambda-old-demo
npm install
npm start
```

Open [http://127.0.0.1:3001](http://127.0.0.1:3001).

```bash
curl -s http://127.0.0.1:3001/api/health
curl -s http://127.0.0.1:3001/api/status
```

## Deploy the old way (SAM)

Prerequisites: [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html), configured AWS credentials, permission to create Lambda and API Gateway resources.

From this folder:

```bash
cd lambda-old-demo
npm install
sam build
sam deploy --guided
```

Guided deploy will ask for stack name, region, and capabilities (`CAPABILITY_IAM`). After deploy, SAM prints `ApiUrl` — open that URL in the browser.

Non-guided example:

```bash
sam deploy \
  --stack-name lambda-old-demo \
  --capabilities CAPABILITY_IAM \
  --resolve-s3 \
  --no-confirm-changeset
```

## Compare with Lambda Web Functions

| | Classic (`lambda-old-demo`) | Web Functions (`lambda-web-demo`) |
|--|-----------------------------|-----------------------------------|
| Entry | `handler.js` + `serverless-http` | `index.js` + `app.listen()` |
| Front door | API Gateway (SAM HTTP API) | Lambda Web Functions runtime |
| Local vs AWS | Different entry files | Same listen flow (env address) |
| Deploy | `sam build` + `sam deploy` | `aws lambda-web deploy --name … --code …` |

New way (from parent directory):

```bash
aws lambda-web deploy --name lambda-web-demo --code ./lambda-web-demo
```

## Cleanup

```bash
sam delete --stack-name lambda-old-demo
```
