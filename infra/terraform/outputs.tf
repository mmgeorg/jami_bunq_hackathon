output "api_endpoint" {
  description = "API Gateway endpoint URL"
  value       = aws_apigatewayv2_api.api.api_endpoint
}

output "dynamodb_table_name" {
  description = "Name of the DynamoDB table"
  value       = aws_dynamodb_table.user_goals_table.name
}

output "lambda_function_name" {
  description = "Name of the Lambda function"
  value       = aws_lambda_function.goal_management_lambda.function_name
}

output "frontend_website_endpoint" {
  description = "Website endpoint for the frontend S3 bucket"
  value       = aws_s3_bucket_website_configuration.frontend_website.website_endpoint
}

# Internal Documents S3 Bucket outputs
output "internal_docs_bucket_name" {
  description = "Name of the S3 bucket for internal documents"
  value       = aws_s3_bucket.internal_docs_bucket.id
}

# Frontend S3 Bucket outputs
output "frontend_bucket_name" {
  description = "Name of the S3 bucket hosting the frontend"
  value       = aws_s3_bucket.frontend_bucket.id
}
