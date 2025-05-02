# jami_bunq_hackathon

Run lambda

```bash
aws lambda invoke \
  --function-name my-lambda-function \
  output.json
```

Quick deploy lambda
```bash
# Build and deploy Lambda code quickly
cd backend && npm run build && \
aws lambda update-function-code \
  --function-name goal-management-handler \
  --zip-file fileb://dist/lambda-function.zip \
  --region $(aws configure get region) \
  --no-cli-pager

```