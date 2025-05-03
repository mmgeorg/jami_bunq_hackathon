provider "aws" {
  region = var.aws_region
  default_tags {
    tags = {
      project     = "bunq"
    }
  }
}

locals {
  backend_zip = "../../backend/dist/lambda-function.zip"
  environment_variables = {
    TABLE_NAME = aws_dynamodb_table.user_goals_table.name
  }
}

# ---------------- Lambda start ----------------
resource "aws_lambda_function" "goal_management_lambda" {
  function_name    = "goal-management-handler"
  handler          = "index.handler"
  runtime          = "nodejs18.x"

  filename         = local.backend_zip
  source_code_hash = filebase64sha256(local.backend_zip)

  timeout          = 30
  memory_size      = 128
  role             = aws_iam_role.lambda_exec.arn

  environment {
    variables = local.environment_variables
  }

  depends_on = [
    aws_iam_role_policy_attachment.lambda_dynamodb_attach,
    aws_iam_role_policy_attachment.lambda_basic_execution,
  ]
}

# Lambda IAM Role
resource "aws_iam_role" "lambda_exec" {
  name = "lambda_exec_role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_dynamodb_attach" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess"
}

resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# ---------------- Lambda end----------------



# DynamoDB Table
resource "aws_dynamodb_table" "user_goals_table" {
  name           = "UserGoals"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "userId"

  attribute {
    name = "userId"
    type = "S"
  }
}



# API Gateway
resource "aws_apigatewayv2_api" "api" {
  name          = "bunq-api"
  protocol_type = "HTTP"
  cors_configuration {
    allow_origins = ["*"]
    allow_methods = ["*"]
    allow_headers = ["*"]
    max_age       = 300
  }
}

resource "aws_apigatewayv2_stage" "api_stage" {
  api_id      = aws_apigatewayv2_api.api.id
  name        = "$default"
  auto_deploy = true
}

resource "aws_apigatewayv2_integration" "api_integration" {
  api_id             = aws_apigatewayv2_api.api.id
  integration_type   = "AWS_PROXY"
  integration_uri    = aws_lambda_function.goal_management_lambda.invoke_arn
  integration_method = "POST"
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "api_route_user_goals" {
  api_id    = aws_apigatewayv2_api.api.id
  route_key = "ANY /user/{id}/goals"
  target    = "integrations/${aws_apigatewayv2_integration.api_integration.id}"
}

resource "aws_apigatewayv2_route" "api_route_user_goals_overview" {
  api_id    = aws_apigatewayv2_api.api.id
  route_key = "ANY /user/{id}/goals/{goalName}"
  target    = "integrations/${aws_apigatewayv2_integration.api_integration.id}"
}
resource "aws_apigatewayv2_route" "api_route_user_goals_dashboard" {
  api_id    = aws_apigatewayv2_api.api.id
  route_key = "ANY /user/{id}/dashboard"
  target    = "integrations/${aws_apigatewayv2_integration.api_integration.id}"
}

# Lambda Permission for API Gateway
resource "aws_lambda_permission" "api_gw" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.goal_management_lambda.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.api.execution_arn}/*"
}

# ---------------- S3----------------

#Bucket for Frontend (Public)
resource "aws_s3_bucket" "frontend_bucket" {
  bucket = var.frontend_bucket_name
}

# Enable website hosting for frontend bucket
resource "aws_s3_bucket_website_configuration" "frontend_website" {
  bucket = aws_s3_bucket.frontend_bucket.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "index.html"
  }
}

# Set ownership controls for frontend bucket
resource "aws_s3_bucket_ownership_controls" "frontend_ownership" {
  bucket = aws_s3_bucket.frontend_bucket.id

  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}

# Allow public access to frontend bucket
resource "aws_s3_bucket_public_access_block" "frontend_public_access" {
  bucket = aws_s3_bucket.frontend_bucket.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

# Set public read policy for frontend bucket
resource "aws_s3_bucket_policy" "frontend_policy" {
  bucket = aws_s3_bucket.frontend_bucket.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action    = ["s3:GetObject"]
        Effect    = "Allow"
        Resource  = "${aws_s3_bucket.frontend_bucket.arn}/*"
        Principal = "*"
      }
    ]
  })

  depends_on = [aws_s3_bucket_public_access_block.frontend_public_access]
}

# S3 Bucket for Internal Documents (Private)
resource "aws_s3_bucket" "internal_docs_bucket" {
  bucket = var.internal_docs_bucket_name
}

# Enable versioning for internal docs bucket
resource "aws_s3_bucket_versioning" "internal_docs_versioning" {
  bucket = aws_s3_bucket.internal_docs_bucket.id
  versioning_configuration {
    status = "Enabled"
  }
}

# Set ownership controls for internal docs bucket
resource "aws_s3_bucket_ownership_controls" "internal_docs_ownership" {
  bucket = aws_s3_bucket.internal_docs_bucket.id

  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

# Block public access for internal docs bucket
resource "aws_s3_bucket_public_access_block" "internal_docs_public_access" {
  bucket = aws_s3_bucket.internal_docs_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Create folder structure for internal docs bucket
resource "aws_s3_object" "docs_folder" {
  bucket       = aws_s3_bucket.internal_docs_bucket.id
  key          = "documents/"
  content_type = "application/x-directory"
  content      = ""
}

resource "aws_s3_object" "reports_folder" {
  bucket       = aws_s3_bucket.internal_docs_bucket.id
  key          = "reports/"
  content_type = "application/x-directory"
  content      = ""
}
