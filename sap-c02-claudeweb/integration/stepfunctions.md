# AWS Step Functions

## What is Step Functions?

AWS Step Functions is a serverless orchestration service that lets you coordinate multiple AWS services into serverless workflows. You define workflows as state machines using Amazon States Language (ASL), a JSON-based language.

## Why Use Step Functions?

### Key Benefits
- **Visual Workflows**: See your workflow in real-time
- **Serverless**: No servers to manage
- **Reliable**: Built-in error handling and retry logic
- **Scalable**: Handles thousands of executions in parallel
- **Integrated**: Works with Lambda, ECS, SNS, SQS, DynamoDB, Batch, etc.
- **Auditable**: Complete execution history
- **Low Cost**: Pay per state transition

### Use Cases
- Order processing workflows
- ETL (Extract, Transform, Load) pipelines
- Machine learning workflows
- Long-running batch jobs
- Human approval workflows
- Microservices orchestration
- Saga pattern (distributed transactions)

## Core Concepts

### State Machines

**What**: Workflow definition using Amazon States Language (ASL)

**Types**:
- **Standard**: Long-running (up to 1 year), exactly-once execution
- **Express**: Short-lived (up to 5 minutes), at-least-once execution

**Standard vs Express**:

| Feature | Standard | Express |
|---------|----------|---------|
| Max duration | 1 year | 5 minutes |
| Execution semantics | Exactly-once | At-least-once |
| Execution history | Full | CloudWatch Logs |
| Execution rate | 2,000/sec | 100,000/sec |
| Pricing | Per state transition | Per execution + duration |
| Use case | Long workflows, audit trail | High-volume, short workflows |

**Creating State Machine**:
```python
import boto3
import json

stepfunctions = boto3.client('stepfunctions')

definition = {
    "Comment": "A simple workflow",
    "StartAt": "HelloWorld",
    "States": {
        "HelloWorld": {
            "Type": "Task",
            "Resource": "arn:aws:lambda:us-east-1:123456789012:function:HelloWorld",
            "End": True
        }
    }
}

response = stepfunctions.create_state_machine(
    name='MyStateMachine',
    definition=json.dumps(definition),
    roleArn='arn:aws:iam::123456789012:role/StepFunctionsRole',
    type='STANDARD'  # or 'EXPRESS'
)

state_machine_arn = response['stateMachineArn']
```

### States

**Types**:
1. **Task**: Execute work (Lambda, ECS, etc.)
2. **Choice**: Conditional branching
3. **Parallel**: Execute branches in parallel
4. **Wait**: Delay for time period
5. **Succeed**: Successful termination
6. **Fail**: Failed termination
7. **Pass**: Pass input to output (testing)
8. **Map**: Iterate over array

### Amazon States Language (ASL)

**Basic Structure**:
```json
{
  "Comment": "Description of state machine",
  "StartAt": "FirstState",
  "States": {
    "FirstState": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:...",
      "Next": "SecondState"
    },
    "SecondState": {
      "Type": "Succeed"
    }
  }
}
```

## State Types in Detail

### Task State

**Lambda Function**:
```json
{
  "ProcessOrder": {
    "Type": "Task",
    "Resource": "arn:aws:states:::lambda:invoke",
    "Parameters": {
      "FunctionName": "arn:aws:lambda:us-east-1:123456789012:function:ProcessOrder",
      "Payload": {
        "orderId.$": "$.orderId",
        "customerId.$": "$.customerId"
      }
    },
    "Retry": [
      {
        "ErrorEquals": ["States.TaskFailed"],
        "IntervalSeconds": 2,
        "MaxAttempts": 3,
        "BackoffRate": 2
      }
    ],
    "Catch": [
      {
        "ErrorEquals": ["States.ALL"],
        "Next": "HandleError"
      }
    ],
    "Next": "OrderComplete"
  }
}
```

**ECS Task**:
```json
{
  "RunBatchJob": {
    "Type": "Task",
    "Resource": "arn:aws:states:::ecs:runTask.sync",
    "Parameters": {
      "LaunchType": "FARGATE",
      "Cluster": "arn:aws:ecs:us-east-1:123456789012:cluster/my-cluster",
      "TaskDefinition": "arn:aws:ecs:us-east-1:123456789012:task-definition/my-task:1",
      "NetworkConfiguration": {
        "AwsvpcConfiguration": {
          "Subnets": ["subnet-12345"],
          "SecurityGroups": ["sg-12345"],
          "AssignPublicIp": "ENABLED"
        }
      }
    },
    "Next": "JobComplete"
  }
}
```

**DynamoDB PutItem**:
```json
{
  "SaveToDynamoDB": {
    "Type": "Task",
    "Resource": "arn:aws:states:::dynamodb:putItem",
    "Parameters": {
      "TableName": "Orders",
      "Item": {
        "orderId": {
          "S.$": "$.orderId"
        },
        "status": {
          "S": "PROCESSED"
        },
        "timestamp": {
          "N.$": "$.timestamp"
        }
      }
    },
    "Next": "Complete"
  }
}
```

**SNS Publish**:
```json
{
  "SendNotification": {
    "Type": "Task",
    "Resource": "arn:aws:states:::sns:publish",
    "Parameters": {
      "TopicArn": "arn:aws:sns:us-east-1:123456789012:order-notifications",
      "Message": {
        "orderId.$": "$.orderId",
        "status": "completed"
      },
      "Subject": "Order Completed"
    },
    "Next": "Done"
  }
}
```

**SQS SendMessage**:
```json
{
  "QueueTask": {
    "Type": "Task",
    "Resource": "arn:aws:states:::sqs:sendMessage",
    "Parameters": {
      "QueueUrl": "https://sqs.us-east-1.amazonaws.com/123456789012/my-queue",
      "MessageBody": {
        "orderId.$": "$.orderId",
        "action": "process"
      }
    },
    "Next": "WaitForProcessing"
  }
}
```

**Batch Job**:
```json
{
  "SubmitBatchJob": {
    "Type": "Task",
    "Resource": "arn:aws:states:::batch:submitJob.sync",
    "Parameters": {
      "JobDefinition": "arn:aws:batch:us-east-1:123456789012:job-definition/my-job:1",
      "JobName": "MyBatchJob",
      "JobQueue": "arn:aws:batch:us-east-1:123456789012:job-queue/my-queue",
      "Parameters": {
        "inputFile.$": "$.inputFile"
      }
    },
    "Next": "JobComplete"
  }
}
```

### Choice State

**Conditional Branching**:
```json
{
  "CheckOrderValue": {
    "Type": "Choice",
    "Choices": [
      {
        "Variable": "$.orderValue",
        "NumericGreaterThan": 1000,
        "Next": "HighValueOrder"
      },
      {
        "Variable": "$.orderValue",
        "NumericGreaterThan": 100,
        "Next": "MediumValueOrder"
      },
      {
        "Variable": "$.orderType",
        "StringEquals": "express",
        "Next": "ExpressShipping"
      }
    ],
    "Default": "StandardProcessing"
  }
}
```

**Operators**:
```json
{
  "Choices": [
    {"Variable": "$.value", "NumericEquals": 100},
    {"Variable": "$.value", "NumericLessThan": 50},
    {"Variable": "$.value", "NumericGreaterThanEquals": 200},
    {"Variable": "$.name", "StringEquals": "test"},
    {"Variable": "$.status", "StringMatches": "PENDING_*"},
    {"Variable": "$.active", "BooleanEquals": true},
    {"Variable": "$.timestamp", "TimestampGreaterThan": "2026-01-01T00:00:00Z"},
    {"Variable": "$.tags", "IsPresent": true},
    {"Variable": "$.error", "IsNull": false}
  ]
}
```

**And/Or/Not**:
```json
{
  "Choices": [
    {
      "And": [
        {"Variable": "$.orderValue", "NumericGreaterThan": 100},
        {"Variable": "$.customerType", "StringEquals": "premium"}
      ],
      "Next": "PremiumProcessing"
    },
    {
      "Or": [
        {"Variable": "$.priority", "StringEquals": "high"},
        {"Variable": "$.expressShipping", "BooleanEquals": true}
      ],
      "Next": "FastTrack"
    },
    {
      "Not": {
        "Variable": "$.cancelled",
        "BooleanEquals": true
      },
      "Next": "ProcessOrder"
    }
  ]
}
```

### Parallel State

**Execute Branches Simultaneously**:
```json
{
  "ProcessInParallel": {
    "Type": "Parallel",
    "Branches": [
      {
        "StartAt": "ValidatePayment",
        "States": {
          "ValidatePayment": {
            "Type": "Task",
            "Resource": "arn:aws:lambda:...:function:ValidatePayment",
            "End": true
          }
        }
      },
      {
        "StartAt": "CheckInventory",
        "States": {
          "CheckInventory": {
            "Type": "Task",
            "Resource": "arn:aws:lambda:...:function:CheckInventory",
            "End": true
          }
        }
      },
      {
        "StartAt": "CalculateShipping",
        "States": {
          "CalculateShipping": {
            "Type": "Task",
            "Resource": "arn:aws:lambda:...:function:CalculateShipping",
            "End": true
          }
        }
      }
    ],
    "Next": "CombineResults"
  }
}
```

**Output**: Array of results from all branches
```json
[
  {"paymentValid": true},
  {"inStock": true, "quantity": 10},
  {"shippingCost": 5.99, "estimatedDays": 3}
]
```

### Wait State

**Fixed Duration**:
```json
{
  "Wait30Seconds": {
    "Type": "Wait",
    "Seconds": 30,
    "Next": "ContinueProcessing"
  }
}
```

**Until Timestamp**:
```json
{
  "WaitUntilDeadline": {
    "Type": "Wait",
    "Timestamp": "2026-01-31T23:59:59Z",
    "Next": "ProcessBatch"
  }
}
```

**Dynamic Wait** (from input):
```json
{
  "DynamicWait": {
    "Type": "Wait",
    "SecondsPath": "$.waitDuration",
    "Next": "Continue"
  }
}
```

**Timestamp from Input**:
```json
{
  "WaitUntilTime": {
    "Type": "Wait",
    "TimestampPath": "$.scheduledTime",
    "Next": "Execute"
  }
}
```

### Map State

**Iterate Over Array**:
```json
{
  "ProcessItems": {
    "Type": "Map",
    "ItemsPath": "$.items",
    "MaxConcurrency": 10,
    "Iterator": {
      "StartAt": "ProcessItem",
      "States": {
        "ProcessItem": {
          "Type": "Task",
          "Resource": "arn:aws:lambda:...:function:ProcessSingleItem",
          "End": true
        }
      }
    },
    "Next": "AllItemsProcessed"
  }
}
```

**Input**:
```json
{
  "items": [
    {"id": 1, "name": "item1"},
    {"id": 2, "name": "item2"},
    {"id": 3, "name": "item3"}
  ]
}
```

**Each Iteration** receives individual item:
```json
{"id": 1, "name": "item1"}
```

**Output**: Array of results
```json
[
  {"processed": true, "id": 1},
  {"processed": true, "id": 2},
  {"processed": true, "id": 3}
]
```

**Distributed Map** (Large-scale processing):
```json
{
  "ProcessLargeDataset": {
    "Type": "Map",
    "ItemReader": {
      "Resource": "arn:aws:states:::s3:listObjectsV2",
      "Parameters": {
        "Bucket": "my-data-bucket",
        "Prefix": "input/"
      }
    },
    "ItemProcessor": {
      "ProcessorConfig": {
        "Mode": "DISTRIBUTED",
        "ExecutionType": "STANDARD"
      },
      "StartAt": "ProcessFile",
      "States": {
        "ProcessFile": {
          "Type": "Task",
          "Resource": "arn:aws:states:::lambda:invoke",
          "Parameters": {
            "FunctionName": "ProcessFile",
            "Payload": {
              "key.$": "$.Key"
            }
          },
          "End": true
        }
      }
    },
    "MaxConcurrency": 1000,
    "Next": "Complete"
  }
}
```

## Error Handling

### Retry

**Configuration**:
```json
{
  "CallAPI": {
    "Type": "Task",
    "Resource": "arn:aws:lambda:...:function:CallExternalAPI",
    "Retry": [
      {
        "ErrorEquals": ["Timeout", "NetworkError"],
        "IntervalSeconds": 1,
        "MaxAttempts": 3,
        "BackoffRate": 2
      },
      {
        "ErrorEquals": ["RateLimitExceeded"],
        "IntervalSeconds": 5,
        "MaxAttempts": 5,
        "BackoffRate": 1.5
      },
      {
        "ErrorEquals": ["States.ALL"],
        "IntervalSeconds": 2,
        "MaxAttempts": 2,
        "BackoffRate": 1
      }
    ],
    "Next": "Success"
  }
}
```

**Backoff Calculation**:
```
Attempt 1: IntervalSeconds × 1 = 1 second
Attempt 2: IntervalSeconds × BackoffRate = 2 seconds
Attempt 3: IntervalSeconds × BackoffRate² = 4 seconds
```

**Predefined Error Codes**:
- `States.ALL`: All errors
- `States.Timeout`: Task timeout
- `States.TaskFailed`: Task execution failed
- `States.Permissions`: Insufficient permissions

### Catch

**Error Handling**:
```json
{
  "ProcessPayment": {
    "Type": "Task",
    "Resource": "arn:aws:lambda:...:function:ProcessPayment",
    "Catch": [
      {
        "ErrorEquals": ["PaymentDeclined"],
        "ResultPath": "$.error",
        "Next": "PaymentDeclined"
      },
      {
        "ErrorEquals": ["InsufficientFunds"],
        "ResultPath": "$.error",
        "Next": "NotifyCustomer"
      },
      {
        "ErrorEquals": ["States.ALL"],
        "ResultPath": "$.error",
        "Next": "HandleGenericError"
      }
    ],
    "Next": "PaymentSuccess"
  }
}
```

**ResultPath**: Where to store error information
```json
{
  "orderId": "12345",
  "error": {
    "Error": "PaymentDeclined",
    "Cause": "Card was declined by issuer"
  }
}
```

## Input/Output Processing

### InputPath

**Select Portion of Input**:
```json
{
  "ProcessOrder": {
    "Type": "Task",
    "Resource": "arn:aws:lambda:...",
    "InputPath": "$.order",
    "Next": "Complete"
  }
}
```

**Input**:
```json
{
  "customer": {"id": "CUST-001"},
  "order": {"id": "ORD-123", "total": 99.99}
}
```

**Task Receives** (only order):
```json
{"id": "ORD-123", "total": 99.99}
```

### OutputPath

**Select Portion of Output**:
```json
{
  "GetUserDetails": {
    "Type": "Task",
    "Resource": "arn:aws:lambda:...",
    "OutputPath": "$.user",
    "Next": "ProcessUser"
  }
}
```

**Task Returns**:
```json
{
  "statusCode": 200,
  "user": {"id": "USER-001", "name": "John"}
}
```

**Next State Receives** (only user):
```json
{"id": "USER-001", "name": "John"}
```

### ResultPath

**Where to Put Task Result**:

**Replace Entire Input** (default: `$`):
```json
{
  "ResultPath": "$"
}
```

**Add to Input** (merge):
```json
{
  "ResultPath": "$.taskResult"
}
```

**Input**:
```json
{"orderId": "123"}
```

**Task Returns**:
```json
{"status": "processed", "total": 99.99}
```

**Output**:
```json
{
  "orderId": "123",
  "taskResult": {
    "status": "processed",
    "total": 99.99
  }
}
```

**Discard Result** (keep original input):
```json
{
  "ResultPath": null
}
```

### Parameters

**Transform Input to Task**:
```json
{
  "InvokeFunction": {
    "Type": "Task",
    "Resource": "arn:aws:states:::lambda:invoke",
    "Parameters": {
      "FunctionName": "ProcessOrder",
      "Payload": {
        "orderId.$": "$.order.id",
        "customerId.$": "$.customer.id",
        "timestamp.$": "$$.Execution.StartTime",
        "staticValue": "constant"
      }
    },
    "Next": "Complete"
  }
}
```

**Context Object** (`$$`):
- `$$.Execution.Id`: Execution ID
- `$$.Execution.StartTime`: Start timestamp
- `$$.State.Name`: Current state name
- `$$.StateMachine.Id`: State machine ID

## Service Integrations

### Optimized Integrations

**Request-Response** (default):
```json
{
  "Resource": "arn:aws:states:::lambda:invoke"
}
```

**Wait for Callback** (.waitForTaskToken):
```json
{
  "SendApprovalRequest": {
    "Type": "Task",
    "Resource": "arn:aws:states:::lambda:invoke.waitForTaskToken",
    "Parameters": {
      "FunctionName": "SendApprovalEmail",
      "Payload": {
        "taskToken.$": "$$.Task.Token",
        "orderId.$": "$.orderId"
      }
    },
    "TimeoutSeconds": 3600,
    "Next": "ProcessApproval"
  }
}
```

**Callback from Lambda**:
```python
import boto3

stepfunctions = boto3.client('stepfunctions')

def approve_order(event, context):
    task_token = event['taskToken']
    order_id = event['orderId']
    
    # Send approval email...
    # Wait for user to click link...
    # User approves
    
    stepfunctions.send_task_success(
        taskToken=task_token,
        output='{"approved": true}'
    )
```

**Synchronous** (.sync):
```json
{
  "RunECSTask": {
    "Type": "Task",
    "Resource": "arn:aws:states:::ecs:runTask.sync",
    "Parameters": {
      "Cluster": "my-cluster",
      "TaskDefinition": "my-task"
    },
    "Next": "TaskComplete"
  }
}
```

**Supported Services**:
- Lambda
- ECS/Fargate (run task)
- Batch (submit job)
- DynamoDB (get/put/update/delete item)
- SNS (publish)
- SQS (send message)
- Glue (start job run)
- SageMaker (create training job, transform job)
- Step Functions (start execution)
- EventBridge (put events)

## Workflow Patterns

### Sequential Processing

```json
{
  "StartAt": "Step1",
  "States": {
    "Step1": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:...:function:Step1",
      "Next": "Step2"
    },
    "Step2": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:...:function:Step2",
      "Next": "Step3"
    },
    "Step3": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:...:function:Step3",
      "End": true
    }
  }
}
```

### Parallel Execution with Aggregation

```json
{
  "StartAt": "ParallelProcessing",
  "States": {
    "ParallelProcessing": {
      "Type": "Parallel",
      "Branches": [
        {
          "StartAt": "Branch1",
          "States": {
            "Branch1": {
              "Type": "Task",
              "Resource": "arn:aws:lambda:...:function:Process1",
              "End": true
            }
          }
        },
        {
          "StartAt": "Branch2",
          "States": {
            "Branch2": {
              "Type": "Task",
              "Resource": "arn:aws:lambda:...:function:Process2",
              "End": true
            }
          }
        }
      ],
      "Next": "AggregateResults"
    },
    "AggregateResults": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:...:function:Aggregate",
      "End": true
    }
  }
}
```

### Try-Catch-Finally

```json
{
  "StartAt": "TryBlock",
  "States": {
    "TryBlock": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:...:function:MainLogic",
      "Catch": [
        {
          "ErrorEquals": ["States.ALL"],
          "ResultPath": "$.error",
          "Next": "CatchBlock"
        }
      ],
      "Next": "FinallyBlock"
    },
    "CatchBlock": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:...:function:HandleError",
      "Next": "FinallyBlock"
    },
    "FinallyBlock": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:...:function:Cleanup",
      "End": true
    }
  }
}
```

### Human Approval Workflow

```json
{
  "StartAt": "SubmitRequest",
  "States": {
    "SubmitRequest": {
      "Type": "Task",
      "Resource": "arn:aws:states:::lambda:invoke",
      "Parameters": {
        "FunctionName": "SubmitApproval",
        "Payload": {
          "request.$": "$.request"
        }
      },
      "Next": "WaitForApproval"
    },
    "WaitForApproval": {
      "Type": "Task",
      "Resource": "arn:aws:states:::lambda:invoke.waitForTaskToken",
      "Parameters": {
        "FunctionName": "SendApprovalEmail",
        "Payload": {
          "taskToken.$": "$$.Task.Token",
          "request.$": "$.request"
        }
      },
      "TimeoutSeconds": 86400,
      "Catch": [
        {
          "ErrorEquals": ["States.Timeout"],
          "Next": "ApprovalTimeout"
        }
      ],
      "Next": "ProcessApproved"
    },
    "ProcessApproved": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:...:function:ProcessRequest",
      "End": true
    },
    "ApprovalTimeout": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:...:function:NotifyTimeout",
      "Next": "RequestDenied"
    },
    "RequestDenied": {
      "Type": "Fail",
      "Error": "ApprovalTimeout",
      "Cause": "Request timed out waiting for approval"
    }
  }
}
```

### Saga Pattern (Distributed Transaction)

```json
{
  "StartAt": "ReserveInventory",
  "States": {
    "ReserveInventory": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:...:function:ReserveInventory",
      "Catch": [{
        "ErrorEquals": ["States.ALL"],
        "Next": "ReserveFailed"
      }],
      "Next": "ChargePayment"
    },
    "ChargePayment": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:...:function:ChargePayment",
      "Catch": [{
        "ErrorEquals": ["States.ALL"],
        "Next": "CompensateInventory"
      }],
      "Next": "CreateShipment"
    },
    "CreateShipment": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:...:function:CreateShipment",
      "Catch": [{
        "ErrorEquals": ["States.ALL"],
        "Next": "CompensatePayment"
      }],
      "Next": "Success"
    },
    "CompensatePayment": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:...:function:RefundPayment",
      "Next": "CompensateInventory"
    },
    "CompensateInventory": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:...:function:ReleaseInventory",
      "Next": "ReserveFailed"
    },
    "ReserveFailed": {
      "Type": "Fail",
      "Error": "OrderFailed",
      "Cause": "Failed to complete order"
    },
    "Success": {
      "Type": "Succeed"
    }
  }
}
```

## Monitoring and Debugging

### Execution History

**View Execution**:
```python
response = stepfunctions.describe_execution(
    executionArn='arn:aws:states:us-east-1:123456789012:execution:MyStateMachine:exec-123'
)

print(response['status'])  # RUNNING, SUCCEEDED, FAILED, TIMED_OUT, ABORTED
print(response['input'])
print(response['output'])
```

**Execution Events**:
```python
response = stepfunctions.get_execution_history(
    executionArn=execution_arn,
    maxResults=100
)

for event in response['events']:
    print(event['type'], event['timestamp'])
```

### CloudWatch Logs (Express Workflows)

**Enable Logging**:
```python
response = stepfunctions.create_state_machine(
    name='MyExpressWorkflow',
    definition=definition_json,
    roleArn=role_arn,
    type='EXPRESS',
    loggingConfiguration={
        'level': 'ALL',  # or 'ERROR', 'FATAL', 'OFF'
        'includeExecutionData': True,
        'destinations': [
            {
                'cloudWatchLogsLogGroup': {
                    'logGroupArn': 'arn:aws:logs:us-east-1:123456789012:log-group:/aws/stepfunctions/MyExpressWorkflow'
                }
            }
        ]
    }
)
```

### CloudWatch Metrics

**Metrics**:
- `ExecutionsFailed`: Number of failed executions
- `ExecutionsSucceeded`: Number of successful executions
- `ExecutionsTimedOut`: Number of timed-out executions
- `ExecutionTime`: Duration of executions
- `ExecutionThrottled`: Number of throttled executions

**Alarms**:
```python
cloudwatch = boto3.client('cloudwatch')

cloudwatch.put_metric_alarm(
    AlarmName='StepFunctions-High-Failure-Rate',
    MetricName='ExecutionsFailed',
    Namespace='AWS/States',
    Statistic='Sum',
    Period=300,
    EvaluationPeriods=1,
    Threshold=10,
    ComparisonOperator='GreaterThanThreshold',
    Dimensions=[
        {'Name': 'StateMachineArn', 'Value': state_machine_arn}
    ],
    AlarmActions=[sns_topic_arn]
)
```

### X-Ray Tracing

**Enable**:
```python
response = stepfunctions.create_state_machine(
    name='MyStateMachine',
    definition=definition_json,
    roleArn=role_arn,
    tracingConfiguration={
        'enabled': True
    }
)
```

**View Traces**: X-Ray service map shows workflow execution path

## Cost Optimization

### Pricing

**Standard Workflows**:
- State transitions: $0.025 per 1,000 transitions
- First 4,000 transitions/month: Free

**Express Workflows**:
- Requests: $1.00 per 1M requests
- Duration: $0.00001667 per GB-second
- First 1M requests/month: Free

**Example Costs**:

**Standard Workflow** (10,000 executions/month, 5 states each):
```
Transitions: 10,000 × 5 = 50,000
Billable: 50,000 - 4,000 (free) = 46,000
Cost: 46,000 / 1,000 × $0.025 = $1.15/month
```

**Express Workflow** (1M executions/month, 100ms each, 128 MB):
```
Requests: 1M (free tier)
Duration: 1M × 0.1s × 0.128 GB = 12,800 GB-seconds
Cost: 12,800 × $0.00001667 = $0.21/month
Total: $0.21/month
```

### Optimization Tips

**1. Use Express for High-Volume, Short Workflows**:
```
>1,000 executions/second → Express
Short duration (<5 min) → Express
```

**2. Minimize State Transitions**:
```
Bad: Many small states (10+ transitions)
Good: Combine logic (fewer transitions)
```

**3. Use Parallel State for Independent Tasks**:
```
Sequential: 5 transitions
Parallel: 3 transitions (start, branches, end)
```

**4. Batch Processing with Map State**:
```
Instead of: 1,000 executions
Use: 1 execution with Map state (1,000 iterations)
```

## Real-World Scenarios

### Scenario 1: E-Commerce Order Processing

**Workflow**:
```
1. Validate order
2. Parallel:
   - Check inventory
   - Process payment
   - Calculate shipping
3. If all successful: Create shipment
4. Send confirmation email
5. Update analytics
```

**State Machine**:
```json
{
  "StartAt": "ValidateOrder",
  "States": {
    "ValidateOrder": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:...:function:ValidateOrder",
      "Next": "ParallelProcessing"
    },
    "ParallelProcessing": {
      "Type": "Parallel",
      "Branches": [
        {
          "StartAt": "CheckInventory",
          "States": {
            "CheckInventory": {
              "Type": "Task",
              "Resource": "arn:aws:lambda:...:function:CheckInventory",
              "End": true
            }
          }
        },
        {
          "StartAt": "ProcessPayment",
          "States": {
            "ProcessPayment": {
              "Type": "Task",
              "Resource": "arn:aws:lambda:...:function:ProcessPayment",
              "Retry": [{
                "ErrorEquals": ["TemporaryError"],
                "MaxAttempts": 3,
                "BackoffRate": 2
              }],
              "End": true
            }
          }
        },
        {
          "StartAt": "CalculateShipping",
          "States": {
            "CalculateShipping": {
              "Type": "Task",
              "Resource": "arn:aws:lambda:...:function:CalculateShipping",
              "End": true
            }
          }
        }
      ],
      "Catch": [{
        "ErrorEquals": ["States.ALL"],
        "Next": "OrderFailed"
      }],
      "Next": "CreateShipment"
    },
    "CreateShipment": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:...:function:CreateShipment",
      "Next": "SendConfirmation"
    },
    "SendConfirmation": {
      "Type": "Task",
      "Resource": "arn:aws:states:::sns:publish",
      "Parameters": {
        "TopicArn": "arn:aws:sns:...:order-confirmations",
        "Message.$": "$.confirmation"
      },
      "Next": "UpdateAnalytics"
    },
    "UpdateAnalytics": {
      "Type": "Task",
      "Resource": "arn:aws:states:::dynamodb:putItem",
      "Parameters": {
        "TableName": "OrderAnalytics",
        "Item": {
          "orderId": {"S.$": "$.orderId"},
          "timestamp": {"N.$": "$.timestamp"}
        }
      },
      "End": true
    },
    "OrderFailed": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:...:function:HandleFailure",
      "Next": "FailState"
    },
    "FailState": {
      "Type": "Fail"
    }
  }
}
```

**Cost** (10,000 orders/month):
```
States per execution: 7
Transitions: 10,000 × 7 = 70,000
Billable: 70,000 - 4,000 = 66,000
Cost: 66,000 / 1,000 × $0.025 = $1.65/month
```

### Scenario 2: ETL Pipeline

**Workflow**:
```
1. Trigger on S3 upload
2. Start Glue ETL job (wait for completion)
3. If successful: Load to Redshift
4. Update data catalog
5. Send notification
```

**Implementation**:
```json
{
  "StartAt": "StartGlueJob",
  "States": {
    "StartGlueJob": {
      "Type": "Task",
      "Resource": "arn:aws:states:::glue:startJobRun.sync",
      "Parameters": {
        "JobName": "ETL-Job",
        "Arguments": {
          "--input-path.$": "$.inputPath",
          "--output-path.$": "$.outputPath"
        }
      },
      "Retry": [{
        "ErrorEquals": ["States.TaskFailed"],
        "MaxAttempts": 2
      }],
      "Next": "LoadToRedshift"
    },
    "LoadToRedshift": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:...:function:LoadRedshift",
      "Next": "UpdateCatalog"
    },
    "UpdateCatalog": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:...:function:UpdateGlueCatalog",
      "Next": "SendNotification"
    },
    "SendNotification": {
      "Type": "Task",
      "Resource": "arn:aws:states:::sns:publish",
      "Parameters": {
        "TopicArn": "arn:aws:sns:...:etl-notifications",
        "Message": "ETL pipeline completed successfully"
      },
      "End": true
    }
  }
}
```

### Scenario 3: Machine Learning Training Pipeline

**Workflow**:
```
1. Prepare training data
2. Train model (SageMaker)
3. Evaluate model
4. If accuracy >90%: Deploy model
5. Otherwise: Tune hyperparameters and retrain
```

**State Machine** (simplified):
```json
{
  "StartAt": "PrepareData",
  "States": {
    "PrepareData": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:...:function:PrepareData",
      "Next": "TrainModel"
    },
    "TrainModel": {
      "Type": "Task",
      "Resource": "arn:aws:states:::sagemaker:createTrainingJob.sync",
      "Parameters": {
        "TrainingJobName.$": "$.trainingJobName",
        "AlgorithmSpecification": {
          "TrainingImage": "...",
          "TrainingInputMode": "File"
        },
        "RoleArn": "...",
        "InputDataConfig": [...],
        "OutputDataConfig": {...}
      },
      "Next": "EvaluateModel"
    },
    "EvaluateModel": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:...:function:EvaluateModel",
      "Next": "CheckAccuracy"
    },
    "CheckAccuracy": {
      "Type": "Choice",
      "Choices": [{
        "Variable": "$.accuracy",
        "NumericGreaterThan": 0.9,
        "Next": "DeployModel"
      }],
      "Default": "TuneHyperparameters"
    },
    "DeployModel": {
      "Type": "Task",
      "Resource": "arn:aws:states:::sagemaker:createEndpoint",
      "Parameters": {...},
      "End": true
    },
    "TuneHyperparameters": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:...:function:TuneParams",
      "Next": "TrainModel"
    }
  }
}
```

## Exam Tips (SAP-C02)

### Key Decision Points

**Standard vs Express**:
```
Long-running (>5 min) → Standard
Audit trail needed → Standard
High volume (>2K/sec) → Express
Short-lived (<5 min) → Express
```

**State Machine vs Lambda**:
```
Multiple steps, coordination → Step Functions
Complex error handling → Step Functions
Simple task → Lambda
Visual workflow needed → Step Functions
```

**Callback Pattern**:
```
Human approval → waitForTaskToken
External system → waitForTaskToken
Long-running external task → waitForTaskToken
```

### Common Scenarios

**"Orchestrate microservices"**:
- Step Functions Standard
- Lambda or ECS tasks
- Error handling with Retry/Catch

**"Long-running workflow"**:
- Standard workflows (up to 1 year)
- Callback pattern for external tasks
- Wait states for delays

**"High-volume processing"**:
- Express workflows
- Map state for iterations
- Parallel state for concurrency

**"Human approval workflow"**:
- waitForTaskToken pattern
- Send email/notification
- Callback on approval/denial

**"Error handling"**:
- Retry with exponential backoff
- Catch errors and route to handler
- Saga pattern for compensation

**"Cost optimization"**:
- Express for high-volume
- Minimize state transitions
- Parallel instead of sequential

This comprehensive Step Functions guide covers all aspects for SAP-C02 exam success.
