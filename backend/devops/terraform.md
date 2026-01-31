# Infrastructure as Code with Terraform: Complete Production Guide

## Table of Contents
1. [Introduction to IaC](#introduction-to-iac)
2. [Terraform Fundamentals](#terraform-fundamentals)
3. [Core Concepts](#core-concepts)
4. [State Management](#state-management)
5. [Modules & Reusability](#modules--reusability)
6. [Workspaces & Environments](#workspaces--environments)
7. [AWS Infrastructure Examples](#aws-infrastructure-examples)
8. [LocalStack Development](#localstack-development)
9. [Best Practices](#best-practices)
10. [Complete Project Example](#complete-project-example)

---

## Introduction to IaC

### What is Infrastructure as Code?

**Definition**: Managing infrastructure through code instead of manual processes.

**Without IaC** (Manual):
```
1. Log into AWS console
2. Click "Create EC2 Instance"
3. Fill out 20 form fields
4. Click "Create"
5. Repeat for staging, production...
6. (Forget what you clicked 3 months later)
```

**With IaC** (Terraform):
```hcl
resource "aws_instance" "web" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t2.micro"
  
  tags = {
    Name = "web-server"
  }
}
```

**Benefits**:
```
✅ Version control (Git)
✅ Reproducible (same config = same infra)
✅ Automated (no manual clicks)
✅ Documented (code is documentation)
✅ Testable (preview changes with `terraform plan`)
✅ Collaborative (code reviews)
```

### Terraform vs Alternatives

| Tool         | Type        | Cloud        | Language    |
|-------------|-------------|--------------|-------------|
| Terraform   | Declarative | Multi-cloud  | HCL         |
| CloudFormation | Declarative | AWS only   | JSON/YAML   |
| Pulumi      | Imperative  | Multi-cloud  | Go/Python/JS |
| Ansible     | Procedural  | Multi-cloud  | YAML        |

**Why Terraform?**
```
✅ Multi-cloud (AWS, Azure, GCP, DigitalOcean)
✅ 3000+ providers (Kubernetes, GitHub, Datadog)
✅ Declarative (describe desired state)
✅ Large community
✅ Open source (MPL license)
```

---

## Terraform Fundamentals

### Installation

**Linux/Mac**:
```bash
wget https://releases.hashicorp.com/terraform/1.6.0/terraform_1.6.0_linux_amd64.zip
unzip terraform_1.6.0_linux_amd64.zip
sudo mv terraform /usr/local/bin/

terraform --version
# Terraform v1.6.0
```

**Windows**:
```powershell
choco install terraform

terraform --version
```

### Basic Workflow

```
┌──────────────────────────────────────────────┐
│                                              │
│  1. terraform init   (Download providers)   │
│  2. terraform plan   (Preview changes)      │
│  3. terraform apply  (Execute changes)      │
│  4. terraform destroy (Clean up)            │
│                                              │
└──────────────────────────────────────────────┘
```

### First Example (AWS S3 Bucket)

**main.tf**:
```hcl
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "us-east-1"
}

resource "aws_s3_bucket" "my_bucket" {
  bucket = "my-unique-bucket-name-12345"
  
  tags = {
    Name        = "My Bucket"
    Environment = "Dev"
  }
}
```

**Execute**:
```bash
terraform init
# Initializing provider plugins...
# - hashicorp/aws v5.0.0

terraform plan
# Plan: 1 to add, 0 to change, 0 to destroy

terraform apply
# aws_s3_bucket.my_bucket: Creating...
# aws_s3_bucket.my_bucket: Creation complete after 2s

terraform destroy
# aws_s3_bucket.my_bucket: Destroying...
# Destroy complete!
```

---

## Core Concepts

### Resources

**Definition**: Infrastructure components (EC2, S3, RDS, etc.).

**Syntax**:
```hcl
resource "TYPE" "NAME" {
  argument1 = value1
  argument2 = value2
}
```

**Example**:
```hcl
resource "aws_instance" "web" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t2.micro"
  
  tags = {
    Name = "web-server"
  }
}
```

### Variables

**variables.tf**:
```hcl
variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t2.micro"
}

variable "allowed_ips" {
  description = "Allowed IPs for SSH"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
}
```

**Usage**:
```hcl
resource "aws_instance" "web" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = var.instance_type  # Reference variable
  
  tags = {
    Environment = var.environment
  }
}
```

**Passing Values**:
```bash
# CLI
terraform apply -var="environment=production"

# File (terraform.tfvars)
echo 'environment = "production"' > terraform.tfvars
terraform apply
```

### Outputs

**outputs.tf**:
```hcl
output "instance_ip" {
  description = "Public IP of EC2 instance"
  value       = aws_instance.web.public_ip
}

output "bucket_name" {
  description = "Name of S3 bucket"
  value       = aws_s3_bucket.my_bucket.id
}
```

**After Apply**:
```bash
terraform apply

# Outputs:
# instance_ip = "54.123.45.67"
# bucket_name = "my-unique-bucket-name-12345"
```

### Data Sources

**Read existing resources**:
```hcl
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"]  # Canonical
  
  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-focal-20.04-amd64-server-*"]
  }
}

resource "aws_instance" "web" {
  ami           = data.aws_ami.ubuntu.id  # Use latest Ubuntu AMI
  instance_type = "t2.micro"
}
```

---

## State Management

### What is Terraform State?

**terraform.tfstate**: JSON file tracking real-world resources.

**Example**:
```json
{
  "version": 4,
  "resources": [
    {
      "type": "aws_instance",
      "name": "web",
      "instances": [
        {
          "attributes": {
            "id": "i-0123456789abcdef0",
            "public_ip": "54.123.45.67",
            "instance_type": "t2.micro"
          }
        }
      ]
    }
  ]
}
```

### Remote State (S3 Backend)

**Problem**: Local state doesn't work for teams.

**Solution**: Store state in S3.

**backend.tf**:
```hcl
terraform {
  backend "s3" {
    bucket         = "my-terraform-state-bucket"
    key            = "prod/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-lock"  # State locking
    encrypt        = true
  }
}
```

**Create Backend Resources**:
```hcl
# S3 Bucket for state
resource "aws_s3_bucket" "terraform_state" {
  bucket = "my-terraform-state-bucket"
  
  versioning {
    enabled = true  # Keep state history
  }
  
  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        sse_algorithm = "AES256"
      }
    }
  }
}

# DynamoDB table for locking
resource "aws_dynamodb_table" "terraform_lock" {
  name         = "terraform-lock"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"
  
  attribute {
    name = "LockID"
    type = "S"
  }
}
```

**Initialize**:
```bash
terraform init
# Backend initialized in S3

terraform apply
# Multiple team members can now collaborate!
```

---

## Modules & Reusability

### What are Modules?

**Modules** = Reusable Terraform configurations.

**Structure**:
```
modules/
  ec2-instance/
    main.tf
    variables.tf
    outputs.tf
```

### Creating a Module

**modules/ec2-instance/variables.tf**:
```hcl
variable "instance_name" {
  type = string
}

variable "instance_type" {
  type    = string
  default = "t2.micro"
}

variable "ami_id" {
  type = string
}
```

**modules/ec2-instance/main.tf**:
```hcl
resource "aws_instance" "this" {
  ami           = var.ami_id
  instance_type = var.instance_type
  
  tags = {
    Name = var.instance_name
  }
}
```

**modules/ec2-instance/outputs.tf**:
```hcl
output "instance_id" {
  value = aws_instance.this.id
}

output "public_ip" {
  value = aws_instance.this.public_ip
}
```

### Using the Module

**main.tf**:
```hcl
module "web_server" {
  source = "./modules/ec2-instance"
  
  instance_name = "web-server"
  instance_type = "t2.small"
  ami_id        = "ami-0c55b159cbfafe1f0"
}

module "api_server" {
  source = "./modules/ec2-instance"
  
  instance_name = "api-server"
  instance_type = "t2.medium"
  ami_id        = "ami-0c55b159cbfafe1f0"
}

output "web_ip" {
  value = module.web_server.public_ip
}

output "api_ip" {
  value = module.api_server.public_ip
}
```

---

## Workspaces & Environments

### Workspaces

**Manage multiple environments** (dev, staging, prod).

```bash
# Create workspace
terraform workspace new dev
terraform workspace new staging
terraform workspace new prod

# List workspaces
terraform workspace list
# * default
#   dev
#   staging
#   prod

# Switch workspace
terraform workspace select dev
```

**Use Workspace in Config**:
```hcl
resource "aws_instance" "web" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = terraform.workspace == "prod" ? "t2.large" : "t2.micro"
  
  tags = {
    Name        = "web-${terraform.workspace}"
    Environment = terraform.workspace
  }
}
```

**Deploy**:
```bash
terraform workspace select dev
terraform apply
# Creates: web-dev (t2.micro)

terraform workspace select prod
terraform apply
# Creates: web-prod (t2.large)
```

---

## AWS Infrastructure Examples

### VPC with Public/Private Subnets

```hcl
# VPC
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  
  tags = {
    Name = "main-vpc"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
}

# Public Subnet
resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "us-east-1a"
  map_public_ip_on_launch = true
  
  tags = {
    Name = "public-subnet"
  }
}

# Private Subnet
resource "aws_subnet" "private" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = "us-east-1b"
  
  tags = {
    Name = "private-subnet"
  }
}

# Route Table (Public)
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }
  
  tags = {
    Name = "public-route-table"
  }
}

# Associate Route Table
resource "aws_route_table_association" "public" {
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.public.id
}
```

### Load Balancer + Auto Scaling

```hcl
# Application Load Balancer
resource "aws_lb" "main" {
  name               = "main-alb"
  internal           = false
  load_balancer_type = "application"
  subnets            = [aws_subnet.public.id, aws_subnet.public2.id]
  
  tags = {
    Name = "main-alb"
  }
}

# Target Group
resource "aws_lb_target_group" "web" {
  name     = "web-tg"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id
  
  health_check {
    path                = "/"
    healthy_threshold   = 2
    unhealthy_threshold = 10
  }
}

# Listener
resource "aws_lb_listener" "web" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"
  
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.web.arn
  }
}

# Launch Template
resource "aws_launch_template" "web" {
  name_prefix   = "web-"
  image_id      = "ami-0c55b159cbfafe1f0"
  instance_type = "t2.micro"
  
  user_data = base64encode(<<-EOF
    #!/bin/bash
    yum install -y httpd
    systemctl start httpd
    echo "Hello from $(hostname)" > /var/www/html/index.html
  EOF
  )
}

# Auto Scaling Group
resource "aws_autoscaling_group" "web" {
  name                = "web-asg"
  min_size            = 2
  max_size            = 10
  desired_capacity    = 3
  target_group_arns   = [aws_lb_target_group.web.arn]
  vpc_zone_identifier = [aws_subnet.public.id, aws_subnet.public2.id]
  
  launch_template {
    id      = aws_launch_template.web.id
    version = "$Latest"
  }
}
```

---

## LocalStack Development

### Provider Configuration

**main.tf**:
```hcl
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region                      = "us-east-1"
  access_key                  = "test"
  secret_key                  = "test"
  skip_credentials_validation = true
  skip_metadata_api_check     = true
  skip_requesting_account_id  = true
  
  endpoints {
    s3       = "http://localhost:4566"
    ec2      = "http://localhost:4566"
    dynamodb = "http://localhost:4566"
    sqs      = "http://localhost:4566"
    lambda   = "http://localhost:4566"
  }
}
```

### Full Application Stack

```hcl
# DynamoDB Table
resource "aws_dynamodb_table" "users" {
  name         = "Users"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "UserID"
  
  attribute {
    name = "UserID"
    type = "S"
  }
}

# S3 Bucket
resource "aws_s3_bucket" "uploads" {
  bucket = "user-uploads"
}

# SQS Queue
resource "aws_sqs_queue" "events" {
  name = "user-events"
}

# Lambda Function
resource "aws_lambda_function" "processor" {
  function_name = "event-processor"
  runtime       = "python3.9"
  handler       = "lambda_function.lambda_handler"
  role          = aws_iam_role.lambda.arn
  filename      = "lambda.zip"
}

# IAM Role for Lambda
resource "aws_iam_role" "lambda" {
  name = "lambda-role"
  
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
```

**Deploy to LocalStack**:
```bash
docker-compose up -d localstack

terraform init
terraform apply -auto-approve

# Resources created in LocalStack (zero AWS costs!)
```

---

## Complete Project Example

### Three-Tier Web Application

**Project Structure**:
```
terraform/
  main.tf
  variables.tf
  outputs.tf
  backend.tf
  modules/
    networking/
      main.tf
      variables.tf
      outputs.tf
    compute/
      main.tf
      variables.tf
      outputs.tf
    database/
      main.tf
      variables.tf
      outputs.tf
```

**main.tf**:
```hcl
module "networking" {
  source = "./modules/networking"
  
  vpc_cidr = var.vpc_cidr
  environment = var.environment
}

module "database" {
  source = "./modules/database"
  
  vpc_id = module.networking.vpc_id
  private_subnet_ids = module.networking.private_subnet_ids
  db_username = var.db_username
  db_password = var.db_password
}

module "compute" {
  source = "./modules/compute"
  
  vpc_id = module.networking.vpc_id
  public_subnet_ids = module.networking.public_subnet_ids
  db_endpoint = module.database.db_endpoint
  instance_count = var.instance_count
}
```

**Deploy**:
```bash
terraform init
terraform workspace new prod
terraform plan
terraform apply

# Outputs:
# load_balancer_dns = "main-alb-123456789.us-east-1.elb.amazonaws.com"
# database_endpoint = "mydb.c9akciq32.us-east-1.rds.amazonaws.com:5432"
```

---

This comprehensive Terraform guide covers fundamentals through production deployments with complete examples for local development (LocalStack) and AWS!
