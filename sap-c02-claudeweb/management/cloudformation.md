# AWS CloudFormation

## What is CloudFormation?

AWS CloudFormation is an Infrastructure as Code (IaC) service that allows you to model and provision AWS resources using templates. It automates the creation, update, and deletion of infrastructure in a consistent and repeatable manner.

## Why Use CloudFormation?

### Key Benefits
- **Infrastructure as Code**: Version control your infrastructure
- **Consistency**: Identical environments every time
- **Automation**: No manual clicking in console
- **Declarative**: Describe what you want, not how to create it
- **Change Management**: Preview changes before applying
- **Rollback**: Automatic rollback on failures
- **Free**: No charge for CloudFormation (pay for resources)

### Use Cases
- Multi-tier application deployment
- Disaster recovery environments
- Development/staging/production consistency
- Compliance and governance
- Quick environment replication
- Cost tracking by stack

## Core Concepts

### Templates

**What**: JSON or YAML files describing AWS resources

**Structure**:
```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'My CloudFormation template'

Parameters:
  # Input values

Mappings:
  # Static variables

Conditions:
  # Conditional logic

Resources:
  # AWS resources (required)

Outputs:
  # Return values

Metadata:
  # Additional information
```

**Template Anatomy**:

**1. Parameters** (Optional):
```yaml
Parameters:
  InstanceType:
    Type: String
    Default: t3.micro
    AllowedValues:
      - t3.micro
      - t3.small
      - t3.medium
    Description: EC2 instance type
  
  KeyName:
    Type: AWS::EC2::KeyPair::KeyName
    Description: EC2 key pair
```

**2. Mappings** (Optional):
```yaml
Mappings:
  RegionMap:
    us-east-1:
      AMI: ami-0c55b159cbfafe1f0
    us-west-2:
      AMI: ami-0d1cd67c26f5fca19
    eu-west-1:
      AMI: ami-0bbc25e23a7640b9b
```

**3. Conditions** (Optional):
```yaml
Conditions:
  IsProduction: !Equals [!Ref Environment, production]
  CreateSecondaryDB: !And
    - !Equals [!Ref Environment, production]
    - !Equals [!Ref MultiAZ, true]
```

**4. Resources** (Required):
```yaml
Resources:
  MyEC2Instance:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: !FindInMap [RegionMap, !Ref 'AWS::Region', AMI]
      InstanceType: !Ref InstanceType
      KeyName: !Ref KeyName
      SecurityGroups:
        - !Ref MySecurityGroup
      Tags:
        - Key: Name
          Value: MyInstance
  
  MySecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Enable SSH access
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: 0.0.0.0/0
```

**5. Outputs** (Optional):
```yaml
Outputs:
  InstanceId:
    Description: Instance ID
    Value: !Ref MyEC2Instance
    Export:
      Name: !Sub '${AWS::StackName}-InstanceId'
  
  PublicIP:
    Description: Public IP address
    Value: !GetAtt MyEC2Instance.PublicIp
```

### Intrinsic Functions

**!Ref**: Reference parameter or resource
```yaml
InstanceType: !Ref InstanceTypeParameter
SecurityGroups:
  - !Ref MySecurityGroup  # Returns security group ID
```

**!GetAtt**: Get attribute of resource
```yaml
PublicIP: !GetAtt MyEC2Instance.PublicIp
DBEndpoint: !GetAtt MyRDSInstance.Endpoint.Address
```

**!Sub**: Substitute variables
```yaml
Name: !Sub '${Environment}-web-server'
# If Environment=prod: prod-web-server
```

**!Join**: Concatenate strings
```yaml
!Join [':', [a, b, c]]  # Result: a:b:c
```

**!FindInMap**: Retrieve value from mapping
```yaml
ImageId: !FindInMap [RegionMap, !Ref 'AWS::Region', AMI]
```

**!If**: Conditional
```yaml
InstanceType: !If [IsProduction, t3.large, t3.micro]
```

**!Equals**, **!And**, **!Or**, **!Not**: Conditions
```yaml
Conditions:
  IsProduction: !Equals [!Ref Environment, production]
  CreateBackup: !And [!Equals [!Ref Environment, production], !Equals [!Ref Backup, true]]
```

**!Select**: Select item from list
```yaml
AvailabilityZone: !Select [0, !GetAZs '']  # First AZ
```

**!Split**: Split string
```yaml
!Split [',', 'a,b,c']  # Result: [a, b, c]
```

**!ImportValue**: Import exported value from another stack
```yaml
VpcId: !ImportValue NetworkStack-VpcId
```

### Stacks

**What**: Collection of AWS resources managed as a single unit

**Lifecycle**:
```
Create Stack → Stack creates resources
Update Stack → Stack updates resources (change set)
Delete Stack → Stack deletes all resources
```

**Stack Operations**:

**Create**:
```bash
aws cloudformation create-stack \
  --stack-name my-stack \
  --template-body file://template.yaml \
  --parameters ParameterKey=InstanceType,ParameterValue=t3.micro
```

**Update**:
```bash
aws cloudformation update-stack \
  --stack-name my-stack \
  --template-body file://template-v2.yaml
```

**Delete**:
```bash
aws cloudformation delete-stack --stack-name my-stack
```

**Stack Status**:
- CREATE_IN_PROGRESS → CREATE_COMPLETE
- UPDATE_IN_PROGRESS → UPDATE_COMPLETE
- DELETE_IN_PROGRESS → DELETE_COMPLETE
- ROLLBACK_IN_PROGRESS → ROLLBACK_COMPLETE (failure)

### Change Sets

**What**: Preview changes before applying

**Use Case**: Verify updates won't cause unintended changes

**Process**:
```
1. Create change set
2. Review changes (additions, modifications, deletions)
3. Execute change set (apply changes)
   OR
   Delete change set (discard changes)
```

**Example**:
```bash
# Create change set
aws cloudformation create-change-set \
  --stack-name my-stack \
  --change-set-name my-changes \
  --template-body file://template-v2.yaml

# View change set
aws cloudformation describe-change-set \
  --stack-name my-stack \
  --change-set-name my-changes

# Output shows:
# - EC2 instance will be replaced (instance type changed)
# - Security group will be modified (new ingress rule)
# - S3 bucket will remain unchanged

# Execute or delete
aws cloudformation execute-change-set \
  --stack-name my-stack \
  --change-set-name my-changes
```

**Benefits**:
- Avoid surprises (resource replacements)
- Safe updates (preview before apply)
- Documentation (change history)

## Resource Management

### Resource Dependencies

**Implicit Dependencies** (Automatic):
```yaml
Resources:
  MyInstance:
    Type: AWS::EC2::Instance
    Properties:
      SecurityGroups:
        - !Ref MySecurityGroup  # Implicit dependency

  MySecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: SG for instance

# CloudFormation creates MySecurityGroup first, then MyInstance
```

**Explicit Dependencies** (DependsOn):
```yaml
Resources:
  MyEIP:
    Type: AWS::EC2::EIP
    DependsOn: GatewayAttachment  # Explicit dependency
    Properties:
      InstanceId: !Ref MyInstance

  GatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref MyVPC
      InternetGatewayId: !Ref MyIGW
```

**When to Use DependsOn**:
- No implicit reference but creation order matters
- IAM role must exist before EC2 instance profile
- Internet Gateway attachment before Elastic IP

### Update Behaviors

**Update Requires**: 
- **No interruption**: Update without affecting resource
- **Some interruption**: Brief downtime
- **Replacement**: Delete and recreate (new physical ID)

**Example** (EC2 Instance):
```yaml
Properties:
  ImageId: ami-12345  # Replacement (new AMI = new instance)
  InstanceType: t3.micro  # Replacement (instance type change)
  Tags:  # No interruption (just tag update)
    - Key: Name
      Value: MyInstance
```

**Replacement Prevention**:
```yaml
UpdateReplacePolicy: Retain  # Keep old resource when replaced
DeletionPolicy: Retain  # Keep resource when stack deleted
```

**Example**:
```yaml
MyDatabase:
  Type: AWS::RDS::DBInstance
  DeletionPolicy: Snapshot  # Create snapshot before deletion
  UpdateReplacePolicy: Snapshot  # Create snapshot before replacement
  Properties:
    DBInstanceClass: db.t3.micro
    Engine: mysql
```

### Drift Detection

**What**: Detect manual changes outside CloudFormation

**Use Case**: Someone modified resource in console, need to reconcile

**Process**:
```bash
# Detect drift
aws cloudformation detect-stack-drift --stack-name my-stack

# View drift results
aws cloudformation describe-stack-drift-detection-status \
  --stack-drift-detection-id <id>

# Results show:
# - EC2 instance tags modified (drift detected)
# - Security group rules added (drift detected)
# - S3 bucket unchanged (in sync)
```

**Remediation**:
1. Update template to match reality (import changes)
2. Update resource to match template (fix drift)
3. Replace resource (delete and recreate from template)

## Nested Stacks

### What are Nested Stacks?

**Purpose**: Reuse common template patterns, organize large stacks

**Structure**:
```
Parent Stack (main.yaml)
  ├── Network Stack (network.yaml)
  ├── Database Stack (database.yaml)
  └── Application Stack (application.yaml)
```

**Parent Stack**:
```yaml
Resources:
  NetworkStack:
    Type: AWS::CloudFormation::Stack
    Properties:
      TemplateURL: https://s3.amazonaws.com/my-bucket/network.yaml
      Parameters:
        VpcCIDR: 10.0.0.0/16
  
  DatabaseStack:
    Type: AWS::CloudFormation::Stack
    DependsOn: NetworkStack
    Properties:
      TemplateURL: https://s3.amazonaws.com/my-bucket/database.yaml
      Parameters:
        VpcId: !GetAtt NetworkStack.Outputs.VpcId
        SubnetIds: !GetAtt NetworkStack.Outputs.PrivateSubnets
  
  ApplicationStack:
    Type: AWS::CloudFormation::Stack
    DependsOn: DatabaseStack
    Properties:
      TemplateURL: https://s3.amazonaws.com/my-bucket/application.yaml
      Parameters:
        VpcId: !GetAtt NetworkStack.Outputs.VpcId
        DBEndpoint: !GetAtt DatabaseStack.Outputs.DBEndpoint
```

**Benefits**:
- Reusability (common patterns)
- Organization (separate concerns)
- Ownership (different teams manage different stacks)
- Limits (stack resource limit: 500 resources)

**Limitations**:
- Templates must be in S3
- Updates cascade to nested stacks
- Cannot reference parent stack from nested

## StackSets

### What are StackSets?

**Purpose**: Deploy stacks across multiple accounts and regions

**Use Case**: 
- Multi-account organization
- Global application deployment
- Standardized configurations

**Example**:
```
StackSet: Security-Baseline
  ├── Account-A, us-east-1
  ├── Account-A, eu-west-1
  ├── Account-B, us-east-1
  └── Account-C, us-east-1

All get identical CloudTrail, Config, GuardDuty setup
```

**Creating StackSet**:
```bash
aws cloudformation create-stack-set \
  --stack-set-name security-baseline \
  --template-body file://security.yaml \
  --parameters ParameterKey=EnableGuardDuty,ParameterValue=true
```

**Deploying to Accounts/Regions**:
```bash
aws cloudformation create-stack-instances \
  --stack-set-name security-baseline \
  --accounts 123456789012 234567890123 \
  --regions us-east-1 eu-west-1 ap-southeast-1
```

**Permission Models**:

**1. Service-Managed** (Recommended):
- Uses AWS Organizations
- Automatic permissions
- Deploy to OUs (organizational units)

**2. Self-Managed**:
- Manual IAM role setup
- AWSCloudFormationStackSetAdministrationRole (admin account)
- AWSCloudFormationStackSetExecutionRole (target accounts)

**Operation Preferences**:
```yaml
OperationPreferences:
  RegionConcurrencyType: PARALLEL  # Or SEQUENTIAL
  MaxConcurrentPercentage: 100
  FailureTolerancePercentage: 50
  RegionOrder: [us-east-1, eu-west-1, ap-southeast-1]
```

## Custom Resources

### What are Custom Resources?

**Purpose**: Extend CloudFormation with custom logic

**Use Cases**:
- Create resources CloudFormation doesn't support
- Complex initialization logic
- Third-party integrations
- Custom validations

**Implementation**: Lambda-backed or SNS-backed

**Example** (Lambda-backed):
```yaml
Resources:
  MyCustomResource:
    Type: Custom::MyResource
    Properties:
      ServiceToken: !GetAtt CustomResourceFunction.Arn
      Parameter1: Value1
      Parameter2: Value2
  
  CustomResourceFunction:
    Type: AWS::Lambda::Function
    Properties:
      Runtime: python3.9
      Handler: index.handler
      Code:
        ZipFile: |
          import cfnresponse
          def handler(event, context):
              try:
                  if event['RequestType'] == 'Create':
                      # Custom create logic
                      response_data = {'Key': 'Value'}
                      cfnresponse.send(event, context, cfnresponse.SUCCESS, response_data)
                  elif event['RequestType'] == 'Update':
                      # Custom update logic
                      cfnresponse.send(event, context, cfnresponse.SUCCESS, {})
                  elif event['RequestType'] == 'Delete':
                      # Custom delete logic
                      cfnresponse.send(event, context, cfnresponse.SUCCESS, {})
              except Exception as e:
                  cfnresponse.send(event, context, cfnresponse.FAILED, {'Error': str(e)})
```

**Use Case Example** (Seed DynamoDB Table):
```python
import boto3
import cfnresponse

dynamodb = boto3.resource('dynamodb')

def handler(event, context):
    try:
        table_name = event['ResourceProperties']['TableName']
        
        if event['RequestType'] == 'Create':
            table = dynamodb.Table(table_name)
            # Seed with initial data
            table.put_item(Item={'id': '1', 'name': 'Initial Item'})
            cfnresponse.send(event, context, cfnresponse.SUCCESS, {})
        elif event['RequestType'] == 'Delete':
            # Cleanup if needed
            cfnresponse.send(event, context, cfnresponse.SUCCESS, {})
    except Exception as e:
        cfnresponse.send(event, context, cfnresponse.FAILED, {'Error': str(e)})
```

**Response**:
- cfnresponse.SUCCESS or cfnresponse.FAILED
- Response data (optional, accessible via !GetAtt)
- Physical resource ID (for tracking)

## Best Practices

### 1. Use Parameters for Variability

```yaml
Parameters:
  Environment:
    Type: String
    AllowedValues: [dev, staging, production]
  
  InstanceType:
    Type: String
    Default: t3.micro
    AllowedValues: [t3.micro, t3.small, t3.medium]

# Deploy same template to different environments
```

### 2. Use Mappings for Constants

```yaml
Mappings:
  EnvironmentMap:
    dev:
      InstanceType: t3.micro
      DBInstanceClass: db.t3.micro
    production:
      InstanceType: t3.large
      DBInstanceClass: db.r5.large

Resources:
  MyInstance:
    Type: AWS::EC2::Instance
    Properties:
      InstanceType: !FindInMap [EnvironmentMap, !Ref Environment, InstanceType]
```

### 3. Use Outputs for Cross-Stack References

```yaml
Outputs:
  VpcId:
    Description: VPC ID
    Value: !Ref MyVPC
    Export:
      Name: !Sub '${AWS::StackName}-VpcId'

# Other stacks import:
VpcId: !ImportValue NetworkStack-VpcId
```

### 4. Set DeletionPolicy

```yaml
MyDatabase:
  Type: AWS::RDS::DBInstance
  DeletionPolicy: Snapshot  # Create snapshot before deletion
  Properties:
    # ...

MyS3Bucket:
  Type: AWS::S3::Bucket
  DeletionPolicy: Retain  # Keep bucket when stack deleted
  Properties:
    # ...
```

### 5. Use Change Sets for Updates

```
Never update production directly
Always create change set, review, then execute
```

### 6. Tag Everything

```yaml
Tags:
  - Key: Environment
    Value: !Ref Environment
  - Key: CostCenter
    Value: Engineering
  - Key: ManagedBy
    Value: CloudFormation
```

### 7. Version Templates

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'My Application v2.1.0'
Metadata:
  Version: '2.1.0'
  LastModified: '2026-01-31'
  Author: 'DevOps Team'
```

### 8. Use Linting

```bash
# cfn-lint (Python tool)
pip install cfn-lint
cfn-lint template.yaml

# Checks for:
# - Syntax errors
# - Best practice violations
# - Invalid property values
```

### 9. Organize Large Templates

```
Use nested stacks:
  - network.yaml (VPC, subnets, routing)
  - security.yaml (security groups, NACLs)
  - compute.yaml (EC2, Auto Scaling)
  - database.yaml (RDS, DynamoDB)
  - main.yaml (orchestrates all)
```

### 10. Handle Secrets Securely

```yaml
# Don't hardcode secrets
Parameters:
  DBPassword:
    Type: String
    NoEcho: true  # Hide in console

# Or use Secrets Manager
DBPasswordSecret:
  Type: AWS::SecretsManager::Secret
  Properties:
    GenerateSecretString:
      PasswordLength: 16

MyDB:
  Type: AWS::RDS::DBInstance
  Properties:
    MasterUserPassword: !Sub '{{resolve:secretsmanager:${DBPasswordSecret}:SecretString}}'
```

## Advanced Features

### Stack Policies

**What**: Prevent unintentional updates to critical resources

**Example**:
```json
{
  "Statement": [
    {
      "Effect": "Deny",
      "Principal": "*",
      "Action": "Update:*",
      "Resource": "LogicalResourceId/ProductionDatabase"
    },
    {
      "Effect": "Allow",
      "Principal": "*",
      "Action": "Update:*",
      "Resource": "*"
    }
  ]
}
```

**Result**: ProductionDatabase cannot be updated (protected)

### Termination Protection

**What**: Prevent accidental stack deletion

**Enable**:
```bash
aws cloudformation update-termination-protection \
  --stack-name my-stack \
  --enable-termination-protection
```

**Result**: Must disable protection before deleting stack

### Stack Notifications

**What**: SNS notifications for stack events

**Setup**:
```bash
aws cloudformation create-stack \
  --stack-name my-stack \
  --template-body file://template.yaml \
  --notification-arns arn:aws:sns:us-east-1:123456789012:stack-notifications
```

**Events**:
- CREATE_IN_PROGRESS, CREATE_COMPLETE, CREATE_FAILED
- UPDATE_IN_PROGRESS, UPDATE_COMPLETE, UPDATE_FAILED
- DELETE_IN_PROGRESS, DELETE_COMPLETE, DELETE_FAILED

### Rollback Configuration

**What**: Monitor alarms during stack operations, rollback on alarm

**Example**:
```yaml
# CloudFormation rollback trigger
RollbackConfiguration:
  MonitoringTimeInMinutes: 5
  RollbackTriggers:
    - Arn: !GetAtt HighErrorRateAlarm.Arn
      Type: AWS::CloudWatch::Alarm

Resources:
  HighErrorRateAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      MetricName: 5XXError
      Threshold: 10
      ComparisonOperator: GreaterThanThreshold
```

**Behavior**:
- Deploy stack/update
- Monitor alarm for 5 minutes
- If alarm triggers: Rollback changes
- If no alarm: Complete successfully

### Dynamic References

**Secrets Manager**:
```yaml
DBPassword: !Sub '{{resolve:secretsmanager:${SecretArn}:SecretString:password}}'
```

**Systems Manager Parameter Store**:
```yaml
LatestAMI: !Sub '{{resolve:ssm:/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2}}'
```

**Benefits**:
- No hardcoded secrets
- Always latest values
- Secure retrieval

## Real-World Scenarios

### Scenario 1: Multi-Tier Web Application

**Requirements**:
- VPC with public/private subnets
- Application Load Balancer
- EC2 Auto Scaling group
- RDS MySQL database
- S3 bucket for static assets

**Template Structure**:
```yaml
Parameters:
  Environment:
    Type: String
    AllowedValues: [dev, staging, production]
  
  KeyName:
    Type: AWS::EC2::KeyPair::KeyName

Mappings:
  EnvironmentConfig:
    dev:
      InstanceType: t3.micro
      MinSize: 1
      MaxSize: 2
      DBClass: db.t3.micro
    production:
      InstanceType: t3.large
      MinSize: 2
      MaxSize: 10
      DBClass: db.r5.large

Resources:
  # VPC
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      Tags:
        - Key: Name
          Value: !Sub '${Environment}-vpc'
  
  # Public Subnets
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.1.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
  
  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.2.0/24
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
  
  # Private Subnets
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.11.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
  
  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.12.0/24
      AvailabilityZone: !Select [1, !GetAZs '']
  
  # Internet Gateway
  InternetGateway:
    Type: AWS::EC2::InternetGateway
  
  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway
  
  # Application Load Balancer
  ALB:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      SecurityGroups:
        - !Ref ALBSecurityGroup
  
  ALBListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      LoadBalancerArn: !Ref ALB
      Port: 80
      Protocol: HTTP
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref TargetGroup
  
  TargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      VpcId: !Ref VPC
      Port: 80
      Protocol: HTTP
      HealthCheckPath: /health
  
  # Auto Scaling Group
  LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateData:
        ImageId: !Sub '{{resolve:ssm:/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2}}'
        InstanceType: !FindInMap [EnvironmentConfig, !Ref Environment, InstanceType]
        KeyName: !Ref KeyName
        SecurityGroupIds:
          - !Ref InstanceSecurityGroup
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            yum update -y
            yum install -y httpd
            systemctl start httpd
            systemctl enable httpd
            echo "<h1>Hello from ${Environment}</h1>" > /var/www/html/index.html
  
  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      VPCZoneIdentifier:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      LaunchTemplate:
        LaunchTemplateId: !Ref LaunchTemplate
        Version: !GetAtt LaunchTemplate.LatestVersionNumber
      MinSize: !FindInMap [EnvironmentConfig, !Ref Environment, MinSize]
      MaxSize: !FindInMap [EnvironmentConfig, !Ref Environment, MaxSize]
      DesiredCapacity: !FindInMap [EnvironmentConfig, !Ref Environment, MinSize]
      TargetGroupARNs:
        - !Ref TargetGroup
  
  # RDS Database
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: Subnet group for RDS
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
  
  Database:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Snapshot
    Properties:
      Engine: mysql
      DBInstanceClass: !FindInMap [EnvironmentConfig, !Ref Environment, DBClass]
      AllocatedStorage: 20
      MasterUsername: admin
      MasterUserPassword: !Sub '{{resolve:secretsmanager:${DBSecret}:SecretString:password}}'
      DBSubnetGroupName: !Ref DBSubnetGroup
      VPCSecurityGroups:
        - !Ref DBSecurityGroup
      MultiAZ: !If [IsProduction, true, false]
  
  DBSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      GenerateSecretString:
        PasswordLength: 16
        ExcludeCharacters: '"@/\'
  
  # S3 Bucket
  StaticAssetsBucket:
    Type: AWS::S3::Bucket
    DeletionPolicy: Retain
    Properties:
      BucketName: !Sub '${AWS::StackName}-static-assets'
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true

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
  
  InstanceSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Instance Security Group
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref ALBSecurityGroup
  
  DBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Database Security Group
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref InstanceSecurityGroup

Conditions:
  IsProduction: !Equals [!Ref Environment, production]

Outputs:
  ALBEndpoint:
    Description: Application Load Balancer DNS
    Value: !GetAtt ALB.DNSName
  
  DatabaseEndpoint:
    Description: RDS Database Endpoint
    Value: !GetAtt Database.Endpoint.Address
  
  S3BucketName:
    Description: S3 Bucket for static assets
    Value: !Ref StaticAssetsBucket
```

**Deployment**:
```bash
# Development
aws cloudformation create-stack \
  --stack-name dev-webapp \
  --template-body file://webapp.yaml \
  --parameters ParameterKey=Environment,ParameterValue=dev \
               ParameterKey=KeyName,ParameterValue=my-key

# Production
aws cloudformation create-stack \
  --stack-name prod-webapp \
  --template-body file://webapp.yaml \
  --parameters ParameterKey=Environment,ParameterValue=production \
               ParameterKey=KeyName,ParameterValue=prod-key
```

### Scenario 2: Multi-Account Deployment with StackSets

**Requirements**:
- Deploy security baseline to all accounts
- CloudTrail, Config, GuardDuty
- Same configuration everywhere

**Template** (security-baseline.yaml):
```yaml
Resources:
  CloudTrailBucket:
    Type: AWS::S3::Bucket
    DeletionPolicy: Retain
    Properties:
      BucketName: !Sub 'cloudtrail-${AWS::AccountId}-${AWS::Region}'
  
  CloudTrail:
    Type: AWS::CloudTrail::Trail
    DependsOn: CloudTrailBucketPolicy
    Properties:
      S3BucketName: !Ref CloudTrailBucket
      IsLogging: true
      IsMultiRegionTrail: true
      IncludeGlobalServiceEvents: true
  
  ConfigRecorder:
    Type: AWS::Config::ConfigurationRecorder
    Properties:
      RoleArn: !GetAtt ConfigRole.Arn
      RecordingGroup:
        AllSupported: true
        IncludeGlobalResourceTypes: true
  
  GuardDutyDetector:
    Type: AWS::GuardDuty::Detector
    Properties:
      Enable: true
```

**StackSet Deployment**:
```bash
# Create StackSet
aws cloudformation create-stack-set \
  --stack-set-name security-baseline \
  --template-body file://security-baseline.yaml \
  --permission-model SERVICE_MANAGED \
  --auto-deployment Enabled=true,RetainStacksOnAccountRemoval=false

# Deploy to all accounts in organization
aws cloudformation create-stack-instances \
  --stack-set-name security-baseline \
  --deployment-targets OrganizationalUnitIds=ou-xxxx-yyyyyyyy \
  --regions us-east-1 eu-west-1 ap-southeast-1
```

### Scenario 3: Blue/Green Deployment

**Requirements**:
- Zero-downtime deployment
- Quick rollback
- Route 53 weighted routing

**Blue Stack** (current production):
```yaml
# blue-stack.yaml
Resources:
  # Application resources with tag "Environment: blue"
```

**Green Stack** (new version):
```yaml
# green-stack.yaml
Resources:
  # Application resources with tag "Environment: green"
```

**DNS Stack** (controls traffic):
```yaml
Parameters:
  BlueWeight:
    Type: Number
    Default: 100
  GreenWeight:
    Type: Number
    Default: 0

Resources:
  DNSRecord:
    Type: AWS::Route53::RecordSet
    Properties:
      HostedZoneId: Z1234567890ABC
      Name: app.example.com
      Type: A
      SetIdentifier: Blue
      Weight: !Ref BlueWeight
      AliasTarget:
        HostedZoneId: !GetAtt BlueALB.CanonicalHostedZoneID
        DNSName: !GetAtt BlueALB.DNSName
  
  GreenDNSRecord:
    Type: AWS::Route53::RecordSet
    Properties:
      HostedZoneId: Z1234567890ABC
      Name: app.example.com
      Type: A
      SetIdentifier: Green
      Weight: !Ref GreenWeight
      AliasTarget:
        HostedZoneId: !GetAtt GreenALB.CanonicalHostedZoneID
        DNSName: !GetAtt GreenALB.DNSName
```

**Deployment Process**:
```bash
# 1. Deploy green stack
aws cloudformation create-stack \
  --stack-name green-stack \
  --template-body file://green-stack.yaml

# 2. Update DNS to route 10% traffic to green
aws cloudformation update-stack \
  --stack-name dns-stack \
  --template-body file://dns-stack.yaml \
  --parameters ParameterKey=BlueWeight,ParameterValue=90 \
               ParameterKey=GreenWeight,ParameterValue=10

# 3. Monitor metrics, gradually increase green traffic
# 50/50
aws cloudformation update-stack --stack-name dns-stack \
  --parameters BlueWeight=50 GreenWeight=50

# 100% green
aws cloudformation update-stack --stack-name dns-stack \
  --parameters BlueWeight=0 GreenWeight=100

# 4. Delete blue stack (or keep for quick rollback)
aws cloudformation delete-stack --stack-name blue-stack
```

## Exam Tips (SAP-C02)

### Key Decision Points

**When to Use CloudFormation**:
```
Infrastructure as Code needed → CloudFormation
Repeatable environments → CloudFormation
Multi-region/account deployment → StackSets
Complex dependencies → CloudFormation (automatic ordering)
```

**Template Organization**:
```
Small/simple → Single template
Large/complex → Nested stacks
Reusable components → Nested stacks
Multi-account → StackSets
```

**Update Safety**:
```
Production changes → Use change sets
Critical resources → Stack policies
Accidental deletion → Termination protection
Database/storage → DeletionPolicy: Snapshot/Retain
```

**Dependencies**:
```
Resource references (!Ref, !GetAtt) → Implicit dependency (automatic)
No reference but order matters → DependsOn (explicit)
Cross-stack → Outputs + !ImportValue
```

### Common Scenarios

**"Need to update production safely"**:
- Create change set
- Review changes (especially replacements)
- Execute change set or cancel

**"Resource updated outside CloudFormation"**:
- Detect drift
- Update template to match reality
- Or update resource to match template

**"Deploy to multiple accounts"**:
- Use StackSets
- AWS Organizations integration
- Service-managed permissions

**"Stack creation failed, rollback"**:
- Default behavior: Rollback (delete all resources)
- Option: Disable rollback (for debugging)
- Fix template, retry

**"Need custom resource CloudFormation doesn't support"**:
- Lambda-backed custom resource
- Implement Create, Update, Delete logic
- Send success/failure response

**"Circular dependency error"**:
- Security group A references B, B references A
- Solution: Create both first, then add ingress rules separately

**"Prevent accidental deletion of database"**:
- DeletionPolicy: Snapshot (RDS, DynamoDB)
- DeletionPolicy: Retain (S3, EBS)
- Termination protection on stack

This comprehensive CloudFormation guide covers all aspects for SAP-C02 exam success.
