# AWS Service Catalog

## Table of Contents
1. [Service Catalog Fundamentals](#service-catalog-fundamentals)
2. [Product Portfolios](#product-portfolios)
3. [Products & Versions](#products--versions)
4. [Launch Constraints](#launch-constraints)
5. [TagOptions & Governance](#tagoptions--governance)
6. [Self-Service Provisioning](#self-service-provisioning)
7. [Multi-Account Distribution](#multi-account-distribution)
8. [Integration & Automation](#integration--automation)
9. [Best Practices](#best-practices)
10. [Interview Questions](#interview-questions)

---

## Service Catalog Fundamentals

### What is AWS Service Catalog?

**AWS Service Catalog** enables organizations to create and manage catalogs of approved AWS resources for self-service deployment.

**Core Capabilities**:
```
Product Management
├── CloudFormation templates (infrastructure as code)
├── Version control (v1, v2, v3)
├── Product metadata (name, description, owner)
└── Approval workflow (admin curates products)

Portfolio Management
├── Group products by function/department
├── Access control (who can launch what)
├── Constraints (launch/template/tag)
└── Sharing (multi-account distribution)

End-User Experience
├── Self-service catalog (user portal)
├── Launch products (no AWS knowledge needed)
├── Manage provisioned products (update/terminate)
└── Pre-approved configurations (no IAM needed)

Use Cases:
✅ Standardized deployments (golden AMIs, approved architectures)
✅ Governance & compliance (only approved configs)
✅ Self-service IT (developers provision without tickets)
✅ Cost control (pre-approved instance types, limits)
✅ Multi-account deployment (central catalog → 100s of accounts)
```

### Why Use Service Catalog?

**Before Service Catalog**:
```
❌ Developers wait days for IT tickets
❌ Each deployment slightly different (drift)
❌ Security violations (unapproved configs)
❌ No cost control (developers choose r6i.32xlarge)
❌ Manual approvals slow everything
❌ Difficult to maintain standards across accounts

Example:
Developer needs database:
1. Submit IT ticket → 2 days
2. IT creates RDS manually
3. Config doesn't match dev/staging (different versions)
4. No backup enabled (human error)
5. Public access allowed (security risk)
```

**After Service Catalog**:
```
✅ Self-service (launch in minutes)
✅ Standardized (always same config)
✅ Compliant (pre-approved by security)
✅ Cost-controlled (only approved instance types)
✅ Governed (automatic tagging, constraints)
✅ Multi-account consistency

Example:
Developer needs database:
1. Open Service Catalog console
2. Click "PostgreSQL Production Database"
3. Enter database name
4. Launch → 15 minutes
5. RDS created with:
   - Multi-AZ enabled
   - Automated backups (7 days)
   - Encryption at rest
   - Private subnet only
   - Required tags applied
   - Approved instance type (db.r6g.large)
```

### How Service Catalog Works

**Architecture**:
```
Administrator Workflow:
1. Create CloudFormation template (infrastructure)
2. Create Product (template + metadata)
3. Add Product to Portfolio
4. Grant Portfolio access to IAM users/roles
5. Apply constraints (launch/template/tag)

End-User Workflow:
1. Browse catalog (see available products)
2. Launch product (fill parameters)
3. Service Catalog provisions via CloudFormation
4. Manage lifecycle (update/terminate)

Flow:
┌─────────────────────────────────────────────────────┐
│ Administrator                                       │
│ ├── Create CloudFormation template                 │
│ ├── Create Product (template + versions)           │
│ ├── Create Portfolio                               │
│ ├── Add Product to Portfolio                       │
│ ├── Apply Constraints                              │
│ └── Grant Access (IAM users/groups/roles)          │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ End User                                            │
│ ├── Browse Catalog (see available products)        │
│ ├── Launch Product (select version, fill params)   │
│ ├── Service Catalog assumes role                   │
│ ├── CloudFormation creates resources               │
│ └── User manages product (update/terminate)        │
└─────────────────────────────────────────────────────┘
```

### Pricing

```
Service Catalog: FREE
No charges for the Service Catalog service itself

You pay for:
├── Underlying AWS resources (EC2, RDS, S3, etc)
└── CloudFormation stack operations (also free)

Example:
- 100 users
- 500 product launches/month
- Service Catalog cost: $0

Cost is only for launched resources:
- EC2 instance: $0.10/hour
- RDS database: $0.35/hour
- S3 storage: $0.023/GB
```

---

## Product Portfolios

### Create Portfolio

**Portfolio Definition**:
```
Portfolio = Collection of products grouped logically

Examples:
- "Development Tools" (Jenkins, GitLab, SonarQube)
- "Databases" (MySQL, PostgreSQL, MongoDB)
- "Web Hosting" (LAMP stack, WordPress, Node.js)
- "Data Science" (Jupyter, TensorFlow, SageMaker)
- "Networking" (VPC, Transit Gateway, VPN)
```

**Create Portfolio** (CLI):
```bash
aws servicecatalog create-portfolio \
  --display-name "Development Databases" \
  --description "Self-service database provisioning for development teams" \
  --provider-name "Cloud Platform Team" \
  --tags "Key=Department,Value=IT" "Key=Environment,Value=Development"

# Output:
{
  "PortfolioDetail": {
    "Id": "port-abc123def456",
    "ARN": "arn:aws:catalog:us-east-1:123456789012:portfolio/port-abc123def456",
    "DisplayName": "Development Databases",
    "Description": "Self-service database provisioning for development teams",
    "CreatedTime": "2026-01-31T10:00:00Z",
    "ProviderName": "Cloud Platform Team"
  }
}
```

**Portfolio Organization Strategy**:
```
By Environment:
├── Development Tools
├── Staging Infrastructure
└── Production Infrastructure

By Department:
├── Engineering Services
├── Data Analytics
└── Marketing Tools

By Function:
├── Compute Resources
├── Databases & Storage
├── Networking & Security
└── Machine Learning

Recommendation: Combine strategies
- "Development-Databases" (env + function)
- "Production-WebHosting" (env + function)
```

### Grant Portfolio Access

**IAM Principals**:
```bash
# Grant access to IAM group
aws servicecatalog associate-principal-with-portfolio \
  --portfolio-id port-abc123def456 \
  --principal-arn arn:aws:iam::123456789012:group/Developers \
  --principal-type IAM

# Grant access to IAM role
aws servicecatalog associate-principal-with-portfolio \
  --portfolio-id port-abc123def456 \
  --principal-arn arn:aws:iam::123456789012:role/DeveloperRole \
  --principal-type IAM

# Grant access to IAM user (not recommended - use groups)
aws servicecatalog associate-principal-with-portfolio \
  --portfolio-id port-abc123def456 \
  --principal-arn arn:aws:iam::123456789012:user/john.doe \
  --principal-type IAM
```

**Access Levels**:
```
End-User Access (servicecatalog:SearchProducts, LaunchProduct):
- Browse catalog
- Launch products
- Manage own provisioned products

Admin Access (servicecatalog:*):
- Create/update products
- Manage portfolios
- Apply constraints
- View all provisioned products
```

---

## Products & Versions

### Create Product

**CloudFormation Template** (PostgreSQL RDS):
```yaml
# rds-postgresql.yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'PostgreSQL RDS database for development'

Parameters:
  DatabaseName:
    Type: String
    Description: Database name
    AllowedPattern: '^[a-zA-Z][a-zA-Z0-9_]*$'
    ConstraintDescription: Must start with letter, alphanumeric and underscores only
  
  MasterUsername:
    Type: String
    Default: postgres
    Description: Master username
  
  MasterPassword:
    Type: String
    NoEcho: true
    Description: Master password (min 8 characters)
    MinLength: 8
  
  InstanceType:
    Type: String
    Default: db.t3.small
    AllowedValues:
      - db.t3.micro
      - db.t3.small
      - db.t3.medium
    Description: Instance type (cost-controlled)
  
  AllocatedStorage:
    Type: Number
    Default: 20
    MinValue: 20
    MaxValue: 100
    Description: Storage in GB (20-100)
  
  Environment:
    Type: String
    Default: development
    AllowedValues:
      - development
      - staging
      - production
    Description: Environment tag

Conditions:
  IsProduction: !Equals [!Ref Environment, production]

Resources:
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: !Sub '${DatabaseName} subnet group'
      SubnetIds:
        - subnet-abc123  # Private subnet 1
        - subnet-def456  # Private subnet 2
      Tags:
        - Key: Name
          Value: !Sub '${DatabaseName}-subnet-group'
  
  DBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: !Sub 'Security group for ${DatabaseName}'
      VpcId: vpc-abc123
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 5432
          ToPort: 5432
          SourceSecurityGroupId: sg-app-servers  # Only app servers
      Tags:
        - Key: Name
          Value: !Sub '${DatabaseName}-sg'
  
  DBInstance:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Snapshot
    Properties:
      DBInstanceIdentifier: !Ref DatabaseName
      DBName: !Ref DatabaseName
      Engine: postgres
      EngineVersion: '15.4'
      DBInstanceClass: !Ref InstanceType
      AllocatedStorage: !Ref AllocatedStorage
      StorageType: gp3
      StorageEncrypted: true
      MasterUsername: !Ref MasterUsername
      MasterUserPassword: !Ref MasterPassword
      DBSubnetGroupName: !Ref DBSubnetGroup
      VPCSecurityGroups:
        - !Ref DBSecurityGroup
      MultiAZ: !If [IsProduction, true, false]
      BackupRetentionPeriod: !If [IsProduction, 7, 1]
      PreferredBackupWindow: '03:00-04:00'
      PreferredMaintenanceWindow: 'sun:04:00-sun:05:00'
      EnableCloudwatchLogsExports:
        - postgresql
      DeletionProtection: !If [IsProduction, true, false]
      Tags:
        - Key: Name
          Value: !Ref DatabaseName
        - Key: Environment
          Value: !Ref Environment
        - Key: ManagedBy
          Value: ServiceCatalog

Outputs:
  Endpoint:
    Description: Database endpoint
    Value: !GetAtt DBInstance.Endpoint.Address
  
  Port:
    Description: Database port
    Value: !GetAtt DBInstance.Endpoint.Port
  
  DatabaseName:
    Description: Database name
    Value: !Ref DatabaseName
  
  ConnectionString:
    Description: Connection string
    Value: !Sub 'postgresql://${MasterUsername}@${DBInstance.Endpoint.Address}:${DBInstance.Endpoint.Port}/${DatabaseName}'
```

**Create Product**:
```bash
# Upload template to S3
aws s3 cp rds-postgresql.yaml s3://service-catalog-templates/rds-postgresql-v1.yaml

# Create product
aws servicecatalog create-product \
  --name "PostgreSQL Database" \
  --description "Managed PostgreSQL database for applications" \
  --owner "Cloud Platform Team" \
  --product-type CLOUD_FORMATION_TEMPLATE \
  --provisioning-artifact-parameters '{
    "Name": "v1.0",
    "Description": "Initial release - PostgreSQL 15.4",
    "Info": {
      "LoadTemplateFromURL": "https://service-catalog-templates.s3.amazonaws.com/rds-postgresql-v1.yaml"
    },
    "Type": "CLOUD_FORMATION_TEMPLATE"
  }' \
  --tags "Key=ProductType,Value=Database"

# Output:
{
  "ProductViewDetail": {
    "ProductViewSummary": {
      "Id": "prodview-abc123",
      "ProductId": "prod-xyz789",
      "Name": "PostgreSQL Database",
      "Owner": "Cloud Platform Team",
      "ShortDescription": "Managed PostgreSQL database for applications",
      "Type": "CLOUD_FORMATION_TEMPLATE"
    }
  },
  "ProvisioningArtifactDetail": {
    "Id": "pa-abc123",
    "Name": "v1.0",
    "Type": "CLOUD_FORMATION_TEMPLATE",
    "CreatedTime": "2026-01-31T10:00:00Z"
  }
}
```

### Product Versions

**Add New Version**:
```bash
# Upload v2 template (new features: read replicas, performance insights)
aws s3 cp rds-postgresql-v2.yaml s3://service-catalog-templates/rds-postgresql-v2.yaml

# Create provisioning artifact (version)
aws servicecatalog create-provisioning-artifact \
  --product-id prod-xyz789 \
  --parameters '{
    "Name": "v2.0",
    "Description": "Added: Read replicas, Performance Insights, PostgreSQL 16.1",
    "Info": {
      "LoadTemplateFromURL": "https://service-catalog-templates.s3.amazonaws.com/rds-postgresql-v2.yaml"
    },
    "Type": "CLOUD_FORMATION_TEMPLATE"
  }'

# Now users can choose version when launching:
# - v1.0 (PostgreSQL 15.4)
# - v2.0 (PostgreSQL 16.1 + read replicas)
```

**Set Active Version**:
```bash
# Mark v2.0 as active (default for new launches)
aws servicecatalog update-provisioning-artifact \
  --product-id prod-xyz789 \
  --provisioning-artifact-id pa-def456 \
  --active

# Deprecate old version (hide from users)
aws servicecatalog update-provisioning-artifact \
  --product-id prod-xyz789 \
  --provisioning-artifact-id pa-abc123 \
  --active false

# Users with v1.0 already provisioned can still update
# New users only see v2.0
```

### Add Product to Portfolio

```bash
aws servicecatalog associate-product-with-portfolio \
  --product-id prod-xyz789 \
  --portfolio-id port-abc123def456

# Product now visible to all users with portfolio access
```

---

## Launch Constraints

### What are Launch Constraints?

**Problem without Launch Constraints**:
```
❌ Users need broad IAM permissions to launch products
❌ User needs: ec2:*, rds:*, iam:CreateRole
❌ Security risk: Users can create resources outside catalog
❌ Violates least privilege principle

Example:
User launches RDS product → Needs rds:CreateDBInstance permission
But user can now create ANY RDS database (not just catalog products)
```

**Solution: Launch Constraints**:
```
✅ Service Catalog assumes IAM role on behalf of user
✅ User only needs servicecatalog:LaunchProduct permission
✅ Launch role has permissions to create resources
✅ User cannot create resources outside catalog

Flow:
User (limited permissions)
  ↓ servicecatalog:LaunchProduct
Service Catalog
  ↓ sts:AssumeRole
Launch Role (rds:*, ec2:*)
  ↓ CreateDBInstance
RDS Database created
```

### Create Launch Role

```bash
# Create IAM role for Service Catalog
aws iam create-role \
  --role-name ServiceCatalogLaunchRole \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {
        "Service": "servicecatalog.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }]
  }'

# Attach permissions policy
aws iam put-role-policy \
  --role-name ServiceCatalogLaunchRole \
  --policy-name LaunchPermissions \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Action": [
          "rds:*",
          "ec2:CreateSecurityGroup",
          "ec2:DeleteSecurityGroup",
          "ec2:AuthorizeSecurityGroupIngress",
          "ec2:RevokeSecurityGroupIngress",
          "ec2:DescribeSecurityGroups",
          "ec2:DescribeSubnets",
          "ec2:DescribeVpcs"
        ],
        "Resource": "*"
      },
      {
        "Effect": "Allow",
        "Action": [
          "cloudformation:CreateStack",
          "cloudformation:DeleteStack",
          "cloudformation:UpdateStack",
          "cloudformation:DescribeStacks",
          "cloudformation:DescribeStackEvents"
        ],
        "Resource": "*"
      }
    ]
  }'
```

### Apply Launch Constraint

```bash
aws servicecatalog create-constraint \
  --portfolio-id port-abc123def456 \
  --product-id prod-xyz789 \
  --parameters '{
    "RoleArn": "arn:aws:iam::123456789012:role/ServiceCatalogLaunchRole"
  }' \
  --type LAUNCH \
  --description "Launch role for RDS database provisioning"

# Now users can launch product without rds:* permissions
# Service Catalog assumes ServiceCatalogLaunchRole
```

### Template Constraints

**Restrict Parameter Values**:
```bash
# Limit instance types to cost-effective options
aws servicecatalog create-constraint \
  --portfolio-id port-abc123def456 \
  --product-id prod-xyz789 \
  --parameters '{
    "Rules": {
      "InstanceTypeRule": {
        "Assertions": [{
          "Assert": {
            "Fn::Contains": [
              ["db.t3.micro", "db.t3.small"],
              {"Ref": "InstanceType"}
            ]
          },
          "AssertDescription": "Only t3.micro and t3.small allowed for development"
        }]
      }
    }
  }' \
  --type TEMPLATE \
  --description "Restrict to small instance types"

# Users cannot launch db.t3.medium or larger (even though template allows it)
```

**Enforce Tagging**:
```bash
# Require specific tags
aws servicecatalog create-constraint \
  --portfolio-id port-abc123def456 \
  --product-id prod-xyz789 \
  --parameters '{
    "TagUpdateOnProvisionedProduct": "ALLOWED",
    "TagUpdates": {
      "CostCenter": {"Default": "REQUIRED"},
      "Owner": {"Default": "REQUIRED"}
    }
  }' \
  --type TEMPLATE

# Users must provide CostCenter and Owner tags when launching
```

---

## TagOptions & Governance

### TagOptions

**Create TagOption Library**:
```bash
# Create tag option for Environment
aws servicecatalog create-tag-option \
  --key Environment \
  --value development

aws servicecatalog create-tag-option \
  --key Environment \
  --value staging

aws servicecatalog create-tag-option \
  --key Environment \
  --value production

# Create tag option for CostCenter
aws servicecatalog create-tag-option \
  --key CostCenter \
  --value Engineering

aws servicecatalog create-tag-option \
  --key CostCenter \
  --value Marketing

aws servicecatalog create-tag-option \
  --key CostCenter \
  --value DataScience
```

**Associate TagOption with Portfolio**:
```bash
aws servicecatalog associate-tag-option-with-resource \
  --resource-id port-abc123def456 \
  --tag-option-id tag-abc123

# Now all products in portfolio inherit tag options
# Users select from dropdown (not free-form text)
```

**Cascading Tags**:
```bash
# Tags cascade to all resources created
# User launches RDS product with:
# - Environment: production
# - CostCenter: Engineering

# Result:
# - RDS instance tagged
# - Security group tagged
# - Subnet group tagged
# - All resources inherit tags automatically
```

### Governance Policies

**Budget Notifications**:
```python
# Lambda function: Check budget before launch
import boto3

def lambda_handler(event, context):
    """
    Pre-launch validation: Check if department within budget
    """
    budgets = boto3.client('budgets')
    
    # Get cost center from parameters
    cost_center = event['parameters']['CostCenter']
    
    # Check budget
    response = budgets.describe-budget(
        AccountId='123456789012',
        BudgetName=f'{cost_center}-Monthly'
    )
    
    budget_limit = response['Budget']['BudgetLimit']['Amount']
    actual_spend = response['Budget']['CalculatedSpend']['ActualSpend']['Amount']
    
    # Block launch if >90% of budget
    if float(actual_spend) / float(budget_limit) > 0.9:
        raise Exception(f'{cost_center} at {actual_spend}/{budget_limit} budget. Launch blocked.')
    
    return {'statusCode': 200, 'body': 'Budget check passed'}
```

**Approval Workflow**:
```yaml
# SNS notification on product launch
Resources:
  LaunchNotification:
    Type: AWS::SNS::Topic
    Properties:
      DisplayName: ServiceCatalogLaunches
      Subscription:
        - Endpoint: platform-team@company.com
          Protocol: email

  LaunchEventRule:
    Type: AWS::Events::Rule
    Properties:
      Description: Notify on Service Catalog launches
      EventPattern:
        source:
          - aws.servicecatalog
        detail-type:
          - AWS API Call via CloudTrail
        detail:
          eventName:
            - ProvisionProduct
      Targets:
        - Arn: !Ref LaunchNotification
          Id: SNSTarget
          InputTransformer:
            InputPathsMap:
              user: $.detail.userIdentity.principalId
              product: $.detail.requestParameters.productName
              time: $.detail.eventTime
            InputTemplate: |
              "User <user> launched product <product> at <time>"
```

---

## Self-Service Provisioning

### End-User Workflow

**Browse Catalog**:
```bash
# List available products
aws servicecatalog search-products

# Output:
{
  "ProductViewSummaries": [
    {
      "Id": "prodview-abc123",
      "Name": "PostgreSQL Database",
      "ShortDescription": "Managed PostgreSQL database",
      "Owner": "Cloud Platform Team",
      "Type": "CLOUD_FORMATION_TEMPLATE"
    },
    {
      "Id": "prodview-def456",
      "Name": "Redis Cache",
      "ShortDescription": "ElastiCache Redis cluster",
      "Owner": "Cloud Platform Team"
    }
  ]
}
```

**Describe Product**:
```bash
# Get product details
aws servicecatalog describe-product \
  --id prodview-abc123

# Output includes:
# - Parameters (DatabaseName, InstanceType, etc)
# - Constraints (allowed values)
# - Available versions (v1.0, v2.0)
# - TagOptions (Environment, CostCenter)
```

**Launch Product**:
```bash
aws servicecatalog provision-product \
  --product-id prod-xyz789 \
  --provisioning-artifact-id pa-def456 \
  --provisioned-product-name "myapp-database" \
  --provisioning-parameters \
    "Key=DatabaseName,Value=myappdb" \
    "Key=MasterUsername,Value=postgres" \
    "Key=MasterPassword,Value=SecurePass123!" \
    "Key=InstanceType,Value=db.t3.small" \
    "Key=AllocatedStorage,Value=50" \
    "Key=Environment,Value=development" \
  --tags \
    "Key=CostCenter,Value=Engineering" \
    "Key=Owner,Value=john.doe@company.com"

# Output:
{
  "RecordDetail": {
    "RecordId": "rec-abc123",
    "ProvisionedProductName": "myapp-database",
    "Status": "IN_PROGRESS",
    "CreatedTime": "2026-01-31T10:00:00Z",
    "ProvisionedProductId": "pp-xyz789"
  }
}

# Check status
aws servicecatalog describe-record --id rec-abc123

# When complete:
{
  "RecordDetail": {
    "Status": "SUCCEEDED",
    "RecordOutputs": [
      {
        "OutputKey": "Endpoint",
        "OutputValue": "myappdb.abc123.us-east-1.rds.amazonaws.com"
      },
      {
        "OutputKey": "Port",
        "OutputValue": "5432"
      },
      {
        "OutputKey": "ConnectionString",
        "OutputValue": "postgresql://postgres@myappdb.abc123.us-east-1.rds.amazonaws.com:5432/myappdb"
      }
    ]
  }
}
```

**Console Experience**:
```
1. Navigate to Service Catalog console
2. Click "Products"
3. Search "PostgreSQL"
4. Click "PostgreSQL Database"
5. Click "Launch Product"
6. Fill form:
   Database Name: myappdb
   Instance Type: db.t3.small (dropdown)
   Storage: 50 GB (slider)
   Environment: development (dropdown - from TagOptions)
   Cost Center: Engineering (dropdown - from TagOptions)
7. Click "Launch"
8. See provisioning progress (CloudFormation events)
9. Get outputs (endpoint, connection string)
```

### Manage Provisioned Products

**List Provisioned Products**:
```bash
aws servicecatalog search-provisioned-products

# Output: All products user has launched
{
  "ProvisionedProducts": [
    {
      "Name": "myapp-database",
      "Id": "pp-xyz789",
      "Type": "CFN_STACK",
      "Status": "AVAILABLE",
      "CreatedTime": "2026-01-31T10:00:00Z",
      "LastRecordId": "rec-abc123"
    }
  ]
}
```

**Update Product** (change instance type):
```bash
aws servicecatalog update-provisioned-product \
  --provisioned-product-id pp-xyz789 \
  --provisioning-parameters \
    "Key=InstanceType,Value=db.t3.medium,UsePreviousValue=false" \
    "Key=AllocatedStorage,UsePreviousValue=true" \
    "Key=DatabaseName,UsePreviousValue=true"

# CloudFormation change set created and executed
# RDS instance modified (may require downtime)
```

**Terminate Product**:
```bash
aws servicecatalog terminate-provisioned-product \
  --provisioned-product-id pp-xyz789

# CloudFormation stack deleted
# RDS instance: Final snapshot created (DeletionPolicy: Snapshot)
```

---

## Multi-Account Distribution

### Share Portfolio Across Accounts

**Organization Sharing**:
```bash
# From hub account, share portfolio to all accounts in OU
aws servicecatalog create-portfolio-share \
  --portfolio-id port-abc123def456 \
  --organization-node '{
    "Type": "ORGANIZATIONAL_UNIT",
    "Value": "ou-abc123"
  }' \
  --share-principals

# All accounts in OU can now access portfolio
# New accounts added to OU automatically get access
```

**Import Shared Portfolio** (spoke account):
```bash
# List portfolios shared with this account
aws servicecatalog list-portfolios

# Import portfolio
aws servicecatalog associate-principal-with-portfolio \
  --portfolio-id port-abc123def456 \
  --principal-arn arn:aws:iam::999999999999:role/DeveloperRole \
  --principal-type IAM

# Developers in spoke account can now launch products
```

### Hub-Spoke Model

**Architecture**:
```
Hub Account (123456789012) - Central IT
├── Service Catalog Administrator
├── Create Products (golden templates)
├── Create Portfolios
├── Share Portfolios → All spoke accounts
└── Maintain catalog (updates, new versions)

Spoke Accounts (100+ accounts)
├── Import shared portfolios
├── Grant access to local IAM users/groups
├── Users launch products
├── Resources created in spoke account (not hub)
└── Local admin can customize (add constraints)

Benefits:
✅ Central governance (hub controls approved products)
✅ Distributed provisioning (resources in spoke accounts)
✅ Consistent standards (same templates across org)
✅ Local customization (spoke can add constraints)
```

**Example Flow**:
```
Hub Account:
1. Platform team creates "PostgreSQL Database" product
2. Adds to "Databases" portfolio
3. Shares portfolio to "Development" OU (50 accounts)

Spoke Account (Dev-Account-1):
4. DevOps admin imports "Databases" portfolio
5. Grants access to "Developers" IAM group
6. Applies local constraint (max storage 100GB)

End User (Developer in Dev-Account-1):
7. Browses catalog, sees "PostgreSQL Database"
8. Launches with DatabaseName=app1db
9. RDS created in Dev-Account-1 (not hub)
10. Tagged automatically (CostCenter, Environment)
11. Meets hub standards (encryption, backups, etc)
```

### Cross-Account Launch Roles

**Challenge**:
```
Spoke account needs launch role to create resources
Hub account cannot create role in spoke account
```

**Solution: StackSets**:
```bash
# Hub account: Deploy launch role to all spoke accounts via StackSet

# stackset-launch-role.yaml
AWSTemplateFormatVersion: '2010-09-09'
Resources:
  ServiceCatalogLaunchRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: ServiceCatalogLaunchRole
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: servicecatalog.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/AdministratorAccess  # Adjust as needed

# Deploy to all accounts in OU
aws cloudformation create-stack-set \
  --stack-set-name ServiceCatalogLaunchRoles \
  --template-body file://stackset-launch-role.yaml \
  --capabilities CAPABILITY_NAMED_IAM \
  --permission-model SERVICE_MANAGED \
  --auto-deployment Enabled=true,RetainStacksOnAccountRemoval=false

aws cloudformation create-stack-instances \
  --stack-set-name ServiceCatalogLaunchRoles \
  --deployment-targets OrganizationalUnitIds=ou-abc123 \
  --regions us-east-1

# Launch role now exists in all 50 spoke accounts
```

---

## Integration & Automation

### EventBridge Integration

**Track Product Launches**:
```json
{
  "source": ["aws.servicecatalog"],
  "detail-type": ["AWS API Call via CloudTrail"],
  "detail": {
    "eventName": ["ProvisionProduct", "UpdateProvisionedProduct", "TerminateProvisionedProduct"]
  }
}
```

**Automation Example**:
```python
# Lambda: Send Slack notification on product launch
import json
import urllib3

def lambda_handler(event, context):
    http = urllib3.PoolManager()
    
    event_name = event['detail']['eventName']
    user = event['detail']['userIdentity']['principalId']
    product = event['detail']['requestParameters'].get('productName', 'Unknown')
    
    if event_name == 'ProvisionProduct':
        message = f"🚀 {user} launched {product}"
        color = "good"
    elif event_name == 'TerminateProvisionedProduct':
        message = f"🗑️ {user} terminated {product}"
        color = "warning"
    
    slack_message = {
        'attachments': [{
            'color': color,
            'text': message
        }]
    }
    
    http.request(
        'POST',
        'https://hooks.slack.com/services/YOUR/WEBHOOK/URL',
        body=json.dumps(slack_message),
        headers={'Content-Type': 'application/json'}
    )
    
    return {'statusCode': 200}
```

### Cost Tracking

**Tag-Based Cost Allocation**:
```bash
# Enable cost allocation tags
aws ce activate-cost-allocation-tags \
  --tag-keys CostCenter Environment Owner

# Cost Explorer query: Service Catalog resource costs by cost center
aws ce get-cost-and-usage \
  --time-period Start=2026-01-01,End=2026-01-31 \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --group-by Type=TAG,Key=CostCenter

# Output:
{
  "ResultsByTime": [{
    "Groups": [
      {"Keys": ["CostCenter$Engineering"], "Metrics": {"BlendedCost": {"Amount": "15234.56"}}},
      {"Keys": ["CostCenter$Marketing"], "Metrics": {"BlendedCost": {"Amount": "8723.12"}}},
      {"Keys": ["CostCenter$DataScience"], "Metrics": {"BlendedCost": {"Amount": "23456.78"}}}
    ]
  }]
}

# Engineering: $15,234.56
# Marketing: $8,723.12
# DataScience: $23,456.78
```

**Chargeback Reports**:
```python
# Generate monthly chargeback report
import boto3
from datetime import datetime, timedelta

ce = boto3.client('ce')

# Last month
end = datetime.now().replace(day=1)
start = (end - timedelta(days=1)).replace(day=1)

response = ce.get_cost_and_usage(
    TimePeriod={
        'Start': start.strftime('%Y-%m-%d'),
        'End': end.strftime('%Y-%m-%d')
    },
    Granularity='MONTHLY',
    Metrics=['BlendedCost'],
    GroupBy=[
        {'Type': 'TAG', 'Key': 'CostCenter'},
        {'Type': 'TAG', 'Key': 'Owner'}
    ],
    Filter={
        'Tags': {
            'Key': 'ManagedBy',
            'Values': ['ServiceCatalog']
        }
    }
)

# Generate report
print(f"Service Catalog Costs - {start.strftime('%B %Y')}\n")
print(f"{'Cost Center':<20} {'Owner':<30} {'Cost':>15}")
print("-" * 70)

for result in response['ResultsByTime']:
    for group in result['Groups']:
        cost_center = group['Keys'][0].split('$')[1]
        owner = group['Keys'][1].split('$')[1]
        cost = float(group['Metrics']['BlendedCost']['Amount'])
        print(f"{cost_center:<20} {owner:<30} ${cost:>14,.2f}")

# Email report to finance
ses.send_email(
    Source='platform@company.com',
    Destination={'ToAddresses': ['finance@company.com']},
    Message={
        'Subject': {'Data': f'Service Catalog Costs - {start.strftime("%B %Y")}'},
        'Body': {'Text': {'Data': report}}
    }
)
```

---

## Best Practices

### Product Design

```
✅ Do:
- Use parameter constraints (AllowedValues, AllowedPattern)
- Provide sensible defaults
- Include comprehensive outputs
- Add detailed descriptions
- Version your templates (v1.0, v1.1, v2.0)
- Test in non-prod before releasing
- Use DeletionPolicy: Snapshot for databases

❌ Don't:
- Hardcode values (use parameters)
- Create resources in multiple regions (complexity)
- Allow unbounded parameter values (cost risk)
- Skip documentation
- Deploy breaking changes without new version
```

**Example - Good vs Bad**:
```yaml
# ❌ Bad: Hardcoded, no constraints
Parameters:
  InstanceType:
    Type: String
    Description: Instance type

# ✅ Good: Dropdown with allowed values, default
Parameters:
  InstanceType:
    Type: String
    Description: 'RDS instance type (cost-controlled)'
    Default: db.t3.small
    AllowedValues:
      - db.t3.micro   # $0.017/hour
      - db.t3.small   # $0.034/hour
      - db.t3.medium  # $0.068/hour
    ConstraintDescription: 'Choose cost-effective instance type'
```

### Portfolio Organization

```
✅ Organize by function + environment:
- "Dev-Databases" (development databases)
- "Prod-WebHosting" (production web hosting)
- "Shared-Networking" (VPCs, VPNs for all envs)

✅ Separate admin and user portfolios:
- "Platform-Admin-Tools" (restricted to platform team)
- "Developer-Tools" (accessible to all developers)

✅ Use descriptive names:
- "PostgreSQL Database" (clear)
- Not "RDS Product 1" (unclear)

❌ Don't create too many portfolios:
- 5-10 portfolios (good)
- 100+ portfolios (overwhelming)
```

### Access Control

```
✅ Do:
- Grant access to IAM groups (not individual users)
- Use launch constraints (least privilege)
- Separate admin and user permissions
- Audit access regularly
- Use SCPs to enforce Service Catalog usage

❌ Don't:
- Grant direct EC2/RDS permissions (bypass catalog)
- Use same role for all products (least privilege violation)
- Share portfolios without review
```

### Governance

```
✅ Do:
- Enforce tagging via TagOptions
- Implement budget controls
- Monitor product launches (EventBridge)
- Generate cost reports (chargeback)
- Deprecate old versions (prevent confusion)
- Test products before sharing
- Document products thoroughly

❌ Don't:
- Allow untagged resources
- Skip cost tracking
- Leave deprecated versions active
- Deploy untested products to production
```

---

## Interview Questions

### Q1: Explain how Service Catalog enables self-service provisioning while maintaining governance. How does it differ from giving users direct IAM permissions?

**Answer**:

**Direct IAM Permissions Approach**:
```
❌ Problem: Give developers ec2:*, rds:*, s3:* permissions

Risks:
- Developer launches r6i.32xlarge ($10/hour) for dev environment
- Developer creates RDS in public subnet (security violation)
- Developer forgets to enable encryption (compliance violation)
- No cost tracking (who launched what?)
- Inconsistent configurations (each dev does it differently)
- Difficult to audit (manual reviews)

Example:
Developer needs PostgreSQL database:
1. Has rds:* permission
2. Launches db.r6g.16xlarge (overkill for dev, $5/hour)
3. Puts in public subnet (security risk)
4. No backups enabled (data loss risk)
5. Untagged (no cost allocation)

Result: $3,600/month for dev database, security violations
```

**Service Catalog Approach**:
```
✅ Solution: Curated catalog of pre-approved products

Benefits:
- Users launch approved configurations only
- Launch constraints (Service Catalog assumes role, not user)
- Standardized (always same config)
- Governed (automatic tagging, cost limits)
- Auditable (CloudTrail tracks launches)

Example:
Developer needs PostgreSQL database:
1. Has servicecatalog:LaunchProduct permission (not rds:*)
2. Browses catalog, sees "PostgreSQL Dev Database"
3. Launches product with simple form:
   - Database name: myapp
   - Storage: 20-100 GB (slider)
4. Service Catalog provisions:
   - db.t3.small (cost-controlled)
   - Private subnet (security)
   - Encryption enabled (compliance)
   - Automated backups (7 days)
   - Required tags applied (CostCenter, Owner)

Result: $25/month, compliant, standardized
```

**How it Works**:
```
User Permissions (Least Privilege):
{
  "Effect": "Allow",
  "Action": [
    "servicecatalog:SearchProducts",
    "servicecatalog:DescribeProduct",
    "servicecatalog:ProvisionProduct",
    "servicecatalog:DescribeProvisionedProduct",
    "servicecatalog:TerminateProvisionedProduct"
  ],
  "Resource": "*"
}

User CANNOT:
- Launch RDS directly (no rds:CreateDBInstance)
- Launch EC2 directly (no ec2:RunInstances)
- Create resources outside catalog

Launch Role (Service Catalog assumes):
{
  "Effect": "Allow",
  "Action": [
    "rds:*",
    "ec2:*",
    "cloudformation:*"
  ],
  "Resource": "*"
}

Flow:
1. User launches product (servicecatalog:ProvisionProduct)
2. Service Catalog assumes launch role
3. Launch role creates RDS (rds:CreateDBInstance)
4. User gets RDS database without rds:* permission
```

**Governance Features**:
```
Template Constraints:
- Allowed instance types: db.t3.micro, db.t3.small only
- Storage limits: 20-100 GB
- Regions: us-east-1 only (data residency)

TagOptions:
- CostCenter: Required (dropdown: Engineering, Marketing, DataScience)
- Environment: Required (dropdown: dev, staging, prod)
- Owner: Required (user email)

Launch Constraints:
- Role ARN: arn:aws:iam::123:role/ServiceCatalogLaunchRole
- Service Catalog assumes role (user doesn't need permissions)

Notifications:
- EventBridge → Slack (notify on launches)
- EventBridge → Lambda → Budget check (block if over budget)
```

**Comparison Summary**:
```
Feature                Direct IAM                Service Catalog
------------------------------------------------------------------------
User permissions       ec2:*, rds:*, s3:*        servicecatalog:LaunchProduct
Can create resources?  Yes (anywhere)            Only via catalog
Standardization        No (each user different)  Yes (same template)
Cost control           Manual (review bills)     Automatic (constraints)
Tagging                Manual (often forgotten)  Automatic (enforced)
Compliance             Manual audits             Automated (pre-approved)
Governance             Difficult (broad perms)   Built-in (constraints)
Audit trail            CloudTrail only           CloudTrail + SC events
Multi-account          Complex (IAM per account) Simple (share portfolio)

Use Service Catalog when:
✅ Need governance (standardization, compliance)
✅ Multiple teams/users provisioning resources
✅ Cost control required
✅ Self-service desired (reduce IT tickets)
✅ Multi-account organization

Use direct IAM when:
✅ Platform team with broad permissions needed
✅ Advanced users (know what they're doing)
✅ Flexible configurations required (not standardized)
```

### Q2: How would you design a multi-account Service Catalog deployment for an organization with 200 accounts across development, staging, and production environments?

**Answer**:

**Architecture - Hub and Spoke Model**:
```
Management Account (123456789012)
└── Enable Organizations

Hub Account (555555555555) - Service Catalog Hub
├── Platform Team (administrators)
├── Product Library (all products)
├── Portfolio Management
└── Share portfolios → Spoke accounts

Spoke Accounts (200 accounts)
├── Development (100 accounts in Dev OU)
├── Staging (50 accounts in Staging OU)
└── Production (50 accounts in Prod OU)

Each spoke account:
├── Import shared portfolios
├── Apply local constraints (optional)
├── Grant access to local users
└── Users provision resources
```

**Implementation Steps**:

**Step 1: Create Product Library** (Hub Account):
```bash
# Portfolio structure
Portfolios:
├── "Compute-Development"
│   ├── EC2 Linux Dev (t3.micro, t3.small)
│   ├── EC2 Windows Dev
│   └── Lambda Function
├── "Compute-Production"
│   ├── EC2 Linux Prod (m5.large, m5.xlarge, auto-scaling)
│   ├── EC2 Windows Prod
│   └── ECS Cluster
├── "Databases-Development"
│   ├── PostgreSQL Dev (db.t3.small, single-AZ)
│   ├── MySQL Dev
│   └── Redis Dev
├── "Databases-Production"
│   ├── PostgreSQL Prod (db.r6g.large+, multi-AZ, replicas)
│   ├── MySQL Prod
│   └── Redis Prod (cluster mode)
├── "Networking-Shared"
│   ├── VPC (standard 3-tier)
│   ├── Transit Gateway Attachment
│   └── VPN Connection
└── "Security-Shared"
    ├── GuardDuty Detector
    ├── Security Hub
    └── Config Recorder

# Create portfolios
aws servicecatalog create-portfolio \
  --display-name "Compute-Development" \
  --description "Development compute resources (cost-optimized)" \
  --provider-name "Cloud Platform Team"

aws servicecatalog create-portfolio \
  --display-name "Databases-Production" \
  --description "Production databases (HA, encrypted, backed up)" \
  --provider-name "Cloud Platform Team"

# ... create all portfolios
```

**Step 2: Create Products with Environment-Specific Constraints**:
```yaml
# ec2-linux.yaml (single template, environment-aware)
Parameters:
  Environment:
    Type: String
    AllowedValues: [development, staging, production]
  
  InstanceType:
    Type: String
    AllowedValues: [t3.micro, t3.small, t3.medium, m5.large, m5.xlarge]
  
  VolumeSize:
    Type: Number
    MinValue: 8
    MaxValue: 1000

Conditions:
  IsDevelopment: !Equals [!Ref Environment, development]
  IsProduction: !Equals [!Ref Environment, production]

Resources:
  Instance:
    Type: AWS::EC2::Instance
    Properties:
      InstanceType: !Ref InstanceType
      ImageId: !FindInMap [AMIMap, !Ref Environment, AMI]
      BlockDeviceMappings:
        - DeviceName: /dev/xvda
          Ebs:
            VolumeSize: !Ref VolumeSize
            VolumeType: !If [IsProduction, gp3, gp2]
            Encrypted: true
      Monitoring: !If [IsProduction, true, false]
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Backup
          Value: !If [IsProduction, daily, weekly]

# Apply constraints per portfolio
# Development portfolio: t3.micro, t3.small only
# Production portfolio: m5.large, m5.xlarge only
```

**Step 3: Share Portfolios to OUs**:
```bash
# Share Development portfolios to Dev OU (100 accounts)
aws servicecatalog create-portfolio-share \
  --portfolio-id port-compute-dev \
  --organization-node '{
    "Type": "ORGANIZATIONAL_UNIT",
    "Value": "ou-dev-abc123"
  }' \
  --share-principals

aws servicecatalog create-portfolio-share \
  --portfolio-id port-databases-dev \
  --organization-node '{
    "Type": "ORGANIZATIONAL_UNIT",
    "Value": "ou-dev-abc123"
  }' \
  --share-principals

# Share Production portfolios to Prod OU (50 accounts)
aws servicecatalog create-portfolio-share \
  --portfolio-id port-compute-prod \
  --organization-node '{
    "Type": "ORGANIZATIONAL_UNIT",
    "Value": "ou-prod-xyz789"
  }' \
  --share-principals

# Share Networking to all accounts (200)
aws servicecatalog create-portfolio-share \
  --portfolio-id port-networking-shared \
  --organization-node '{
    "Type": "ORGANIZATION",
    "Value": "o-abc123def456"
  }' \
  --share-principals

# Automatic: New accounts added to OU get portfolio access
```

**Step 4: Deploy Launch Roles via StackSets**:
```bash
# stackset-launch-roles.yaml
Parameters:
  Environment:
    Type: String
    AllowedValues: [development, staging, production]

Conditions:
  IsDevelopment: !Equals [!Ref Environment, development]

Resources:
  ServiceCatalogLaunchRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: ServiceCatalogLaunchRole
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: servicecatalog.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: LaunchPermissions
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - ec2:*
                  - rds:*
                  - elasticache:*
                  - cloudformation:*
                Resource: '*'
              # Development: Can create resources
              # Production: Additional approval required (via SNS)
              - !If
                - IsDevelopment
                - Effect: Allow
                  Action: '*'
                  Resource: '*'
                - Effect: Deny
                  Action:
                    - ec2:RunInstances
                    - rds:CreateDBInstance
                  Resource: '*'
                  Condition:
                    StringNotEquals:
                      aws:RequestedRegion: us-east-1

# Deploy to Development OU (100 accounts)
aws cloudformation create-stack-instances \
  --stack-set-name ServiceCatalogLaunchRoles-Dev \
  --deployment-targets OrganizationalUnitIds=ou-dev-abc123 \
  --parameter-overrides ParameterKey=Environment,ParameterValue=development \
  --regions us-east-1 us-west-2

# Deploy to Production OU (50 accounts)
aws cloudformation create-stack-instances \
  --stack-set-name ServiceCatalogLaunchRoles-Prod \
  --deployment-targets OrganizationalUnitIds=ou-prod-xyz789 \
  --parameter-overrides ParameterKey=Environment,ParameterValue=production \
  --regions us-east-1 us-west-2
```

**Step 5: Local Configuration** (Spoke Accounts):
```bash
# Run in each spoke account (or via automation)

# Import shared portfolios (automatic via Organizations sharing)

# Grant access to local users
# Development account
aws servicecatalog associate-principal-with-portfolio \
  --portfolio-id port-compute-dev \
  --principal-arn arn:aws:iam::111111111111:role/DeveloperRole \
  --principal-type IAM

# Production account
aws servicecatalog associate-principal-with-portfolio \
  --portfolio-id port-compute-prod \
  --principal-arn arn:aws:iam::222222222222:role/PlatformEngineerRole \
  --principal-type IAM

# Optional: Add local constraints
# Example: Dev account further limits instance types
aws servicecatalog create-constraint \
  --portfolio-id port-compute-dev \
  --product-id prod-ec2-linux \
  --type TEMPLATE \
  --parameters '{
    "Rules": {
      "InstanceTypeRule": {
        "Assertions": [{
          "Assert": {"Fn::Contains": [["t3.micro"], {"Ref": "InstanceType"}]},
          "AssertDescription": "This dev account: t3.micro only"
        }]
      }
    }
  }'
```

**Step 6: Monitoring & Governance**:
```python
# Lambda: Track launches across all 200 accounts
import boto3
from datetime import datetime

def lambda_handler(event, context):
    """
    Aggregate Service Catalog launches from all accounts
    Send daily report to platform team
    """
    orgs = boto3.client('organizations')
    
    # Get all accounts
    accounts = []
    paginator = orgs.get_paginator('list_accounts')
    for page in paginator.paginate():
        accounts.extend(page['Accounts'])
    
    # Assume role in each account and get launches
    launches = []
    for account in accounts:
        # Assume OrganizationAccountAccessRole
        sts = boto3.client('sts')
        creds = sts.assume_role(
            RoleArn=f"arn:aws:iam::{account['Id']}:role/OrganizationAccountAccessRole",
            RoleSessionName='ServiceCatalogAudit'
        )
        
        # Query Service Catalog
        sc = boto3.client(
            'servicecatalog',
            aws_access_key_id=creds['Credentials']['AccessKeyId'],
            aws_secret_access_key=creds['Credentials']['SecretAccessKey'],
            aws_session_token=creds['Credentials']['SessionToken']
        )
        
        provisioned_products = sc.search_provisioned_products()
        
        for product in provisioned_products['ProvisionedProducts']:
            launches.append({
                'Account': account['Id'],
                'AccountName': account['Name'],
                'Product': product['Name'],
                'Type': product['Type'],
                'Status': product['Status'],
                'CreatedTime': product['CreatedTime']
            })
    
    # Generate report
    report = f"""
    Service Catalog Usage Report - {datetime.now().strftime('%Y-%m-%d')}
    
    Total Accounts: {len(accounts)}
    Total Provisioned Products: {len(launches)}
    
    By Environment:
    - Development: {len([l for l in launches if 'dev' in l['AccountName'].lower()])}
    - Staging: {len([l for l in launches if 'staging' in l['AccountName'].lower()])}
    - Production: {len([l for l in launches if 'prod' in l['AccountName'].lower()])}
    
    Top Products:
    """
    
    # Count products
    from collections import Counter
    product_counts = Counter([l['Product'] for l in launches])
    for product, count in product_counts.most_common(10):
        report += f"\n- {product}: {count}"
    
    # Send report
    sns = boto3.client('sns')
    sns.publish(
        TopicArn='arn:aws:sns:us-east-1:555555555555:service-catalog-reports',
        Subject='Daily Service Catalog Usage Report',
        Message=report
    )
    
    return {'statusCode': 200, 'launches': len(launches)}
```

**Cost Tracking**:
```sql
-- Athena query: Service Catalog costs across all 200 accounts
SELECT
  line_item_usage_account_id as account,
  resource_tags_user_cost_center as cost_center,
  resource_tags_user_environment as environment,
  SUM(line_item_blended_cost) as cost
FROM cur_database.cur_table
WHERE
  resource_tags_user_managed_by = 'ServiceCatalog'
  AND year = '2026'
  AND month = '01'
GROUP BY
  line_item_usage_account_id,
  resource_tags_user_cost_center,
  resource_tags_user_environment
ORDER BY cost DESC

-- Output:
-- Account 111111111111 (Dev-Engineering): $12,345
-- Account 222222222222 (Prod-Engineering): $45,678
-- Account 333333333333 (Dev-DataScience): $8,901
```

**Result**:
```
200 accounts, standardized provisioning:
✅ Hub account: 25 products, 8 portfolios
✅ Automatic sharing to OUs (no manual per-account setup)
✅ New accounts: Immediate access (join OU → get portfolios)
✅ Environment-specific constraints (dev ≠ prod)
✅ Launch roles deployed via StackSets (consistent)
✅ Local customization allowed (spoke can add constraints)
✅ Centralized monitoring (aggregate usage, costs)
✅ Governance enforced (tagging, cost limits, approved configs)

Maintenance:
- Hub team updates products → All 200 accounts get update
- New product: Add to portfolio → Share to OU → Done
- Version update: Update provisioning artifact → Users can upgrade

Cost savings:
- Standardization: Eliminate overprovisioned resources ($500K/year)
- Self-service: Reduce IT tickets (500/month → 50/month)
- Compliance: Avoid violations ($0 fines vs potential $100K+)
```

### Q3: Explain the different types of constraints in Service Catalog. Provide examples of when you would use each type.

**Answer**:

**Three Constraint Types**:

**1. Launch Constraint**:
```
Purpose: Define IAM role Service Catalog assumes when provisioning
Why: Enable least privilege (users don't need resource permissions)

Example:
aws servicecatalog create-constraint \
  --portfolio-id port-abc123 \
  --product-id prod-xyz789 \
  --type LAUNCH \
  --parameters '{"RoleArn": "arn:aws:iam::123:role/ServiceCatalogLaunchRole"}'

Use cases:
✅ Developer launches RDS without rds:* permission
✅ User provisions EC2 without ec2:RunInstances permission
✅ Cross-account provisioning (launch role in spoke account)

When to use:
- ALWAYS (required for self-service without broad IAM permissions)
- Every product should have launch constraint
- Enables principle of least privilege
```

**2. Template Constraint**:
```
Purpose: Override CloudFormation template rules/parameters
Why: Restrict allowed values beyond template definitions

Example 1: Restrict instance types
aws servicecatalog create-constraint \
  --portfolio-id port-dev-compute \
  --product-id prod-ec2 \
  --type TEMPLATE \
  --parameters '{
    "Rules": {
      "InstanceTypeRule": {
        "Assertions": [{
          "Assert": {
            "Fn::Contains": [
              ["t3.micro", "t3.small"],
              {"Ref": "InstanceType"}
            ]
          },
          "AssertDescription": "Development: t3.micro and t3.small only"
        }]
      }
    }
  }'

Template allows: t3.micro, t3.small, t3.medium, m5.large, m5.xlarge
Constraint restricts to: t3.micro, t3.small

Use case: Same template for dev and prod, different constraints

Example 2: Limit storage size
{
  "Rules": {
    "StorageRule": {
      "Assertions": [{
        "Assert": {
          "Fn::And": [
            {"Fn::GreaterThanOrEquals": [{"Ref": "VolumeSize"}, 20]},
            {"Fn::LessThanOrEquals": [{"Ref": "VolumeSize"}, 100]}
          ]
        },
        "AssertDescription": "Storage: 20-100 GB only (cost control)"
      }]
    }
  }
}

Example 3: Enforce region
{
  "Rules": {
    "RegionRule": {
      "Assertions": [{
        "Assert": {
          "Fn::Equals": [{"Ref": "AWS::Region"}, "us-east-1"]
        },
        "AssertDescription": "Resources must be in us-east-1 (data residency)"
      }]
    }
  }
}

When to use:
✅ Same product for multiple portfolios (dev vs prod)
✅ Cost control (limit expensive instance types)
✅ Compliance (restrict regions, require encryption)
✅ Local customization (spoke account further restricts hub template)
```

**3. TagOption Constraint**:
```
Purpose: Enforce tagging on provisioned resources
Why: Cost allocation, governance, compliance

Example: Create TagOption library
aws servicecatalog create-tag-option --key CostCenter --value Engineering
aws servicecatalog create-tag-option --key CostCenter --value Marketing
aws servicecatalog create-tag-option --key Environment --value development
aws servicecatalog create-tag-option --key Environment --value production

Associate with portfolio:
aws servicecatalog associate-tag-option-with-resource \
  --resource-id port-abc123 \
  --tag-option-id tag-costcenter-engineering

User sees dropdown (not free-form text):
CostCenter: [Engineering | Marketing | DataScience]
Environment: [development | staging | production]

Tags cascade:
User launches EC2 product with CostCenter=Engineering
→ EC2 instance tagged: CostCenter=Engineering
→ EBS volume tagged: CostCenter=Engineering
→ Security group tagged: CostCenter=Engineering
→ All resources inherit tags automatically

When to use:
✅ ALWAYS (tagging essential for cost allocation)
✅ Chargeback reporting (cost per department)
✅ Compliance (require Owner, Environment tags)
✅ Automation (tag-based policies, backup rules)
```

**Real-World Example - All Three Constraints**:
```bash
# Product: PostgreSQL RDS database
# Portfolio: Development Databases

# 1. Launch Constraint (required)
aws servicecatalog create-constraint \
  --portfolio-id port-dev-db \
  --product-id prod-postgresql \
  --type LAUNCH \
  --parameters '{"RoleArn": "arn:aws:iam::123:role/SC-Launch-RDS"}' \
  --description "Launch role with rds:* permissions"

# Without this: User needs rds:CreateDBInstance (too broad)
# With this: User only needs servicecatalog:LaunchProduct

# 2. Template Constraint (cost control)
aws servicecatalog create-constraint \
  --portfolio-id port-dev-db \
  --product-id prod-postgresql \
  --type TEMPLATE \
  --parameters '{
    "Rules": {
      "InstanceTypeRule": {
        "Assertions": [{
          "Assert": {
            "Fn::Contains": [
              ["db.t3.micro", "db.t3.small"],
              {"Ref": "InstanceType"}
            ]
          },
          "AssertDescription": "Development: Small instances only"
        }]
      },
      "StorageRule": {
        "Assertions": [{
          "Assert": {
            "Fn::LessThanOrEquals": [{"Ref": "AllocatedStorage"}, 100]
          },
          "AssertDescription": "Development: Max 100 GB storage"
        }]
      },
      "MultiAZRule": {
        "Assertions": [{
          "Assert": {
            "Fn::Equals": [{"Ref": "MultiAZ"}, false]
          },
          "AssertDescription": "Development: Single-AZ only (cost savings)"
        }]
      }
    }
  }' \
  --description "Cost controls for development environment"

# Template allows db.t3.micro through db.r6g.16xlarge
# Constraint restricts to db.t3.micro and db.t3.small
# Cost impact: $25/month vs potential $5,000/month

# 3. TagOption Constraint (governance)
aws servicecatalog associate-tag-option-with-resource \
  --resource-id port-dev-db \
  --tag-option-id tag-costcenter

aws servicecatalog associate-tag-option-with-resource \
  --resource-id port-dev-db \
  --tag-option-id tag-owner

aws servicecatalog associate-tag-option-with-resource \
  --resource-id port-dev-db \
  --tag-option-id tag-environment

# User must select:
# - CostCenter: [Engineering | Marketing | DataScience]
# - Owner: [john.doe@company.com | jane.smith@company.com]
# - Environment: [development | staging | production]

# Result: All RDS resources properly tagged for cost allocation
```

**Constraint Comparison**:
```
Type          Purpose                    Scope              Example
----------------------------------------------------------------------------------
Launch        IAM role assumption        Product-Portfolio  Enable self-service
Template      Override template rules    Product-Portfolio  Limit instance types
TagOption     Enforce tagging            Portfolio          Require CostCenter

Enforcement:
Launch:     Required (provisioning fails without it)
Template:   Validation (user cannot submit non-compliant values)
TagOption:  User sees dropdown (must select from allowed values)

When to use each:
Launch:     ALWAYS (every product needs launch role)
Template:   When same product in multiple environments (dev vs prod)
TagOption:  ALWAYS (tagging essential for governance)

Can combine:
✅ Product can have all three constraint types
✅ Multiple template constraints (one for instance type, one for region)
✅ Multiple TagOptions (CostCenter, Owner, Environment)
```

### Q4: How would you implement approval workflows for Service Catalog product launches in a production environment?

**Answer**:

**Requirement**:
```
Production environment: All product launches require approval
- Developer requests database
- Manager approves/rejects
- If approved, product launches
- Track all requests (audit trail)
```

**Architecture**:
```
Developer → Service Catalog (blocked by constraint)
          → SNS notification to manager
          → Manager reviews request
          → Approval/rejection (Step Functions)
          → If approved → Launch product
          → Notify developer
```

**Implementation**:

**Step 1: Create Approval Portal** (Lambda + DynamoDB):
```python
# request_product.py
import boto3
import json
import uuid

dynamodb = boto3.resource('dynamodb')
sns = boto3.client('sns')

def lambda_handler(event, context):
    """
    Developer requests product launch
    Store in DynamoDB, notify approver
    """
    table = dynamodb.Table('ServiceCatalogRequests')
    
    request_id = str(uuid.uuid4())
    request = {
        'RequestId': request_id,
        'User': event['user'],
        'UserEmail': event['user_email'],
        'ProductId': event['product_id'],
        'ProductName': event['product_name'],
        'Parameters': json.dumps(event['parameters']),
        'Tags': json.dumps(event['tags']),
        'Status': 'PENDING_APPROVAL',
        'RequestedAt': event['timestamp'],
        'Manager': get_manager(event['user'])  # From LDAP/AD
    }
    
    table.put_item(Item=request)
    
    # Notify manager
    manager_email = get_manager_email(request['Manager'])
    approval_link = f"https://portal.company.com/approvals/{request_id}"
    
    sns.publish(
        TopicArn='arn:aws:sns:us-east-1:123:manager-approvals',
        Subject=f'Approval Required: {event["product_name"]}',
        Message=f"""
Approval Request:

User: {event['user']} ({event['user_email']})
Product: {event['product_name']}
Parameters:
{json.dumps(event['parameters'], indent=2)}

Cost Estimate: ${estimate_cost(event['product_id'], event['parameters'])}/month

Approve: {approval_link}?action=approve
Reject: {approval_link}?action=reject

Request ID: {request_id}
        """,
        MessageAttributes={
            'email': {'DataType': 'String', 'StringValue': manager_email}
        }
    )
    
    return {
        'statusCode': 200,
        'requestId': request_id,
        'message': 'Request submitted for approval'
    }
```

**Step 2: Approval Handler**:
```python
# process_approval.py
import boto3

dynamodb = boto3.resource('dynamodb')
sc = boto3.client('servicecatalog')
sns = boto3.client('sns')

def lambda_handler(event, context):
    """
    Manager approves/rejects request
    """
    table = dynamodb.Table('ServiceCatalogRequests')
    
    request_id = event['request_id']
    action = event['action']  # 'approve' or 'reject'
    approver = event['approver']
    comments = event.get('comments', '')
    
    # Get request
    response = table.get_item(Key={'RequestId': request_id})
    request = response['Item']
    
    if action == 'approve':
        # Launch product
        launch_response = sc.provision_product(
            ProductId=request['ProductId'],
            ProvisioningArtifactId=get_latest_version(request['ProductId']),
            ProvisionedProductName=f"{request['ProductName']}-{request_id[:8]}",
            ProvisioningParameters=json.loads(request['Parameters']),
            Tags=json.loads(request['Tags'])
        )
        
        # Update request
        table.update_item(
            Key={'RequestId': request_id},
            UpdateExpression='SET #status = :status, ApprovedBy = :approver, ApprovedAt = :timestamp, ProvisionedProductId = :ppid',
            ExpressionAttributeNames={'#status': 'Status'},
            ExpressionAttributeValues={
                ':status': 'APPROVED',
                ':approver': approver,
                ':timestamp': datetime.now().isoformat(),
                ':ppid': launch_response['RecordDetail']['ProvisionedProductId']
            }
        )
        
        # Notify user
        sns.publish(
            TopicArn='arn:aws:sns:us-east-1:123:user-notifications',
            Subject=f'Approved: {request["ProductName"]}',
            Message=f"""
Your request has been approved.

Product: {request['ProductName']}
Approved by: {approver}
Comments: {comments}

Provisioning in progress. You will receive another email when complete.

Request ID: {request_id}
            """,
            MessageAttributes={
                'email': {'DataType': 'String', 'StringValue': request['UserEmail']}
            }
        )
        
        return {'statusCode': 200, 'message': 'Approved and launched'}
    
    elif action == 'reject':
        # Update request
        table.update_item(
            Key={'RequestId': request_id},
            UpdateExpression='SET #status = :status, RejectedBy = :approver, RejectedAt = :timestamp, RejectionReason = :reason',
            ExpressionAttributeNames={'#status': 'Status'},
            ExpressionAttributeValues={
                ':status': 'REJECTED',
                ':approver': approver,
                ':timestamp': datetime.now().isoformat(),
                ':reason': comments
            }
        )
        
        # Notify user
        sns.publish(
            TopicArn='arn:aws:sns:us-east-1:123:user-notifications',
            Subject=f'Rejected: {request["ProductName"]}',
            Message=f"""
Your request has been rejected.

Product: {request['ProductName']}
Rejected by: {approver}
Reason: {comments}

Please contact your manager for more information.

Request ID: {request_id}
            """,
            MessageAttributes={
                'email': {'DataType': 'String', 'StringValue': request['UserEmail']}
            }
        )
        
        return {'statusCode': 200, 'message': 'Rejected'}
```

**Step 3: Provisioning Complete Notification**:
```python
# notify_completion.py
import boto3

def lambda_handler(event, context):
    """
    EventBridge rule triggers on ProvisionProduct completion
    Notify user with outputs (endpoints, URLs)
    """
    sc = boto3.client('servicecatalog')
    dynamodb = boto3.resource('dynamodb')
    sns = boto3.client('sns')
    
    table = dynamodb.Table('ServiceCatalogRequests')
    
    # Get provisioned product details
    pp_id = event['detail']['responseElements']['recordDetail']['provisionedProductId']
    
    # Find request
    response = table.scan(
        FilterExpression='ProvisionedProductId = :ppid',
        ExpressionAttributeValues={':ppid': pp_id}
    )
    
    if not response['Items']:
        return {'statusCode': 404}
    
    request = response['Items'][0]
    
    # Get outputs
    record = sc.describe_record(Id=event['detail']['responseElements']['recordDetail']['recordId'])
    outputs = record['RecordDetail'].get('RecordOutputs', [])
    
    output_text = '\n'.join([f"{o['OutputKey']}: {o['OutputValue']}" for o in outputs])
    
    # Notify user
    sns.publish(
        TopicArn='arn:aws:sns:us-east-1:123:user-notifications',
        Subject=f'Provisioned: {request["ProductName"]}',
        Message=f"""
Your product has been provisioned successfully.

Product: {request['ProductName']}
Status: AVAILABLE

Outputs:
{output_text}

You can now use your resource.

Request ID: {request['RequestId']}
        """,
        MessageAttributes={
            'email': {'DataType': 'String', 'StringValue': request['UserEmail']}
        }
    )
    
    # Update request
    table.update_item(
        Key={'RequestId': request['RequestId']},
        UpdateExpression='SET #status = :status, CompletedAt = :timestamp',
        ExpressionAttributeNames={'#status': 'Status'},
        ExpressionAttributeValues={
            ':status': 'COMPLETED',
            ':timestamp': datetime.now().isoformat()
        }
    )
    
    return {'statusCode': 200}
```

**Step 4: Web Portal** (React):
```jsx
// ApprovalPortal.jsx
function ApprovalPortal() {
  const [requests, setRequests] = useState([]);
  
  useEffect(() => {
    // Load pending approvals for manager
    fetch('/api/approvals/pending')
      .then(res => res.json())
      .then(data => setRequests(data));
  }, []);
  
  const handleApprove = (requestId, comments) => {
    fetch('/api/approvals/approve', {
      method: 'POST',
      body: JSON.stringify({ requestId, comments })
    }).then(() => {
      alert('Request approved. Product will be provisioned.');
      // Refresh list
      setRequests(requests.filter(r => r.RequestId !== requestId));
    });
  };
  
  const handleReject = (requestId, reason) => {
    fetch('/api/approvals/reject', {
      method: 'POST',
      body: JSON.stringify({ requestId, reason })
    }).then(() => {
      alert('Request rejected.');
      setRequests(requests.filter(r => r.RequestId !== requestId));
    });
  };
  
  return (
    <div>
      <h1>Pending Approvals</h1>
      {requests.map(request => (
        <div key={request.RequestId} className="approval-card">
          <h3>{request.ProductName}</h3>
          <p><strong>User:</strong> {request.User} ({request.UserEmail})</p>
          <p><strong>Requested:</strong> {request.RequestedAt}</p>
          <p><strong>Estimated Cost:</strong> ${request.EstimatedCost}/month</p>
          
          <h4>Parameters:</h4>
          <pre>{JSON.stringify(JSON.parse(request.Parameters), null, 2)}</pre>
          
          <div>
            <button onClick={() => {
              const comments = prompt('Approval comments (optional):');
              handleApprove(request.RequestId, comments);
            }}>
              ✅ Approve
            </button>
            
            <button onClick={() => {
              const reason = prompt('Rejection reason (required):');
              if (reason) handleReject(request.RequestId, reason);
            }}>
              ❌ Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
```

**Step 5: EventBridge Integration**:
```bash
# Rule: Provisioning complete → Notify user
aws events put-rule \
  --name ServiceCatalogProvisioningComplete \
  --event-pattern '{
    "source": ["aws.servicecatalog"],
    "detail-type": ["AWS API Call via CloudTrail"],
    "detail": {
      "eventName": ["ProvisionProduct"],
      "responseElements": {
        "recordDetail": {
          "status": ["SUCCEEDED"]
        }
      }
    }
  }'

aws events put-targets \
  --rule ServiceCatalogProvisioningComplete \
  --targets "Id"="1","Arn"="arn:aws:lambda:us-east-1:123:function:NotifyCompletion"
```

**Workflow Summary**:
```
1. Developer requests product
   POST /api/request-product
   {
     "product_id": "prod-xyz789",
     "parameters": {"DatabaseName": "myapp", "InstanceType": "db.t3.small"},
     "tags": {"CostCenter": "Engineering"}
   }
   
2. Request stored in DynamoDB (Status: PENDING_APPROVAL)
   
3. Manager receives email
   "Approval Required: PostgreSQL Database
    User: john.doe
    Cost: $25/month
    Approve: [Link] | Reject: [Link]"
   
4. Manager clicks Approve
   → Lambda launches product via Service Catalog
   → Status: APPROVED
   → User notified: "Approved, provisioning in progress"
   
5. CloudFormation creates RDS (15 minutes)
   
6. EventBridge detects completion
   → Lambda sends outputs to user
   → Status: COMPLETED
   → User receives:
      "Endpoint: myapp.abc123.us-east-1.rds.amazonaws.com
       Port: 5432
       Connection: postgresql://..."

7. Audit trail complete:
   - Who requested (john.doe)
   - When (2026-01-31T10:00:00Z)
   - What (PostgreSQL, db.t3.small, 50 GB)
   - Who approved (jane.smith)
   - When approved (2026-01-31T10:15:00Z)
   - Cost ($25/month)
```

**Benefits**:
```
✅ Governance: All production launches require approval
✅ Cost control: Manager sees cost estimate before approving
✅ Audit trail: Complete history in DynamoDB
✅ User experience: Email notifications at each stage
✅ Accountability: Track who approved what
✅ Integration: Works with existing Service Catalog products
```

### Q5: How would you use Service Catalog to enforce standardized VPC architectures across a multi-account organization?

**Answer**:

**Requirement**:
```
Organization: 100 accounts
Need: Standardized VPC architecture
- 3-tier design (public, private app, private data subnets)
- 3 AZs for HA
- NAT gateways in each AZ
- VPC Flow Logs enabled
- Transit Gateway attachment
- Consistent CIDR allocation
```

**Product Design - VPC CloudFormation Template**:
```yaml
# vpc-standard-3tier.yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Standard 3-tier VPC with Transit Gateway'

Parameters:
  VPCName:
    Type: String
    Description: VPC name
    AllowedPattern: '^[a-z0-9-]+$'
  
  Environment:
    Type: String
    AllowedValues: [development, staging, production]
  
  VPCCidr:
    Type: String
    Description: 'VPC CIDR (auto-assigned from IPAM)'
    Default: '10.0.0.0/16'
  
  TransitGatewayId:
    Type: String
    Description: 'Transit Gateway ID for connectivity'
    Default: 'tgw-abc123def456'

Mappings:
  EnvironmentMap:
    development:
      FlowLogRetention: 7
      NATGateways: 1  # Single NAT for cost savings
    staging:
      FlowLogRetention: 14
      NATGateways: 2
    production:
      FlowLogRetention: 30
      NATGateways: 3  # NAT in each AZ for HA

Resources:
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VPCCidr
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Ref VPCName
        - Key: Environment
          Value: !Ref Environment
  
  # Internet Gateway
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${VPCName}-igw'
  
  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway
  
  # Public Subnets (3 AZs)
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Select [0, !Cidr [!Ref VPCCidr, 9, 8]]  # /24 subnets
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${VPCName}-public-1a'
        - Key: Tier
          Value: Public
  
  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Select [1, !Cidr [!Ref VPCCidr, 9, 8]]
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${VPCName}-public-1b'
        - Key: Tier
          Value: Public
  
  PublicSubnet3:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Select [2, !Cidr [!Ref VPCCidr, 9, 8]]
      AvailabilityZone: !Select [2, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${VPCName}-public-1c'
        - Key: Tier
          Value: Public
  
  # Private App Subnets
  PrivateAppSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Select [3, !Cidr [!Ref VPCCidr, 9, 8]]
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${VPCName}-private-app-1a'
        - Key: Tier
          Value: PrivateApp
  
  PrivateAppSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Select [4, !Cidr [!Ref VPCCidr, 9, 8]]
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${VPCName}-private-app-1b'
        - Key: Tier
          Value: PrivateApp
  
  PrivateAppSubnet3:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Select [5, !Cidr [!Ref VPCCidr, 9, 8]]
      AvailabilityZone: !Select [2, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${VPCName}-private-app-1c'
        - Key: Tier
          Value: PrivateApp
  
  # Private Data Subnets
  PrivateDataSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Select [6, !Cidr [!Ref VPCCidr, 9, 8]]
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${VPCName}-private-data-1a'
        - Key: Tier
          Value: PrivateData
  
  PrivateDataSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Select [7, !Cidr [!Ref VPCCidr, 9, 8]]
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${VPCName}-private-data-1b'
        - Key: Tier
          Value: PrivateData
  
  PrivateDataSubnet3:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Select [8, !Cidr [!Ref VPCCidr, 9, 8]]
      AvailabilityZone: !Select [2, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${VPCName}-private-data-1c'
        - Key: Tier
          Value: PrivateData
  
  # NAT Gateways (conditionally create 1 or 3)
  EIP1:
    Type: AWS::EC2::EIP
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${VPCName}-nat-1a'
  
  NATGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt EIP1.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub '${VPCName}-nat-1a'
  
  # ... (NAT 2 and 3 similar, with conditions for environment)
  
  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${VPCName}-public-rt'
  
  PublicRoute:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway
  
  # Transit Gateway route
  TransitGatewayRoute:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 10.0.0.0/8  # Corporate network
      TransitGatewayId: !Ref TransitGatewayId
  
  # Private route tables (NAT gateway routes)
  # ... (similar for private app and data subnets)
  
  # VPC Flow Logs
  FlowLogRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: vpc-flow-logs.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: CloudWatchLogPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: '*'
  
  FlowLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/vpc/${VPCName}'
      RetentionInDays: !FindInMap [EnvironmentMap, !Ref Environment, FlowLogRetention]
  
  VPCFlowLog:
    Type: AWS::EC2::FlowLog
    Properties:
      ResourceType: VPC
      ResourceId: !Ref VPC
      TrafficType: ALL
      LogDestinationType: cloud-watch-logs
      LogGroupName: !Ref FlowLogGroup
      DeliverLogsPermissionArn: !GetAtt FlowLogRole.Arn
      Tags:
        - Key: Name
          Value: !Sub '${VPCName}-flow-log'
  
  # Transit Gateway Attachment
  TransitGatewayAttachment:
    Type: AWS::EC2::TransitGatewayAttachment
    Properties:
      TransitGatewayId: !Ref TransitGatewayId
      VpcId: !Ref VPC
      SubnetIds:
        - !Ref PrivateAppSubnet1
        - !Ref PrivateAppSubnet2
        - !Ref PrivateAppSubnet3
      Tags:
        - Key: Name
          Value: !Sub '${VPCName}-tgw-attachment'

Outputs:
  VPCId:
    Value: !Ref VPC
    Export:
      Name: !Sub '${VPCName}-VPCId'
  
  PublicSubnets:
    Value: !Join [',', [!Ref PublicSubnet1, !Ref PublicSubnet2, !Ref PublicSubnet3]]
    Export:
      Name: !Sub '${VPCName}-PublicSubnets'
  
  PrivateAppSubnets:
    Value: !Join [',', [!Ref PrivateAppSubnet1, !Ref PrivateAppSubnet2, !Ref PrivateAppSubnet3]]
    Export:
      Name: !Sub '${VPCName}-PrivateAppSubnets'
  
  PrivateDataSubnets:
    Value: !Join [',', [!Ref PrivateDataSubnet1, !Ref PrivateDataSubnet2, !Ref PrivateDataSubnet3]]
    Export:
      Name: !Sub '${VPCName}-PrivateDataSubnets'
  
  TransitGatewayAttachmentId:
    Value: !Ref TransitGatewayAttachment
```

**Service Catalog Setup**:
```bash
# Create product
aws servicecatalog create-product \
  --name "Standard 3-Tier VPC" \
  --description "Standardized VPC architecture: 3 AZs, public/private tiers, NAT, TGW" \
  --owner "Cloud Platform Team" \
  --product-type CLOUD_FORMATION_TEMPLATE \
  --provisioning-artifact-parameters '{
    "Name": "v1.0",
    "Description": "Standard 3-tier VPC with Transit Gateway",
    "Info": {"LoadTemplateFromURL": "https://s3.../vpc-standard-3tier.yaml"},
    "Type": "CLOUD_FORMATION_TEMPLATE"
  }'

# Create portfolio
aws servicecatalog create-portfolio \
  --display-name "Networking-Standard" \
  --description "Standardized networking components" \
  --provider-name "Cloud Platform Team"

# Add product to portfolio
aws servicecatalog associate-product-with-portfolio \
  --product-id prod-vpc-3tier \
  --portfolio-id port-networking

# Share to all accounts
aws servicecatalog create-portfolio-share \
  --portfolio-id port-networking \
  --organization-node '{"Type": "ORGANIZATION", "Value": "o-abc123"}' \
  --share-principals

# All 100 accounts can now provision standardized VPCs
```

**CIDR Allocation with IPAM**:
```python
# Lambda: Auto-assign CIDR from IPAM pool
import boto3

ipam = boto3.client('ec2')

def lambda_handler(event, context):
    """
    Pre-launch: Allocate CIDR from IPAM pool
    Ensures no overlapping CIDRs across accounts
    """
    account_id = event['account_id']
    environment = event['parameters']['Environment']
    
    # IPAM pool per environment
    pool_map = {
        'development': 'ipam-pool-dev-abc123',
        'staging': 'ipam-pool-staging-def456',
        'production': 'ipam-pool-prod-ghi789'
    }
    
    pool_id = pool_map[environment]
    
    # Allocate /16 CIDR
    allocation = ipam.allocate_ipam_pool_cidr(
        IpamPoolId=pool_id,
        NetmaskLength=16
    )
    
    cidr = allocation['IpamPoolAllocation']['Cidr']
    
    # Return CIDR to Service Catalog launch
    return {
        'statusCode': 200,
        'cidr': cidr  # e.g., 10.42.0.0/16
    }

# Update Service Catalog parameters with allocated CIDR
event['parameters']['VPCCidr'] = cidr
```

**Result**:
```
100 accounts, standardized VPC architecture:

✅ Consistent design across all accounts:
   - 3 public subnets (10.x.0.0/24, 10.x.1.0/24, 10.x.2.0/24)
   - 3 private app subnets (10.x.3.0/24, 10.x.4.0/24, 10.x.5.0/24)
   - 3 private data subnets (10.x.6.0/24, 10.x.7.0/24, 10.x.8.0/24)
   - NAT gateways (1 for dev, 3 for prod)
   - VPC Flow Logs (7 days dev, 30 days prod)
   - Transit Gateway attachment (automatic connectivity)

✅ No CIDR conflicts (IPAM allocation):
   - Account 1: 10.1.0.0/16
   - Account 2: 10.2.0.0/16
   - ...
   - Account 100: 10.100.0.0/16

✅ CloudFormation exports enable cross-stack references:
   aws cloudformation list-exports | grep VPCId
   # Can reference VPC in other Service Catalog products

✅ Self-service (developers provision VPCs in minutes):
   - No IT tickets
   - No configuration errors
   - Compliance built-in

✅ Cost optimization:
   - Dev: Single NAT ($32/month vs $96 for 3 NATs)
   - Prod: 3 NATs for HA ($96/month)
   - Flow Logs: 7-day retention for dev (cost savings)

✅ Governance:
   - All VPCs follow standard (no exceptions)
   - Platform team updates template → All accounts get update
   - Deprecated versions prevented (force upgrade)
```

---

This comprehensive AWS Service Catalog guide covers all capabilities needed for SAP-C02 certification with product design, portfolio management, multi-account distribution, governance constraints, and real-world self-service provisioning scenarios!
