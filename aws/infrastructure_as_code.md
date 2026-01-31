# Infrastructure as Code: CloudFormation, Terraform, SAM & CDK

## Table of Contents
1. [IaC Fundamentals](#iac-fundamentals)
2. [CloudFormation Deep Dive](#cloudformation-deep-dive)
3. [Terraform for AWS](#terraform-for-aws)
4. [AWS SAM (Serverless Application Model)](#aws-sam-serverless-application-model)
5. [AWS CDK (Cloud Development Kit)](#aws-cdk-cloud-development-kit)
6. [State Management](#state-management)
7. [Best Practices](#best-practices)
8. [LocalStack Examples](#localstack-examples)
9. [Production Patterns](#production-patterns)
10. [Interview Questions](#interview-questions)

---

## IaC Fundamentals

### What is Infrastructure as Code?

**Definition**: Managing infrastructure through code/configuration files rather than manual processes.

**Before IaC (Manual)**:
```
Tasks:
❌ Click through AWS Console to create resources
❌ Document steps in runbook (out of date quickly)
❌ Inconsistent environments (dev ≠ staging ≠ prod)
❌ No version control
❌ Hard to replicate
❌ Human error prone

Time: 2-3 hours to set up environment
Reproducibility: Poor
```

**With IaC**:
```
Tasks:
✅ Define infrastructure in code
✅ Version control (Git)
✅ Code review process
✅ Automated deployment
✅ Consistent environments
✅ Easy rollback

Time: 5-10 minutes (after initial template)
Reproducibility: Perfect
```

### IaC Benefits

**1. Version Control**:
```yaml
# infrastructure/vpc.yaml
# Git commit: Add VPC with 3 subnets
Resources:
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16

# Later: git log shows all infrastructure changes
# git diff shows what changed
# git revert to rollback
```

**2. Code Review**:
```
Developer: Creates pull request to add RDS instance
Reviewer: "DB instance too large, change to db.t3.medium"
Approval: Merge to main → Deploy via CI/CD
```

**3. Documentation**:
```
# Code IS documentation
# Read template → understand infrastructure
# No separate wiki needed
```

**4. Disaster Recovery**:
```
Scenario: us-east-1 region failure

Without IaC:
1. Manually recreate all resources in us-west-2 (12+ hours)
2. Likely missing some configurations
3. Downtime: 12-24 hours

With IaC:
1. Change region parameter: us-east-1 → us-west-2
2. Run deployment (10 minutes)
3. Downtime: <1 hour
```

### IaC Tools Comparison

| Feature | CloudFormation | Terraform | SAM | CDK |
|---------|----------------|-----------|-----|-----|
| **Provider** | AWS (native) | HashiCorp | AWS (serverless) | AWS |
| **Language** | YAML/JSON | HCL | YAML | TypeScript, Python, Java, C# |
| **Cloud Support** | AWS only | Multi-cloud | AWS only | AWS primarily |
| **State Management** | AWS managed | Manual (S3 + DynamoDB) | CloudFormation | CloudFormation |
| **Learning Curve** | Medium | Medium | Low | Medium-High |
| **Cost** | Free | Free (OSS) | Free | Free |
| **Drift Detection** | Yes | Yes | Yes (via CFN) | Yes (via CFN) |
| **Best For** | AWS-only, enterprise | Multi-cloud, complex | Serverless apps | Developers who prefer code |

---

## CloudFormation Deep Dive

### History & Evolution

```
2011: CloudFormation Launch
      - YAML/JSON templates
      - Declarative infrastructure

2013: Stack updates (change sets preview)
2014: Designer (visual editor)
2016: StackSets (multi-account/region)
2017: Nested stacks (modular templates)
2018: Drift detection
2019: Import resources into stacks
2020: Registry (third-party resources)
2021: CloudFormation hooks (policy validation)
2022: Stack import improvements
2023: AI-assisted template generation
```

### Template Anatomy

**Basic Structure**:
```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'VPC with public and private subnets'

# Optional: Template-level metadata
Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: "Network Configuration"
        Parameters:
          - VpcCIDR
          - PublicSubnetCIDR

# Input parameters
Parameters:
  VpcCIDR:
    Type: String
    Default: 10.0.0.0/16
    Description: CIDR block for VPC
    AllowedPattern: ^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/(1[6-9]|2[0-8]))$

  Environment:
    Type: String
    Default: dev
    AllowedValues:
      - dev
      - staging
      - prod

# Conditional logic
Conditions:
  IsProduction: !Equals [!Ref Environment, prod]
  CreateNATGateway: !Equals [!Ref Environment, prod]

# Resource definitions
Resources:
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCIDR
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-VPC'
        - Key: Environment
          Value: !Ref Environment

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-IGW'

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  PublicSubnet:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Select [0, !Cidr [!Ref VpcCIDR, 6, 8]]
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-Public-1'

  PrivateSubnet:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Select [1, !Cidr [!Ref VpcCIDR, 6, 8]]
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-Private-1'

  # Conditional NAT Gateway (prod only)
  NATGateway:
    Type: AWS::EC2::NatGateway
    Condition: CreateNATGateway
    Properties:
      AllocationId: !GetAtt NATGatewayEIP.AllocationId
      SubnetId: !Ref PublicSubnet
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-NAT'

  NATGatewayEIP:
    Type: AWS::EC2::EIP
    Condition: CreateNATGateway
    DependsOn: AttachGateway
    Properties:
      Domain: vpc

# Output values
Outputs:
  VPCId:
    Description: VPC ID
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-VPC-ID'

  PublicSubnetId:
    Description: Public Subnet ID
    Value: !Ref PublicSubnet
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnet-ID'

  PrivateSubnetId:
    Description: Private Subnet ID
    Value: !Ref PrivateSubnet
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnet-ID'
```

### Intrinsic Functions

**!Ref** - Reference parameter or resource:
```yaml
Parameters:
  InstanceType:
    Type: String
    Default: t3.micro

Resources:
  EC2Instance:
    Type: AWS::EC2::Instance
    Properties:
      InstanceType: !Ref InstanceType  # References parameter
      ImageId: ami-0c55b159cbfafe1f0
      SubnetId: !Ref PublicSubnet      # References resource
```

**!GetAtt** - Get attribute of resource:
```yaml
Resources:
  MyBucket:
    Type: AWS::S3::Bucket

  BucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref MyBucket
      PolicyDocument:
        Statement:
          - Effect: Allow
            Principal: '*'
            Action: 's3:GetObject'
            Resource: !Sub '${MyBucket.Arn}/*'  # Get ARN attribute
```

**!Sub** - String substitution:
```yaml
Resources:
  LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub '${AWS::StackName}-template'
      LaunchTemplateData:
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            echo "Stack Name: ${AWS::StackName}"
            echo "Region: ${AWS::Region}"
            echo "Account: ${AWS::AccountId}"
            echo "Custom: ${Environment}-${AppName}"
```

**!Join** - Join strings:
```yaml
!Join
  - ':'  # Delimiter
  - - 'arn:aws:s3::'
    - !Ref 'AWS::AccountId'
    - 'bucket/key'
# Result: "arn:aws:s3::123456789012:bucket/key"
```

**!Select** - Select from list:
```yaml
# Get first AZ
AvailabilityZone: !Select [0, !GetAZs '']

# Get specific element from CIDR split
SubnetCidr: !Select [0, !Cidr [10.0.0.0/16, 6, 8]]
```

**!Split** - Split string:
```yaml
Parameters:
  SubnetIds:
    Type: String
    Default: "subnet-123,subnet-456,subnet-789"

Resources:
  ALB:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Subnets: !Split [',', !Ref SubnetIds]
```

**!If** - Conditional:
```yaml
Conditions:
  IsProduction: !Equals [!Ref Environment, prod]

Resources:
  Database:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceClass: !If [IsProduction, db.r5.large, db.t3.micro]
      MultiAZ: !If [IsProduction, true, false]
```

**!Cidr** - Generate CIDR blocks:
```yaml
# Generate 6 subnets of /24 from 10.0.0.0/16
Subnets:
  - !Select [0, !Cidr [10.0.0.0/16, 6, 8]]  # 10.0.0.0/24
  - !Select [1, !Cidr [10.0.0.0/16, 6, 8]]  # 10.0.1.0/24
  - !Select [2, !Cidr [10.0.0.0/16, 6, 8]]  # 10.0.2.0/24
```

### Complete Example: 3-Tier Application

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: '3-Tier Web Application (Web, App, DB)'

Parameters:
  KeyName:
    Type: AWS::EC2::KeyPair::KeyName
    Description: SSH key pair name

  DBPassword:
    Type: String
    NoEcho: true
    Description: Database password
    MinLength: 8

  Environment:
    Type: String
    Default: dev
    AllowedValues: [dev, staging, prod]

Mappings:
  EnvironmentConfig:
    dev:
      InstanceType: t3.micro
      DBInstanceClass: db.t3.micro
      MinSize: 1
      MaxSize: 2
    prod:
      InstanceType: t3.medium
      DBInstanceClass: db.r5.large
      MinSize: 2
      MaxSize: 10

Conditions:
  IsProduction: !Equals [!Ref Environment, prod]

Resources:
  # VPC
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-VPC'

  # Internet Gateway
  InternetGateway:
    Type: AWS::EC2::InternetGateway

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  # Public Subnets (Web Tier)
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.1.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: Public-1

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.2.0/24
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: Public-2

  # Private Subnets (App Tier)
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.11.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: Private-App-1

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.12.0/24
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: Private-App-2

  # Database Subnets
  DatabaseSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.21.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: Private-DB-1

  DatabaseSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.22.0/24
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: Private-DB-2

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  PublicSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet1
      RouteTableId: !Ref PublicRouteTable

  PublicSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet2
      RouteTableId: !Ref PublicRouteTable

  # Security Groups
  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: ALB Security Group
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0

  WebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Web Server Security Group
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref ALBSecurityGroup

  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Database Security Group
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref WebServerSecurityGroup

  # Application Load Balancer
  ALB:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub '${AWS::StackName}-ALB'
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      SecurityGroups:
        - !Ref ALBSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-ALB'

  ALBTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub '${AWS::StackName}-TG'
      Port: 80
      Protocol: HTTP
      VpcId: !Ref VPC
      HealthCheckPath: /health
      HealthCheckIntervalSeconds: 30
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3

  ALBListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      LoadBalancerArn: !Ref ALB
      Port: 80
      Protocol: HTTP
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref ALBTargetGroup

  # Auto Scaling Group
  LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub '${AWS::StackName}-template'
      LaunchTemplateData:
        ImageId: ami-0c55b159cbfafe1f0  # Amazon Linux 2
        InstanceType: !FindInMap [EnvironmentConfig, !Ref Environment, InstanceType]
        KeyName: !Ref KeyName
        SecurityGroupIds:
          - !Ref WebServerSecurityGroup
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            yum update -y
            yum install -y httpd
            systemctl start httpd
            systemctl enable httpd
            echo "<h1>Hello from ${AWS::StackName}</h1>" > /var/www/html/index.html

  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      AutoScalingGroupName: !Sub '${AWS::StackName}-ASG'
      LaunchTemplate:
        LaunchTemplateId: !Ref LaunchTemplate
        Version: !GetAtt LaunchTemplate.LatestVersionNumber
      MinSize: !FindInMap [EnvironmentConfig, !Ref Environment, MinSize]
      MaxSize: !FindInMap [EnvironmentConfig, !Ref Environment, MaxSize]
      DesiredCapacity: !FindInMap [EnvironmentConfig, !Ref Environment, MinSize]
      VPCZoneIdentifier:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      TargetGroupARNs:
        - !Ref ALBTargetGroup
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-WebServer'
          PropagateAtLaunch: true

  # RDS Database
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: Database subnet group
      SubnetIds:
        - !Ref DatabaseSubnet1
        - !Ref DatabaseSubnet2

  Database:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceIdentifier: !Sub '${AWS::StackName}-db'
      Engine: mysql
      EngineVersion: '8.0'
      DBInstanceClass: !FindInMap [EnvironmentConfig, !Ref Environment, DBInstanceClass]
      AllocatedStorage: '20'
      StorageType: gp2
      MasterUsername: admin
      MasterUserPassword: !Ref DBPassword
      DBSubnetGroupName: !Ref DBSubnetGroup
      VPCSecurityGroups:
        - !Ref DatabaseSecurityGroup
      MultiAZ: !If [IsProduction, true, false]
      BackupRetentionPeriod: !If [IsProduction, 7, 1]
      PreferredBackupWindow: '03:00-04:00'
      PreferredMaintenanceWindow: 'sun:04:00-sun:05:00'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-Database'

Outputs:
  ALBEndpoint:
    Description: Application Load Balancer DNS
    Value: !GetAtt ALB.DNSName
    Export:
      Name: !Sub '${AWS::StackName}-ALB-DNS'

  DatabaseEndpoint:
    Description: Database endpoint
    Value: !GetAtt Database.Endpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-DB-Endpoint'

  VPCId:
    Description: VPC ID
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-VPC-ID'
```

### Stack Operations

**Create Stack**:
```bash
aws cloudformation create-stack \
  --stack-name my-app-prod \
  --template-body file://template.yaml \
  --parameters \
    ParameterKey=Environment,ParameterValue=prod \
    ParameterKey=KeyName,ParameterValue=my-key \
    ParameterKey=DBPassword,ParameterValue=SecurePassword123 \
  --capabilities CAPABILITY_IAM \
  --tags Key=Project,Value=MyApp Key=Owner,Value=DevTeam
```

**Update Stack (with Change Set)**:
```bash
# Create change set (preview changes)
aws cloudformation create-change-set \
  --stack-name my-app-prod \
  --template-body file://template-v2.yaml \
  --change-set-name update-v2 \
  --parameters ParameterKey=Environment,ParameterValue=prod

# Describe change set
aws cloudformation describe-change-set \
  --stack-name my-app-prod \
  --change-set-name update-v2

# Execute change set
aws cloudformation execute-change-set \
  --stack-name my-app-prod \
  --change-set-name update-v2
```

**Delete Stack**:
```bash
aws cloudformation delete-stack --stack-name my-app-prod

# Wait for deletion
aws cloudformation wait stack-delete-complete --stack-name my-app-prod
```

### Nested Stacks

**Parent Stack**:
```yaml
Resources:
  NetworkStack:
    Type: AWS::CloudFormation::Stack
    Properties:
      TemplateURL: https://s3.amazonaws.com/my-templates/network.yaml
      Parameters:
        VpcCIDR: 10.0.0.0/16
        Environment: !Ref Environment

  ApplicationStack:
    Type: AWS::CloudFormation::Stack
    DependsOn: NetworkStack
    Properties:
      TemplateURL: https://s3.amazonaws.com/my-templates/application.yaml
      Parameters:
        VPCId: !GetAtt NetworkStack.Outputs.VPCId
        PublicSubnets: !GetAtt NetworkStack.Outputs.PublicSubnets
        Environment: !Ref Environment

  DatabaseStack:
    Type: AWS::CloudFormation::Stack
    DependsOn: NetworkStack
    Properties:
      TemplateURL: https://s3.amazonaws.com/my-templates/database.yaml
      Parameters:
        VPCId: !GetAtt NetworkStack.Outputs.VPCId
        DatabaseSubnets: !GetAtt NetworkStack.Outputs.DatabaseSubnets
        DBPassword: !Ref DBPassword
```

---

## Terraform for AWS

### Installation & Setup

```bash
# Install Terraform (Windows)
choco install terraform

# Verify
terraform version

# Initialize working directory
terraform init
```

### Provider Configuration

```hcl
# main.tf
terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  
  # Remote state (S3 + DynamoDB)
  backend "s3" {
    bucket         = "my-terraform-state"
    key            = "prod/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-state-lock"
    encrypt        = true
  }
}

provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Project     = "MyApp"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}
```

### Variables

```hcl
# variables.tf
variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "vpc_cidr" {
  description = "VPC CIDR block"
  type        = string
  default     = "10.0.0.0/16"
}

variable "instance_count" {
  description = "Number of EC2 instances"
  type        = number
  default     = 2
  
  validation {
    condition     = var.instance_count >= 1 && var.instance_count <= 10
    error_message = "Instance count must be between 1 and 10."
  }
}

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

# Complex types
variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b"]
}

variable "instance_config" {
  description = "Instance configuration"
  type = object({
    type = string
    ami  = string
  })
  default = {
    type = "t3.micro"
    ami  = "ami-0c55b159cbfafe1f0"
  }
}

variable "tags" {
  description = "Resource tags"
  type        = map(string)
  default = {
    Project = "MyApp"
  }
}
```

**Variable Files**:
```hcl
# terraform.tfvars (default)
environment = "prod"
aws_region  = "us-east-1"

# dev.tfvars
environment    = "dev"
instance_count = 1

# prod.tfvars
environment    = "prod"
instance_count = 5
vpc_cidr       = "10.1.0.0/16"
```

**Using Variables**:
```bash
# Use default tfvars
terraform apply

# Use specific var file
terraform apply -var-file="prod.tfvars"

# Override from command line
terraform apply -var="environment=staging" -var="instance_count=3"
```

### Resources

**VPC Example**:
```hcl
# vpc.tf
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = {
    Name = "${var.environment}-vpc"
  }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  
  tags = {
    Name = "${var.environment}-igw"
  }
}

# Data source (query existing resources)
data "aws_availability_zones" "available" {
  state = "available"
}

resource "aws_subnet" "public" {
  count = 2
  
  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true
  
  tags = {
    Name = "${var.environment}-public-${count.index + 1}"
  }
}

resource "aws_subnet" "private" {
  count = 2
  
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 10)
  availability_zone = data.aws_availability_zones.available.names[count.index]
  
  tags = {
    Name = "${var.environment}-private-${count.index + 1}"
  }
}

# Route table
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }
  
  tags = {
    Name = "${var.environment}-public-rt"
  }
}

resource "aws_route_table_association" "public" {
  count = length(aws_subnet.public)
  
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}
```

**Complete 3-Tier Application**:
```hcl
# security_groups.tf
resource "aws_security_group" "alb" {
  name        = "${var.environment}-alb-sg"
  description = "ALB security group"
  vpc_id      = aws_vpc.main.id
  
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "web" {
  name        = "${var.environment}-web-sg"
  description = "Web server security group"
  vpc_id      = aws_vpc.main.id
  
  ingress {
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "database" {
  name        = "${var.environment}-db-sg"
  description = "Database security group"
  vpc_id      = aws_vpc.main.id
  
  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.web.id]
  }
}

# alb.tf
resource "aws_lb" "main" {
  name               = "${var.environment}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id
  
  enable_deletion_protection = var.environment == "prod"
}

resource "aws_lb_target_group" "main" {
  name     = "${var.environment}-tg"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id
  
  health_check {
    path                = "/health"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 3
  }
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"
  
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.main.arn
  }
}

# ec2.tf
resource "aws_launch_template" "main" {
  name_prefix   = "${var.environment}-template"
  image_id      = var.instance_config.ami
  instance_type = var.instance_config.type
  
  vpc_security_group_ids = [aws_security_group.web.id]
  
  user_data = base64encode(templatefile("${path.module}/user_data.sh", {
    environment = var.environment
  }))
  
  tag_specifications {
    resource_type = "instance"
    
    tags = {
      Name = "${var.environment}-web-server"
    }
  }
}

resource "aws_autoscaling_group" "main" {
  name                = "${var.environment}-asg"
  vpc_zone_identifier = aws_subnet.private[*].id
  target_group_arns   = [aws_lb_target_group.main.arn]
  health_check_type   = "ELB"
  
  min_size         = var.environment == "prod" ? 2 : 1
  max_size         = var.environment == "prod" ? 10 : 2
  desired_capacity = var.environment == "prod" ? 2 : 1
  
  launch_template {
    id      = aws_launch_template.main.id
    version = "$Latest"
  }
  
  tag {
    key                 = "Name"
    value               = "${var.environment}-web-server"
    propagate_at_launch = true
  }
}

# rds.tf
resource "aws_db_subnet_group" "main" {
  name       = "${var.environment}-db-subnet-group"
  subnet_ids = aws_subnet.private[*].id
}

resource "aws_db_instance" "main" {
  identifier = "${var.environment}-database"
  
  engine         = "mysql"
  engine_version = "8.0"
  instance_class = var.environment == "prod" ? "db.r5.large" : "db.t3.micro"
  
  allocated_storage     = 20
  storage_type          = "gp2"
  storage_encrypted     = true
  
  db_name  = "myapp"
  username = "admin"
  password = var.db_password
  
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.database.id]
  
  multi_az               = var.environment == "prod"
  backup_retention_period = var.environment == "prod" ? 7 : 1
  skip_final_snapshot    = var.environment != "prod"
  
  tags = {
    Name = "${var.environment}-database"
  }
}

# outputs.tf
output "alb_dns" {
  description = "ALB DNS name"
  value       = aws_lb.main.dns_name
}

output "database_endpoint" {
  description = "Database endpoint"
  value       = aws_db_instance.main.endpoint
  sensitive   = true
}

output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}
```

### Modules

**Creating Module**:
```hcl
# modules/vpc/main.tf
variable "cidr_block" {
  type = string
}

variable "environment" {
  type = string
}

variable "availability_zones" {
  type    = list(string)
  default = ["us-east-1a", "us-east-1b"]
}

resource "aws_vpc" "this" {
  cidr_block           = var.cidr_block
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = {
    Name        = "${var.environment}-vpc"
    Environment = var.environment
  }
}

resource "aws_subnet" "public" {
  count = length(var.availability_zones)
  
  vpc_id                  = aws_vpc.this.id
  cidr_block              = cidrsubnet(var.cidr_block, 8, count.index)
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true
  
  tags = {
    Name = "${var.environment}-public-${count.index + 1}"
  }
}

output "vpc_id" {
  value = aws_vpc.this.id
}

output "public_subnet_ids" {
  value = aws_subnet.public[*].id
}

# modules/vpc/versions.tf
terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}
```

**Using Module**:
```hcl
# main.tf
module "vpc" {
  source = "./modules/vpc"
  
  cidr_block         = "10.0.0.0/16"
  environment        = "prod"
  availability_zones = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

module "web_app" {
  source = "terraform-aws-modules/alb/aws"
  version = "8.0.0"
  
  name    = "my-alb"
  vpc_id  = module.vpc.vpc_id
  subnets = module.vpc.public_subnet_ids
  
  # ... other config
}

output "vpc_id" {
  value = module.vpc.vpc_id
}
```

### Terraform Commands

```bash
# Initialize
terraform init

# Validate
terraform validate

# Format
terraform fmt -recursive

# Plan (preview changes)
terraform plan
terraform plan -out=tfplan

# Apply
terraform apply
terraform apply tfplan
terraform apply -auto-approve

# Destroy
terraform destroy
terraform destroy -target=aws_instance.web

# State management
terraform state list
terraform state show aws_instance.web
terraform state rm aws_instance.web

# Import existing resource
terraform import aws_instance.web i-1234567890abcdef0

# Output
terraform output
terraform output -json

# Workspace (environments)
terraform workspace list
terraform workspace new prod
terraform workspace select prod
```

---

## AWS SAM (Serverless Application Model)

### SAM Template

```yaml
# template.yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31
Description: Serverless API with Lambda and DynamoDB

Globals:
  Function:
    Timeout: 30
    Runtime: python3.11
    Environment:
      Variables:
        TABLE_NAME: !Ref UsersTable
        STAGE: !Ref Stage

Parameters:
  Stage:
    Type: String
    Default: dev
    AllowedValues: [dev, staging, prod]

Resources:
  # API Gateway
  ApiGateway:
    Type: AWS::Serverless::Api
    Properties:
      Name: !Sub '${AWS::StackName}-api'
      StageName: !Ref Stage
      Cors:
        AllowMethods: "'GET,POST,PUT,DELETE,OPTIONS'"
        AllowHeaders: "'Content-Type,Authorization'"
        AllowOrigin: "'*'"
      Auth:
        DefaultAuthorizer: CognitoAuthorizer
        Authorizers:
          CognitoAuthorizer:
            UserPoolArn: !GetAtt UserPool.Arn

  # Lambda Functions
  GetUsersFunction:
    Type: AWS::Serverless::Function
    Properties:
      FunctionName: !Sub '${AWS::StackName}-get-users'
      CodeUri: functions/get_users/
      Handler: app.lambda_handler
      Policies:
        - DynamoDBReadPolicy:
            TableName: !Ref UsersTable
      Events:
        GetUsers:
          Type: Api
          Properties:
            RestApiId: !Ref ApiGateway
            Path: /users
            Method: GET

  CreateUserFunction:
    Type: AWS::Serverless::Function
    Properties:
      FunctionName: !Sub '${AWS::StackName}-create-user'
      CodeUri: functions/create_user/
      Handler: app.lambda_handler
      Policies:
        - DynamoDBCrudPolicy:
            TableName: !Ref UsersTable
      Events:
        CreateUser:
          Type: Api
          Properties:
            RestApiId: !Ref ApiGateway
            Path: /users
            Method: POST

  # DynamoDB Table
  UsersTable:
    Type: AWS::Serverless::SimpleTable
    Properties:
      TableName: !Sub '${AWS::StackName}-users'
      PrimaryKey:
        Name: userId
        Type: String
      ProvisionedThroughput:
        ReadCapacityUnits: !If [IsProduction, 5, 1]
        WriteCapacityUnits: !If [IsProduction, 5, 1]

  # Cognito User Pool
  UserPool:
    Type: AWS::Cognito::UserPool
    Properties:
      UserPoolName: !Sub '${AWS::StackName}-users'
      AutoVerifiedAttributes:
        - email
      Schema:
        - Name: email
          Required: true
          Mutable: false

  UserPoolClient:
    Type: AWS::Cognito::UserPoolClient
    Properties:
      UserPoolId: !Ref UserPool
      GenerateSecret: false
      ExplicitAuthFlows:
        - ALLOW_USER_PASSWORD_AUTH
        - ALLOW_REFRESH_TOKEN_AUTH

Conditions:
  IsProduction: !Equals [!Ref Stage, prod]

Outputs:
  ApiUrl:
    Description: API Gateway endpoint
    Value: !Sub 'https://${ApiGateway}.execute-api.${AWS::Region}.amazonaws.com/${Stage}'
  
  UserPoolId:
    Description: Cognito User Pool ID
    Value: !Ref UserPool
  
  UserPoolClientId:
    Description: Cognito User Pool Client ID
    Value: !Ref UserPoolClient
```

**Lambda Function**:
```python
# functions/get_users/app.py
import json
import os
import boto3

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['TABLE_NAME'])

def lambda_handler(event, context):
    try:
        response = table.scan()
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'users': response.get('Items', [])
            })
        }
    except Exception as e:
        print(f"Error: {e}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
```

**SAM CLI Commands**:
```bash
# Build
sam build

# Local testing
sam local start-api
sam local invoke GetUsersFunction --event events/get_users.json

# Deploy
sam deploy --guided  # First time
sam deploy  # Subsequent deployments

# Delete
sam delete
```

---

## AWS CDK (Cloud Development Kit)

### CDK with Python

```python
# app.py
from aws_cdk import App
from infrastructure.vpc_stack import VpcStack
from infrastructure.application_stack import ApplicationStack

app = App()

# VPC Stack
vpc_stack = VpcStack(
    app, "VpcStack",
    env={'region': 'us-east-1'}
)

# Application Stack
app_stack = ApplicationStack(
    app, "AppStack",
    vpc=vpc_stack.vpc,
    env={'region': 'us-east-1'}
)

app.synth()
```

```python
# infrastructure/vpc_stack.py
from aws_cdk import (
    Stack,
    aws_ec2 as ec2,
    CfnOutput
)
from constructs import Construct

class VpcStack(Stack):
    def __init__(self, scope: Construct, id: str, **kwargs):
        super().__init__(scope, id, **kwargs)
        
        # VPC
        self.vpc = ec2.Vpc(
            self, "VPC",
            vpc_name="my-vpc",
            max_azs=2,
            cidr="10.0.0.0/16",
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    subnet_type=ec2.SubnetType.PUBLIC,
                    name="Public",
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    name="Private",
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
                    name="Database",
                    cidr_mask=24
                )
            ],
            nat_gateways=1
        )
        
        # Outputs
        CfnOutput(
            self, "VpcId",
            value=self.vpc.vpc_id,
            export_name="VpcId"
        )
```

```python
# infrastructure/application_stack.py
from aws_cdk import (
    Stack,
    Duration,
    aws_ec2 as ec2,
    aws_elasticloadbalancingv2 as elbv2,
    aws_autoscaling as autoscaling,
    aws_rds as rds,
    aws_secretsmanager as secretsmanager,
    CfnOutput
)
from constructs import Construct

class ApplicationStack(Stack):
    def __init__(self, scope: Construct, id: str, vpc: ec2.Vpc, **kwargs):
        super().__init__(scope, id, **kwargs)
        
        # Security Groups
        alb_sg = ec2.SecurityGroup(
            self, "ALBSG",
            vpc=vpc,
            description="ALB Security Group",
            allow_all_outbound=True
        )
        alb_sg.add_ingress_rule(
            ec2.Peer.any_ipv4(),
            ec2.Port.tcp(80),
            "Allow HTTP"
        )
        
        web_sg = ec2.SecurityGroup(
            self, "WebSG",
            vpc=vpc,
            description="Web Server Security Group"
        )
        web_sg.add_ingress_rule(
            alb_sg,
            ec2.Port.tcp(80),
            "Allow from ALB"
        )
        
        db_sg = ec2.SecurityGroup(
            self, "DatabaseSG",
            vpc=vpc,
            description="Database Security Group"
        )
        db_sg.add_ingress_rule(
            web_sg,
            ec2.Port.tcp(3306),
            "Allow from Web Servers"
        )
        
        # ALB
        alb = elbv2.ApplicationLoadBalancer(
            self, "ALB",
            vpc=vpc,
            internet_facing=True,
            security_group=alb_sg
        )
        
        # Target Group
        target_group = elbv2.ApplicationTargetGroup(
            self, "TargetGroup",
            vpc=vpc,
            port=80,
            protocol=elbv2.ApplicationProtocol.HTTP,
            target_type=elbv2.TargetType.INSTANCE,
            health_check=elbv2.HealthCheck(
                path="/health",
                interval=Duration.seconds(30),
                timeout=Duration.seconds(5),
                healthy_threshold_count=2,
                unhealthy_threshold_count=3
            )
        )
        
        # Listener
        listener = alb.add_listener(
            "Listener",
            port=80,
            open=True,
            default_target_groups=[target_group]
        )
        
        # Auto Scaling Group
        user_data = ec2.UserData.for_linux()
        user_data.add_commands(
            "yum update -y",
            "yum install -y httpd",
            "systemctl start httpd",
            "systemctl enable httpd",
            "echo '<h1>Hello from CDK</h1>' > /var/www/html/index.html"
        )
        
        asg = autoscaling.AutoScalingGroup(
            self, "ASG",
            vpc=vpc,
            instance_type=ec2.InstanceType("t3.micro"),
            machine_image=ec2.AmazonLinuxImage(
                generation=ec2.AmazonLinuxGeneration.AMAZON_LINUX_2
            ),
            security_group=web_sg,
            user_data=user_data,
            min_capacity=1,
            max_capacity=5,
            desired_capacity=2,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            )
        )
        
        # Attach ASG to Target Group
        asg.attach_to_application_target_group(target_group)
        
        # Database Password
        db_password_secret = secretsmanager.Secret(
            self, "DBPassword",
            generate_secret_string=secretsmanager.SecretStringGenerator(
                password_length=16,
                exclude_punctuation=True
            )
        )
        
        # RDS
        database = rds.DatabaseInstance(
            self, "Database",
            engine=rds.DatabaseInstanceEngine.mysql(
                version=rds.MysqlEngineVersion.VER_8_0
            ),
            instance_type=ec2.InstanceType("db.t3.micro"),
            vpc=vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_ISOLATED
            ),
            security_groups=[db_sg],
            credentials=rds.Credentials.from_secret(db_password_secret),
            database_name="myapp",
            allocated_storage=20,
            multi_az=False,
            backup_retention=Duration.days(7),
            removal_policy=Stack.of(self).node.try_get_context("environment") == "prod"
        )
        
        # Outputs
        CfnOutput(
            self, "LoadBalancerDNS",
            value=alb.load_balancer_dns_name
        )
        
        CfnOutput(
            self, "DatabaseEndpoint",
            value=database.db_instance_endpoint_address
        )
```

**CDK Commands**:
```bash
# Install CDK
npm install -g aws-cdk

# Initialize project
cdk init app --language python

# Install dependencies
pip install -r requirements.txt

# Synth CloudFormation
cdk synth

# Deploy
cdk deploy --all

# Diff
cdk diff

# Destroy
cdk destroy --all
```

---

## State Management

### Terraform State

**Local State** (default):
```hcl
# State stored in terraform.tfstate (local file)
# Not recommended for teams
```

**Remote State** (S3 + DynamoDB):
```hcl
# backend.tf
terraform {
  backend "s3" {
    bucket         = "my-terraform-state"
    key            = "prod/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-state-lock"
    encrypt        = true
  }
}
```

**Setup Remote State**:
```bash
# Create S3 bucket for state
aws s3api create-bucket \
  --bucket my-terraform-state \
  --region us-east-1

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket my-terraform-state \
  --versioning-configuration Status=Enabled

# Create DynamoDB table for locking
aws dynamodb create-table \
  --table-name terraform-state-lock \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5
```

### CloudFormation State

**Automatic State Management**:
```
Stack Creation:
- CloudFormation stores state in AWS
- Physical resource IDs tracked
- No manual state management needed

Stack Updates:
- CloudFormation compares desired vs actual state
- Creates change sets showing differences
- Updates only changed resources

Stack Deletion:
- CloudFormation deletes all stack resources
- State automatically cleaned up
```

---

## Best Practices

### 1. Version Control

```bash
# .gitignore
# Terraform
*.tfstate
*.tfstate.*
.terraform/
*.tfvars  # Contains secrets

# CDK
cdk.out/
.cdk.staging/

# SAM
.aws-sam/
```

### 2. Secrets Management

**Don't commit secrets**:
```hcl
# ❌ BAD
variable "db_password" {
  default = "MyPassword123"  # Hardcoded!
}

# ✅ GOOD
variable "db_password" {
  type      = string
  sensitive = true
  # Passed via CLI or env var
}
```

**Use AWS Secrets Manager**:
```hcl
data "aws_secretsmanager_secret_version" "db_password" {
  secret_id = "prod/db/password"
}

resource "aws_db_instance" "main" {
  password = data.aws_secretsmanager_secret_version.db_password.secret_string
}
```

### 3. Naming Conventions

```hcl
# Resource naming: {environment}-{app}-{resource}-{suffix}
resource "aws_s3_bucket" "data" {
  bucket = "${var.environment}-myapp-data-${var.region}"
  # prod-myapp-data-us-east-1
}

# Tag all resources
default_tags {
  tags = {
    Environment = var.environment
    Application = "MyApp"
    ManagedBy   = "Terraform"
    Owner       = "DevOps"
    CostCenter  = "Engineering"
  }
}
```

### 4. Modular Design

```hcl
# Separate concerns
modules/
  network/  # VPC, subnets, routing
  compute/  # EC2, ASG, ALB
  database/ # RDS, ElastiCache
  storage/  # S3, EFS

environments/
  dev/
  staging/
  prod/
```

### 5. Environment Separation

```bash
# Separate state per environment
backend "s3" {
  bucket = "terraform-state"
  key    = "${var.environment}/terraform.tfstate"  # dev/, prod/
}

# Use workspaces
terraform workspace new dev
terraform workspace new prod
```

### 6. Drift Detection

**CloudFormation Drift Detection**:
```bash
# Detect drift
aws cloudformation detect-stack-drift --stack-name my-app-prod

# Get drift status
aws cloudformation describe-stack-drift-detection-status \
  --stack-drift-detection-id <id>

# View drifted resources
aws cloudformation describe-stack-resource-drifts \
  --stack-name my-app-prod
```

**Terraform Drift Detection**:
```bash
# Refresh state
terraform refresh

# Plan shows drift
terraform plan
# Output:
# Note: Objects have changed outside of Terraform
# ...
```

---

## LocalStack Examples

### Setup LocalStack

```yaml
# docker-compose.yml
version: '3.8'

services:
  localstack:
    image: localstack/localstack:latest
    ports:
      - "4566:4566"
    environment:
      - SERVICES=s3,lambda,dynamodb,apigateway,cloudformation,iam,secretsmanager
      - DEBUG=1
      - LAMBDA_EXECUTOR=docker
      - DOCKER_HOST=unix:///var/run/docker.sock
    volumes:
      - "/var/run/docker.sock:/var/run/docker.sock"
      - "./localstack:/tmp/localstack"
```

### CloudFormation with LocalStack

```yaml
# localstack-template.yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'LocalStack Test Stack'

Resources:
  DataBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: my-data-bucket

  UsersTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: Users
      AttributeDefinitions:
        - AttributeName: userId
          AttributeType: S
      KeySchema:
        - AttributeName: userId
          KeyType: HASH
      BillingMode: PAY_PER_REQUEST

  ProcessorFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: DataProcessor
      Runtime: python3.11
      Handler: index.lambda_handler
      Code:
        ZipFile: |
          import json
          def lambda_handler(event, context):
              return {
                  'statusCode': 200,
                  'body': json.dumps('Hello from LocalStack!')
              }
      Role: !GetAtt LambdaExecutionRole.Arn

  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

Outputs:
  BucketName:
    Value: !Ref DataBucket
  TableName:
    Value: !Ref UsersTable
  FunctionArn:
    Value: !GetAtt ProcessorFunction.Arn
```

**Deploy to LocalStack**:
```bash
# Start LocalStack
docker-compose up -d

# Deploy stack
aws cloudformation create-stack \
  --stack-name test-stack \
  --template-body file://localstack-template.yaml \
  --capabilities CAPABILITY_IAM \
  --endpoint-url=http://localhost:4566

# Check status
aws cloudformation describe-stacks \
  --stack-name test-stack \
  --endpoint-url=http://localhost:4566

# Test Lambda
aws lambda invoke \
  --function-name DataProcessor \
  --endpoint-url=http://localhost:4566 \
  response.json

cat response.json
```

### Terraform with LocalStack

```hcl
# localstack.tf
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
    s3             = "http://localhost:4566"
    dynamodb       = "http://localhost:4566"
    lambda         = "http://localhost:4566"
    apigateway     = "http://localhost:4566"
    iam            = "http://localhost:4566"
    secretsmanager = "http://localhost:4566"
  }
}

# S3 Bucket
resource "aws_s3_bucket" "data" {
  bucket = "my-data-bucket"
}

resource "aws_s3_object" "config" {
  bucket  = aws_s3_bucket.data.id
  key     = "config.json"
  content = jsonencode({
    environment = "localstack"
    version     = "1.0"
  })
}

# DynamoDB Table
resource "aws_dynamodb_table" "users" {
  name           = "Users"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "userId"

  attribute {
    name = "userId"
    type = "S"
  }
}

# Secrets Manager
resource "aws_secretsmanager_secret" "db_password" {
  name = "db/password"
}

resource "aws_secretsmanager_secret_version" "db_password" {
  secret_id     = aws_secretsmanager_secret.db_password.id
  secret_string = jsonencode({
    password = "MySecurePassword123"
  })
}

# Lambda Function
data "archive_file" "lambda_zip" {
  type        = "zip"
  source_dir  = "${path.module}/lambda"
  output_path = "${path.module}/lambda.zip"
}

resource "aws_iam_role" "lambda_role" {
  name = "lambda_execution_role"

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

resource "aws_lambda_function" "processor" {
  filename      = data.archive_file.lambda_zip.output_path
  function_name = "DataProcessor"
  role          = aws_iam_role.lambda_role.arn
  handler       = "index.lambda_handler"
  runtime       = "python3.11"

  environment {
    variables = {
      TABLE_NAME = aws_dynamodb_table.users.name
      BUCKET_NAME = aws_s3_bucket.data.id
    }
  }
}

output "bucket_name" {
  value = aws_s3_bucket.data.id
}

output "table_name" {
  value = aws_dynamodb_table.users.name
}

output "function_arn" {
  value = aws_lambda_function.processor.arn
}
```

**Lambda Function**:
```python
# lambda/index.py
import json
import os
import boto3

dynamodb = boto3.resource('dynamodb', endpoint_url='http://localstack:4566')
s3 = boto3.client('s3', endpoint_url='http://localstack:4566')

TABLE_NAME = os.environ['TABLE_NAME']
BUCKET_NAME = os.environ['BUCKET_NAME']

def lambda_handler(event, context):
    table = dynamodb.Table(TABLE_NAME)
    
    # Read from S3
    response = s3.get_object(Bucket=BUCKET_NAME, Key='config.json')
    config = json.loads(response['Body'].read())
    
    # Write to DynamoDB
    table.put_item(Item={
        'userId': '123',
        'name': 'Test User',
        'environment': config['environment']
    })
    
    return {
        'statusCode': 200,
        'body': json.dumps('Success!')
    }
```

**Run with LocalStack**:
```bash
# Start LocalStack
docker-compose up -d

# Initialize Terraform
terraform init

# Apply
terraform apply -auto-approve

# Test Lambda
aws lambda invoke \
  --function-name DataProcessor \
  --endpoint-url=http://localhost:4566 \
  response.json

# Verify DynamoDB
aws dynamodb scan \
  --table-name Users \
  --endpoint-url=http://localhost:4566
```

---

## Production Patterns

### 1. GitOps Workflow

```yaml
# .github/workflows/terraform.yml
name: Terraform CI/CD

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  TF_VERSION: 1.5.0

jobs:
  terraform:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v2
        with:
          terraform_version: ${{ env.TF_VERSION }}
      
      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Terraform Init
        run: terraform init
      
      - name: Terraform Format
        run: terraform fmt -check
      
      - name: Terraform Validate
        run: terraform validate
      
      - name: Terraform Plan
        if: github.event_name == 'pull_request'
        run: terraform plan -no-color
        continue-on-error: true
      
      - name: Comment PR
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v6
        with:
          script: |
            const output = `#### Terraform Format and Style 🖌\`${{ steps.fmt.outcome }}\`
            #### Terraform Initialization ⚙️\`${{ steps.init.outcome }}\`
            #### Terraform Plan 📖\`${{ steps.plan.outcome }}\`
            
            <details><summary>Show Plan</summary>
            
            \`\`\`terraform
            ${{ steps.plan.outputs.stdout }}
            \`\`\`
            
            </details>`;
            
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: output
            })
      
      - name: Terraform Apply
        if: github.ref == 'refs/heads/main' && github.event_name == 'push'
        run: terraform apply -auto-approve
```

### 2. Multi-Environment Strategy

**Directory Structure**:
```
infrastructure/
  modules/
    vpc/
    compute/
    database/
  environments/
    dev/
      main.tf
      variables.tf
      terraform.tfvars
    staging/
      main.tf
      variables.tf
      terraform.tfvars
    prod/
      main.tf
      variables.tf
      terraform.tfvars
```

**Environment Configuration**:
```hcl
# environments/prod/main.tf
module "vpc" {
  source = "../../modules/vpc"
  
  environment = "prod"
  cidr_block  = "10.1.0.0/16"
  
  enable_nat_gateway = true
  single_nat_gateway = false  # HA in prod
}

module "compute" {
  source = "../../modules/compute"
  
  environment  = "prod"
  vpc_id       = module.vpc.vpc_id
  subnet_ids   = module.vpc.private_subnet_ids
  
  instance_type = "t3.medium"
  min_size      = 2
  max_size      = 10
}

# environments/dev/main.tf
module "vpc" {
  source = "../../modules/vpc"
  
  environment = "dev"
  cidr_block  = "10.0.0.0/16"
  
  enable_nat_gateway = true
  single_nat_gateway = true  # Cost savings in dev
}

module "compute" {
  source = "../../modules/compute"
  
  environment  = "dev"
  vpc_id       = module.vpc.vpc_id
  subnet_ids   = module.vpc.private_subnet_ids
  
  instance_type = "t3.micro"
  min_size      = 1
  max_size      = 2
}
```

### 3. Blue-Green Deployment with IaC

**CloudFormation Blue-Green**:
```yaml
# blue-green.yaml
Parameters:
  ActiveVersion:
    Type: String
    Default: blue
    AllowedValues: [blue, green]

Conditions:
  BlueActive: !Equals [!Ref ActiveVersion, blue]

Resources:
  # Blue Environment
  BlueTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: blue-tg
      Port: 80
      Protocol: HTTP
      VpcId: !Ref VPC

  BlueAutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      AutoScalingGroupName: blue-asg
      MinSize: 2
      MaxSize: 10
      TargetGroupARNs:
        - !If [BlueActive, !Ref BlueTargetGroup, !Ref 'AWS::NoValue']
      # ... other config

  # Green Environment
  GreenTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: green-tg
      Port: 80
      Protocol: HTTP
      VpcId: !Ref VPC

  GreenAutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      AutoScalingGroupName: green-asg
      MinSize: 2
      MaxSize: 10
      TargetGroupARNs:
        - !If [BlueActive, !Ref 'AWS::NoValue', !Ref GreenTargetGroup]
      # ... other config

  # ALB Listener switches between blue and green
  Listener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      LoadBalancerArn: !Ref ALB
      Port: 80
      DefaultActions:
        - Type: forward
          TargetGroupArn: !If [BlueActive, !Ref BlueTargetGroup, !Ref GreenTargetGroup]
```

**Deployment Process**:
```bash
# 1. Deploy green environment
aws cloudformation update-stack \
  --stack-name app \
  --use-previous-template \
  --parameters ParameterKey=ActiveVersion,ParameterValue=blue
# Green ASG starts but receives no traffic

# 2. Test green environment directly
curl http://green-asg-instance:80/health

# 3. Switch traffic to green
aws cloudformation update-stack \
  --stack-name app \
  --use-previous-template \
  --parameters ParameterKey=ActiveVersion,ParameterValue=green

# 4. Monitor and rollback if needed
aws cloudformation update-stack \
  --stack-name app \
  --use-previous-template \
  --parameters ParameterKey=ActiveVersion,ParameterValue=blue
```

### 4. Disaster Recovery with IaC

**Multi-Region Setup**:
```hcl
# dr-setup.tf
variable "regions" {
  default = ["us-east-1", "us-west-2"]
}

# Primary region
module "primary" {
  source = "./modules/infrastructure"
  
  region      = var.regions[0]
  environment = "prod"
  is_primary  = true
}

# DR region
module "dr" {
  source = "./modules/infrastructure"
  
  region      = var.regions[1]
  environment = "prod-dr"
  is_primary  = false
}

# Route 53 failover
resource "aws_route53_record" "primary" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "api.example.com"
  type    = "A"
  
  set_identifier = "primary"
  
  failover_routing_policy {
    type = "PRIMARY"
  }
  
  alias {
    name                   = module.primary.alb_dns_name
    zone_id                = module.primary.alb_zone_id
    evaluate_target_health = true
  }
  
  health_check_id = aws_route53_health_check.primary.id
}

resource "aws_route53_record" "dr" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "api.example.com"
  type    = "A"
  
  set_identifier = "dr"
  
  failover_routing_policy {
    type = "SECONDARY"
  }
  
  alias {
    name                   = module.dr.alb_dns_name
    zone_id                = module.dr.alb_zone_id
    evaluate_target_health = true
  }
}
```

**DR Activation**:
```bash
# Normal operation: Both regions deployed but DR standby

# Primary region failure detected
# 1. Route 53 automatically fails over to DR (RTO: 60 seconds)

# 2. Scale up DR region
terraform apply -target=module.dr -var="dr_capacity=10"

# 3. Full recovery
# RTO: ~5 minutes (DNS + scaling)
# RPO: <1 minute (database replication lag)
```

### 5. Cost Optimization with IaC

**Dynamic Scaling Based on Environment**:
```hcl
locals {
  # Environment-specific configurations
  environment_config = {
    dev = {
      instance_type       = "t3.micro"
      min_size            = 1
      max_size            = 2
      enable_nat_gateway  = false  # Use single NAT for dev
      db_instance_class   = "db.t3.micro"
      multi_az            = false
    }
    staging = {
      instance_type       = "t3.small"
      min_size            = 1
      max_size            = 5
      enable_nat_gateway  = true
      db_instance_class   = "db.t3.small"
      multi_az            = false
    }
    prod = {
      instance_type       = "t3.medium"
      min_size            = 2
      max_size            = 10
      enable_nat_gateway  = true
      db_instance_class   = "db.r5.large"
      multi_az            = true
    }
  }
  
  config = local.environment_config[var.environment]
}

resource "aws_autoscaling_group" "main" {
  min_size         = local.config.min_size
  max_size         = local.config.max_size
  # ... other config
}
```

**Scheduled Shutdown for Non-Prod**:
```hcl
# Auto Scaling Schedule (dev environment only)
resource "aws_autoscaling_schedule" "scale_down_evening" {
  count = var.environment == "dev" ? 1 : 0
  
  scheduled_action_name  = "scale-down-evening"
  min_size               = 0
  max_size               = 0
  desired_capacity       = 0
  recurrence             = "0 19 * * MON-FRI"  # 7 PM weekdays
  autoscaling_group_name = aws_autoscaling_group.main.name
}

resource "aws_autoscaling_schedule" "scale_up_morning" {
  count = var.environment == "dev" ? 1 : 0
  
  scheduled_action_name  = "scale-up-morning"
  min_size               = 1
  max_size               = 2
  desired_capacity       = 1
  recurrence             = "0 9 * * MON-FRI"  # 9 AM weekdays
  autoscaling_group_name = aws_autoscaling_group.main.name
}

# Cost savings: ~12 hours/day × 5 days = 60 hours/week
# Annual savings: ~60% of dev environment costs
```

---

## Interview Questions

### Basic Questions

**Q1: What is Infrastructure as Code (IaC)?**

**Answer**:
Infrastructure as Code is the practice of managing and provisioning infrastructure through machine-readable definition files rather than manual configuration or interactive configuration tools.

**Benefits**:
- **Version Control**: Track all infrastructure changes in Git
- **Consistency**: Same configuration every time
- **Reproducibility**: Easily replicate environments
- **Automation**: Deploy via CI/CD pipelines
- **Documentation**: Code serves as documentation
- **Disaster Recovery**: Quickly rebuild infrastructure

**Example**:
```yaml
# Without IaC: 2 hours of manual clicking
# With IaC: 10 minutes automated deployment

Resources:
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
  # ... 50 more resources
```

---

**Q2: CloudFormation vs Terraform - when to use each?**

**Answer**:

**Use CloudFormation when**:
- AWS-only infrastructure
- Enterprise with AWS commitment
- Want AWS-managed state (no S3/DynamoDB setup)
- Need AWS support for IaC
- Deep AWS service integration (new services supported quickly)

**Use Terraform when**:
- Multi-cloud (AWS + GCP + Azure)
- Existing Terraform expertise
- Community modules needed
- More flexible templating (HCL vs YAML/JSON)
- Better state management features

**Comparison**:
```
CloudFormation:
✅ AWS-native, no state management needed
✅ Automatic rollback on failures
✅ Drift detection built-in
❌ AWS-only
❌ YAML/JSON verbose

Terraform:
✅ Multi-cloud support
✅ HCL more concise
✅ Large module ecosystem
❌ Manual state management (S3 + DynamoDB)
❌ No automatic rollback
```

---

**Q3: How does Terraform state work?**

**Answer**:
Terraform state is a JSON file that maps real-world resources to Terraform configuration and tracks metadata.

**State File Contents**:
```json
{
  "version": 4,
  "terraform_version": "1.5.0",
  "resources": [
    {
      "type": "aws_instance",
      "name": "web",
      "instances": [{
        "attributes": {
          "id": "i-1234567890abcdef0",
          "private_ip": "10.0.1.50"
        }
      }]
    }
  ]
}
```

**Local vs Remote State**:
```hcl
# Local State (default)
# Stored in terraform.tfstate file
# ❌ Problems: No locking, no collaboration

# Remote State (recommended)
terraform {
  backend "s3" {
    bucket         = "terraform-state"
    key            = "prod/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-locks"  # State locking
    encrypt        = true
  }
}
```

**State Locking**:
```
Team Member A: terraform apply (acquires lock)
Team Member B: terraform apply (waits for lock)

Without locking:
- Both could modify same resource
- Corrupted state file
- Resource conflicts
```

---

### Intermediate Questions

**Q4: Design a multi-environment infrastructure with IaC**

**Answer**:

**Requirements**:
- Dev, Staging, Prod environments
- Isolated networks
- Cost-optimized (dev cheaper than prod)
- Consistent configuration

**Solution Architecture**:
```
infrastructure/
  modules/
    vpc/         # Reusable VPC module
    compute/     # EC2, ASG, ALB
    database/    # RDS
  environments/
    dev/
      main.tf          # Uses modules with dev configs
      variables.tf
      terraform.tfvars # env=dev, instance=t3.micro
    staging/
      main.tf          # Uses same modules
      variables.tf
      terraform.tfvars # env=staging, instance=t3.small
    prod/
      main.tf          # Uses same modules
      variables.tf
      terraform.tfvars # env=prod, instance=t3.medium
```

**Module Example**:
```hcl
# modules/compute/main.tf
variable "environment" {}
variable "instance_type" {}
variable "min_size" {}

locals {
  # Environment-specific configs
  config = {
    dev = {
      enable_monitoring = false
      backup_retention  = 1
    }
    prod = {
      enable_monitoring = true
      backup_retention  = 30
    }
  }
}

resource "aws_autoscaling_group" "main" {
  min_size      = var.min_size
  max_size      = var.min_size * 5
  # ... other config
}
```

**Benefits**:
- **DRY**: One module, multiple environments
- **Consistency**: Same patterns everywhere
- **Cost Optimization**: Dev runs on t3.micro, Prod on t3.medium
- **Isolation**: Separate state files per environment

---

**Q5: How do you handle secrets in IaC?**

**Answer**:

**❌ Never Do This**:
```hcl
# BAD: Hardcoded secrets
variable "db_password" {
  default = "MyPassword123"  # ❌ In Git!
}
```

**✅ Best Practices**:

**1. Environment Variables**:
```bash
export TF_VAR_db_password="SecurePassword"
terraform apply
```

**2. AWS Secrets Manager**:
```hcl
# Store secret
resource "aws_secretsmanager_secret" "db_password" {
  name = "prod/db/password"
}

resource "aws_secretsmanager_secret_version" "db_password" {
  secret_id     = aws_secretsmanager_secret.db_password.id
  secret_string = var.db_password  # From env var
}

# Retrieve secret
data "aws_secretsmanager_secret_version" "db_password" {
  secret_id = "prod/db/password"
}

resource "aws_db_instance" "main" {
  password = data.aws_secretsmanager_secret_version.db_password.secret_string
}
```

**3. Sensitive Variable**:
```hcl
variable "db_password" {
  type      = string
  sensitive = true  # Not shown in logs
}

# Pass via CLI
terraform apply -var="db_password=$(aws secretsmanager get-secret-value --secret-id prod/db/password --query SecretString --output text)"
```

**4. .gitignore**:
```bash
# .gitignore
*.tfvars     # Contains secrets
*.tfstate    # Contains sensitive data
.terraform/
```

---

**Q6: Explain drift detection and how to handle it**

**Answer**:
Drift occurs when actual infrastructure differs from IaC configuration due to manual changes.

**Example Scenario**:
```
IaC Config: EC2 instance type = t3.micro
Actual AWS:  EC2 instance type = t3.medium (manually changed)

Drift Detected!
```

**CloudFormation Drift Detection**:
```bash
# Detect drift
aws cloudformation detect-stack-drift --stack-name my-app

# View results
aws cloudformation describe-stack-resource-drifts \
  --stack-name my-app \
  --stack-resource-drift-status-filters MODIFIED DELETED

# Output:
# Resource: EC2Instance
# Expected: t3.micro
# Actual: t3.medium
# Drift: MODIFIED
```

**Terraform Drift Detection**:
```bash
# Refresh state
terraform refresh

# Plan shows drift
terraform plan

# Output:
# Note: Objects have changed outside of Terraform
# 
#   # aws_instance.web will be updated in-place
#   ~ resource "aws_instance" "web" {
#       ~ instance_type = "t3.medium" -> "t3.micro"
#     }
```

**Handling Drift**:

**Option 1: Import Manual Changes**:
```hcl
# Update IaC to match reality
resource "aws_instance" "web" {
  instance_type = "t3.medium"  # Accept manual change
}
```

**Option 2: Revert to IaC**:
```bash
terraform apply  # Reverts to t3.micro
```

**Prevention**:
```hcl
# Use IAM policies to prevent manual changes
{
  "Effect": "Deny",
  "Action": ["ec2:ModifyInstanceAttribute"],
  "Resource": "*",
  "Condition": {
    "StringNotEquals": {
      "ec2:ResourceTag/ManagedBy": "Terraform"
    }
  }
}
```

---

### Advanced Questions

**Q7: Design a blue-green deployment strategy using IaC**

**Answer**:

**Architecture**:
```
ALB Listener
  ├─ Blue Target Group  (Current: 100% traffic)
  │    └─ Blue ASG (v1.0)
  └─ Green Target Group (New: 0% traffic)
       └─ Green ASG (v2.0)
```

**Terraform Implementation**:
```hcl
variable "active_version" {
  default = "blue"
}

# Blue Environment
resource "aws_autoscaling_group" "blue" {
  name             = "blue-asg"
  min_size         = 2
  max_size         = 10
  target_group_arns = var.active_version == "blue" ? [aws_lb_target_group.blue.arn] : []
  
  launch_template {
    id      = aws_launch_template.blue.id
    version = "$Latest"
  }
}

resource "aws_lb_target_group" "blue" {
  name     = "blue-tg"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id
}

# Green Environment
resource "aws_autoscaling_group" "green" {
  name             = "green-asg"
  min_size         = 2
  max_size         = 10
  target_group_arns = var.active_version == "green" ? [aws_lb_target_group.green.arn] : []
  
  launch_template {
    id      = aws_launch_template.green.id
    version = "$Latest"
  }
}

resource "aws_lb_target_group" "green" {
  name     = "green-tg"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id
}

# ALB Listener
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  
  default_action {
    type             = "forward"
    target_group_arn = var.active_version == "blue" ? 
                       aws_lb_target_group.blue.arn : 
                       aws_lb_target_group.green.arn
  }
}
```

**Deployment Process**:
```bash
# 1. Current state: Blue active (v1.0)
terraform apply -var="active_version=blue"

# 2. Update green environment to v2.0
# Update launch template with new AMI
terraform apply -var="active_version=blue"  # Green deploys but no traffic

# 3. Test green environment
curl http://<green-instance>:80/health

# 4. Switch traffic to green
terraform apply -var="active_version=green"

# Traffic instantly switches from blue to green
# Downtime: 0 seconds

# 5. Monitor for 10 minutes

# 6. Rollback if issues
terraform apply -var="active_version=blue"  # Instant rollback
```

**Benefits**:
- **Zero Downtime**: Instant traffic switch
- **Fast Rollback**: Change one variable
- **Testing**: Green environment tested before traffic switch
- **RTO**: <1 minute

---

**Q8: How would you implement disaster recovery using IaC across regions?**

**Answer**:

**Multi-Region Architecture**:
```
Primary Region (us-east-1)          DR Region (us-west-2)
├─ VPC (10.0.0.0/16)                ├─ VPC (10.1.0.0/16)
├─ ALB + ASG (active)               ├─ ALB + ASG (standby, min=0)
├─ RDS Primary                      ├─ RDS Read Replica
└─ S3 (versioned)                   └─ S3 (cross-region replication)

Route 53 Failover:
  Primary: us-east-1 ALB (health checked)
  Secondary: us-west-2 ALB (failover)
```

**Terraform Implementation**:
```hcl
# Multi-region provider
provider "aws" {
  alias  = "primary"
  region = "us-east-1"
}

provider "aws" {
  alias  = "dr"
  region = "us-west-2"
}

# Primary Region
module "primary" {
  source = "./modules/infrastructure"
  providers = {
    aws = aws.primary
  }
  
  region      = "us-east-1"
  environment = "prod"
  is_primary  = true
  
  asg_min_size = 2
  asg_max_size = 10
}

# DR Region (standby)
module "dr" {
  source = "./modules/infrastructure"
  providers = {
    aws = aws.dr
  }
  
  region      = "us-west-2"
  environment = "prod-dr"
  is_primary  = false
  
  asg_min_size = 0  # Standby: no instances
  asg_max_size = 10
}

# Database Replication
resource "aws_db_instance" "primary" {
  provider = aws.primary
  
  identifier     = "prod-db"
  engine         = "mysql"
  instance_class = "db.r5.large"
  # ... config
}

resource "aws_db_instance_replica" "dr" {
  provider = aws.dr
  
  identifier             = "prod-db-replica"
  replicate_source_db    = aws_db_instance.primary.arn
  instance_class         = "db.r5.large"
  publicly_accessible    = false
}

# S3 Replication
resource "aws_s3_bucket" "primary" {
  provider = aws.primary
  bucket   = "myapp-data-primary"
}

resource "aws_s3_bucket_versioning" "primary" {
  provider = aws.primary
  bucket   = aws_s3_bucket.primary.id
  
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_replication_configuration" "primary_to_dr" {
  provider = aws.primary
  bucket   = aws_s3_bucket.primary.id
  role     = aws_iam_role.replication.arn
  
  rule {
    id     = "replicate-all"
    status = "Enabled"
    
    destination {
      bucket        = aws_s3_bucket.dr.arn
      storage_class = "STANDARD_IA"
    }
  }
}

# Route 53 Failover
resource "aws_route53_record" "primary" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "api.example.com"
  type    = "A"
  
  set_identifier = "primary"
  
  failover_routing_policy {
    type = "PRIMARY"
  }
  
  alias {
    name                   = module.primary.alb_dns_name
    zone_id                = module.primary.alb_zone_id
    evaluate_target_health = true
  }
  
  health_check_id = aws_route53_health_check.primary.id
}

resource "aws_route53_record" "dr" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "api.example.com"
  type    = "A"
  
  set_identifier = "dr"
  
  failover_routing_policy {
    type = "SECONDARY"
  }
  
  alias {
    name                   = module.dr.alb_dns_name
    zone_id                = module.dr.alb_zone_id
    evaluate_target_health = true
  }
}

resource "aws_route53_health_check" "primary" {
  fqdn              = module.primary.alb_dns_name
  port              = 443
  type              = "HTTPS"
  resource_path     = "/health"
  failure_threshold = 3
  request_interval  = 30
  
  tags = {
    Name = "primary-health-check"
  }
}
```

**DR Activation**:
```bash
# Normal operation: Both regions deployed

# Primary region fails
# 1. Route 53 health check fails (3 consecutive failures × 30s = 90s)
# 2. DNS automatically fails over to DR region
# 3. Traffic now routes to us-west-2

# 4. Scale up DR region
terraform apply \
  -target=module.dr.aws_autoscaling_group.main \
  -var="dr_asg_min_size=2" \
  -var="dr_asg_max_size=10"

# 5. Promote read replica to primary
aws rds promote-read-replica \
  --db-instance-identifier prod-db-replica \
  --region us-west-2

# Total RTO: ~5 minutes
# - DNS failover: 90 seconds
# - ASG scale up: 2-3 minutes
# - RDS promotion: 1-2 minutes

# RPO: <1 minute (replication lag)
```

**Recovery Metrics**:
```
RTO (Recovery Time Objective):
- DNS Failover: 90 seconds
- ASG Scale-up: 2-3 minutes  
- RDS Promotion: 1-2 minutes
- Total: ~5 minutes

RPO (Recovery Point Objective):
- Database: <1 minute (replication lag)
- S3: ~15 minutes (async replication)
- Total: <1 minute for critical data
```

---

**Q9: Cost optimization strategies with IaC**

**Answer**:

**1. Environment-Based Sizing**:
```hcl
locals {
  config = {
    dev = {
      instance_type = "t3.micro"
      min_size      = 1
      max_size      = 2
      multi_az      = false
      backup_days   = 1
    }
    prod = {
      instance_type = "t3.medium"
      min_size      = 2
      max_size      = 10
      multi_az      = true
      backup_days   = 30
    }
  }
}

# Cost: Dev = $8/month, Prod = $32/month
```

**2. Scheduled Shutdown (Non-Prod)**:
```hcl
resource "aws_autoscaling_schedule" "scale_down" {
  count = var.environment != "prod" ? 1 : 0
  
  scheduled_action_name  = "scale-down-evening"
  min_size               = 0
  max_size               = 0
  desired_capacity       = 0
  recurrence             = "0 19 * * MON-FRI"  # 7 PM
  autoscaling_group_name = aws_autoscaling_group.main.name
}

resource "aws_autoscaling_schedule" "scale_up" {
  count = var.environment != "prod" ? 1 : 0
  
  scheduled_action_name  = "scale-up-morning"
  min_size               = 1
  desired_capacity       = 1
  recurrence             = "0 9 * * MON-FRI"  # 9 AM
  autoscaling_group_name = aws_autoscaling_group.main.name
}

# Savings: 60 hours/week = ~60% cost reduction for dev
```

**3. Spot Instances for Non-Critical**:
```hcl
resource "aws_autoscaling_group" "batch" {
  mixed_instances_policy {
    instances_distribution {
      on_demand_base_capacity                  = 0
      on_demand_percentage_above_base_capacity = 0  # 100% Spot
      spot_allocation_strategy                 = "capacity-optimized"
    }
    
    launch_template {
      launch_template_specification {
        launch_template_id = aws_launch_template.batch.id
      }
      
      override {
        instance_type = "t3.micro"
      }
      override {
        instance_type = "t3.small"
      }
    }
  }
}

# Savings: 70% compared to on-demand
```

**4. S3 Lifecycle Policies**:
```hcl
resource "aws_s3_bucket_lifecycle_configuration" "data" {
  bucket = aws_s3_bucket.data.id
  
  rule {
    id     = "archive-old-data"
    status = "Enabled"
    
    transition {
      days          = 30
      storage_class = "STANDARD_IA"  # $0.0125/GB vs $0.023/GB
    }
    
    transition {
      days          = 90
      storage_class = "GLACIER"  # $0.004/GB
    }
    
    transition {
      days          = 365
      storage_class = "DEEP_ARCHIVE"  # $0.00099/GB
    }
    
    expiration {
      days = 730  # Delete after 2 years
    }
  }
}

# Savings: 95% for cold data
```

**5. Right-Sizing with Auto Scaling**:
```hcl
resource "aws_autoscaling_policy" "scale_up" {
  name                   = "scale-up"
  scaling_adjustment     = 1
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 300
  autoscaling_group_name = aws_autoscaling_group.main.name
}

resource "aws_cloudwatch_metric_alarm" "high_cpu" {
  alarm_name          = "high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = 120
  statistic           = "Average"
  threshold           = 70
  
  alarm_actions = [aws_autoscaling_policy.scale_up.arn]
}

# Result: Pay only for what you use
```

**Total Savings Example**:
```
Before IaC Optimization:
- Prod: t3.large × 10 (always running) = $730/month
- Dev: t3.medium × 5 (always running) = $180/month
- Total: $910/month

After IaC Optimization:
- Prod: t3.medium × 2-10 (auto-scaled) = $150/month avg
- Dev: t3.micro × 1 (9 AM-7 PM only) = $30/month
- Spot for batch: 70% savings = $20/month
- S3 lifecycle: 80% savings = $10/month
- Total: $210/month

Annual Savings: $8,400 (77% reduction)
```

---

This completes the Infrastructure as Code guide covering CloudFormation, Terraform, SAM, CDK, state management, best practices, LocalStack examples, production patterns, and comprehensive interview questions.

