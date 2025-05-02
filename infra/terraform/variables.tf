variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "eu-central-1"
}

variable "frontend_bucket_name" {
  description = "S3 bucket name for frontend application"
  type        = string
  default     = "bunq-ai-hackathon-frontend"
}

variable "internal_docs_bucket_name" {
  description = "S3 bucket name for internal documents"
  type        = string
  default     = "bunq-ai-hackathon-internal"
}
