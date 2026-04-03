# Amazon SageMaker - Complete Guide for SAP-C02

## What is Amazon SageMaker?

Amazon SageMaker is a fully managed machine learning (ML) service that enables data scientists and developers to quickly build, train, and deploy machine learning models at scale. It provides every component needed for ML workflows in an integrated environment, from data preparation to model deployment and monitoring.

## Why Use Amazon SageMaker?

### Key Benefits
- **Fully Managed Infrastructure**: No server management required
- **Integrated Workflow**: End-to-end ML platform
- **Auto-scaling**: Automatically scales compute resources
- **Cost Optimization**: Pay only for what you use, spot instances supported
- **Pre-built Algorithms**: 15+ built-in algorithms
- **Framework Support**: TensorFlow, PyTorch, scikit-learn, etc.
- **MLOps Integration**: Built-in CI/CD for ML models
- **Security**: VPC support, encryption, IAM integration

### Use Cases
- Fraud detection systems
- Recommendation engines
- Predictive maintenance
- Customer churn prediction
- Image and video analysis
- Natural language processing
- Demand forecasting
- Personalization at scale

## Core Components

### 1. SageMaker Studio

**What**: Integrated development environment (IDE) for ML workflows.

**Features**:
- Jupyter notebooks with auto-scaling compute
- Visual workflow designer
- Experiment tracking
- Model debugging and profiling
- Git integration
- Team collaboration

**Architecture**:
```
SageMaker Studio Domain
├── User Profiles
│   ├── Data Scientist A
│   ├── ML Engineer B
│   └── Business Analyst C
├── Shared Spaces
│   ├── Team notebooks
│   └── Shared experiments
└── Apps
    ├── JupyterServer
    ├── KernelGateway
    └── Studio
```

### 2. SageMaker Notebooks

**Types**:
- **Notebook Instances**: Managed Jupyter notebooks with pre-configured ML environments
- **Studio Notebooks**: Integrated notebooks within SageMaker Studio
- **Processing Jobs**: Run notebooks as batch jobs

**Instance Types**:
- ml.t3.medium (development)
- ml.m5.xlarge (standard workloads)
- ml.p3.2xlarge (GPU for deep learning)
- ml.p4d.24xlarge (multi-GPU training)

### 3. SageMaker Training

**How Training Works**:
```
1. Data Preparation
   ├── S3 bucket with training data
   ├── Data in CSV, JSON, Parquet, or custom format
   └── Input channels (train, validation, test)

2. Training Job
   ├── Algorithm selection (built-in or custom)
   ├── Instance type and count
   ├── Hyperparameters
   └── Output location (S3)

3. Model Artifacts
   ├── Trained model saved to S3
   ├── Model metrics logged
   └── Training logs in CloudWatch
```

**Training Modes**:

**File Mode**:
- Downloads full dataset to instance
- Good for smaller datasets (< 100 GB)
- Faster processing once downloaded

**Pipe Mode**:
- Streams data from S3
- No disk space required
- Better for large datasets (> 100 GB)
- Lower latency to start training

**Example Training Job**:
```python
from sagemaker.estimator import Estimator

estimator = Estimator(
    image_uri='<algorithm-container>',
    role='arn:aws:iam::123456789012:role/SageMakerRole',
    instance_count=1,
    instance_type='ml.m5.xlarge',
    output_path='s3://my-bucket/models/',
    sagemaker_session=sagemaker_session,
    hyperparameters={
        'num_layers': 18,
        'epochs': 50,
        'learning_rate': 0.001
    }
)

estimator.fit({'train': 's3://my-bucket/train/', 
               'validation': 's3://my-bucket/validation/'})
```

**Distributed Training**:

**Data Parallelism**:
- Split data across multiple instances
- Each instance has copy of full model
- Gradients aggregated after each batch
- Good for large datasets

**Model Parallelism**:
- Split model across multiple instances
- Used when model doesn't fit on single GPU
- Good for very large models (billions of parameters)

**Example Distributed Training**:
```python
from sagemaker.pytorch import PyTorch

estimator = PyTorch(
    entry_point='train.py',
    role=role,
    instance_type='ml.p3.16xlarge',
    instance_count=4,  # 4 instances
    framework_version='1.12',
    py_version='py38',
    distribution={
        'smdistributed': {
            'dataparallel': {
                'enabled': True
            }
        }
    }
)
```

### 4. SageMaker Built-in Algorithms

**Supervised Learning**:
- **Linear Learner**: Linear regression, binary/multiclass classification
- **XGBoost**: Gradient boosting for regression and classification
- **Factorization Machines**: Sparse data recommendations
- **K-Nearest Neighbors (k-NN)**: Classification and regression

**Unsupervised Learning**:
- **K-Means**: Clustering
- **Principal Component Analysis (PCA)**: Dimensionality reduction
- **Random Cut Forest**: Anomaly detection

**Computer Vision**:
- **Image Classification**: ResNet CNN for image classification
- **Object Detection**: Single Shot Detector (SSD) algorithm
- **Semantic Segmentation**: Pixel-level image segmentation

**NLP**:
- **BlazingText**: Text classification and word embeddings
- **Sequence-to-Sequence**: Machine translation, text summarization
- **Neural Topic Model**: Topic modeling for text corpus

**Time Series**:
- **DeepAR**: Time series forecasting
- **IP Insights**: Identify anomalous IP patterns

**Algorithm Selection Guide**:
```
Problem Type → Algorithm

Classification (Tabular) → XGBoost, Linear Learner
Regression → Linear Learner, XGBoost
Recommendations → Factorization Machines
Clustering → K-Means
Anomaly Detection → Random Cut Forest
Image Classification → Image Classification Algorithm
Object Detection → Object Detection Algorithm
Text Classification → BlazingText
Time Series Forecasting → DeepAR
```

### 5. SageMaker Model Hosting

**Endpoint Types**:

**Real-time Endpoints**:
- Low-latency predictions (< 100ms)
- Persistent endpoints
- Auto-scaling support
- Multiple models on same endpoint

**Batch Transform**:
- Large-scale batch predictions
- No persistent endpoint
- Cost-effective for periodic inference
- Process entire datasets

**Serverless Inference**:
- Pay-per-use
- Auto-scales to zero
- Good for intermittent traffic
- Cold start latency (< 10 seconds)

**Asynchronous Inference**:
- Large payloads (up to 1 GB)
- Long processing times (up to 15 minutes)
- Queue-based system
- S3 for input/output

**Endpoint Configuration**:
```python
from sagemaker.model import Model
from sagemaker.predictor import Predictor

# Create model
model = Model(
    image_uri='<inference-container>',
    model_data='s3://my-bucket/models/model.tar.gz',
    role='arn:aws:iam::123456789012:role/SageMakerRole'
)

# Deploy endpoint
predictor = model.deploy(
    initial_instance_count=2,
    instance_type='ml.m5.xlarge',
    endpoint_name='my-model-endpoint'
)

# Make prediction
result = predictor.predict(data)
```

**Multi-Model Endpoints**:
```python
from sagemaker.multidatamodel import MultiDataModel

# Create multi-model endpoint
mdm = MultiDataModel(
    name='multi-model-endpoint',
    model_data_prefix='s3://my-bucket/models/',
    image_uri='<inference-container>',
    role=role
)

mdm.deploy(
    initial_instance_count=1,
    instance_type='ml.m5.xlarge'
)

# Invoke specific model
response = runtime_client.invoke_endpoint(
    EndpointName='multi-model-endpoint',
    TargetModel='model-v1.tar.gz',
    Body=data
)
```

**Auto-scaling Configuration**:
```json
{
  "TargetValue": 75.0,
  "PredefinedMetricSpecification": {
    "PredefinedMetricType": "SageMakerVariantInvocationsPerInstance"
  },
  "ScaleInCooldown": 300,
  "ScaleOutCooldown": 60
}
```

### 6. SageMaker Pipelines (MLOps)

**What**: CI/CD for machine learning workflows.

**Pipeline Structure**:
```python
from sagemaker.workflow.pipeline import Pipeline
from sagemaker.workflow.steps import ProcessingStep, TrainingStep
from sagemaker.workflow.conditions import ConditionGreaterThanOrEqualTo
from sagemaker.workflow.condition_step import ConditionStep

# Define steps
processing_step = ProcessingStep(name="DataPreprocessing", ...)
training_step = TrainingStep(name="ModelTraining", ...)
evaluation_step = ProcessingStep(name="ModelEvaluation", ...)

# Conditional deployment based on accuracy
condition = ConditionGreaterThanOrEqualTo(
    left=JsonGet(
        step_name=evaluation_step.name,
        property_file=evaluation_report,
        json_path="accuracy"
    ),
    right=0.85  # Minimum accuracy threshold
)

deploy_step = ModelStep(name="DeployModel", ...)

condition_step = ConditionStep(
    name="CheckAccuracy",
    conditions=[condition],
    if_steps=[deploy_step],
    else_steps=[]
)

# Create pipeline
pipeline = Pipeline(
    name="MLPipeline",
    steps=[processing_step, training_step, evaluation_step, condition_step]
)

# Execute pipeline
pipeline.upsert(role_arn=role)
execution = pipeline.start()
```

**Pipeline Visualization**:
```
Data Preprocessing
       ↓
   Training
       ↓
   Evaluation
       ↓
  Accuracy >= 0.85?
   ├── Yes → Deploy Model → Register Model
   └── No → Send Alert → Retrain with different params
```

### 7. SageMaker Feature Store

**What**: Centralized repository for ML features.

**Components**:
- **Online Store**: Low-latency access (< 10ms) for real-time inference
- **Offline Store**: S3-based for training and batch predictions
- **Feature Groups**: Collections of related features

**Architecture**:
```
Feature Engineering
       ↓
Feature Store
├── Online Store (ElastiCache-like)
│   └── Real-time predictions
└── Offline Store (S3 + Glue)
    └── Training jobs

Use Cases:
- Feature reuse across models
- Point-in-time correct data
- Feature versioning
- Prevent training-serving skew
```

**Example**:
```python
from sagemaker.feature_store.feature_group import FeatureGroup

# Create feature group
feature_group = FeatureGroup(
    name="customer-features",
    sagemaker_session=sagemaker_session
)

feature_group.load_feature_definitions(data_frame=df)

feature_group.create(
    s3_uri='s3://my-bucket/feature-store',
    record_identifier_name='customer_id',
    event_time_feature_name='event_time',
    role_arn=role,
    enable_online_store=True
)

# Ingest features
feature_group.ingest(data_frame=df, max_workers=3)

# Retrieve features (online)
record = sagemaker_featurestore_runtime.get_record(
    FeatureGroupName='customer-features',
    RecordIdentifierValueAsString='12345'
)
```

### 8. SageMaker Model Registry

**What**: Catalog and versioning for ML models.

**Features**:
- Model versioning
- Approval workflows
- Deployment tracking
- Model lineage

**Model Lifecycle**:
```
Development → PendingManualApproval → Approved → Production
                                     ↓
                                 Rejected

Model Package Groups
├── fraud-detection-model
│   ├── Version 1 (Approved)
│   ├── Version 2 (Approved, Production)
│   └── Version 3 (PendingManualApproval)
└── recommendation-model
    ├── Version 1 (Approved, Production)
    └── Version 2 (Testing)
```

**Example**:
```python
from sagemaker.model import Model

# Register model
model_package = model.register(
    content_types=['application/json'],
    response_types=['application/json'],
    inference_instances=['ml.m5.large'],
    transform_instances=['ml.m5.large'],
    model_package_group_name='fraud-detection-model',
    approval_status='PendingManualApproval',
    description='XGBoost model for fraud detection v2.1'
)

# Approve model
sm_client.update_model_package(
    ModelPackageArn=model_package_arn,
    ModelApprovalStatus='Approved'
)

# Deploy approved model
model = Model(
    model_data=model_package_arn,
    role=role,
    sagemaker_session=sagemaker_session
)
predictor = model.deploy(...)
```

### 9. SageMaker Autopilot

**What**: Automated machine learning (AutoML) service.

**Capabilities**:
- Automatic data preprocessing
- Algorithm selection
- Hyperparameter tuning
- Model evaluation
- Explainability reports

**How It Works**:
```
1. Upload Dataset → S3
2. Specify target column
3. Autopilot explores:
   - Feature engineering strategies
   - Algorithms (Linear, XGBoost, MLP)
   - Hyperparameter combinations
4. Train top candidates
5. Generate explainability report
6. Deploy best model
```

**Example**:
```python
from sagemaker.automl.automl import AutoML

automl = AutoML(
    role=role,
    target_attribute_name='fraud',  # What to predict
    output_path='s3://my-bucket/autopilot-output/',
    max_candidates=10,  # Number of models to try
    max_runtime_per_training_job_in_seconds=3600,
    total_job_runtime_in_seconds=36000
)

automl.fit(
    inputs='s3://my-bucket/training-data.csv',
    wait=False,
    logs=False
)

# Get best model
best_candidate = automl.describe_auto_ml_job()['BestCandidate']
```

### 10. SageMaker Clarify

**What**: Bias detection and model explainability.

**Features**:

**Bias Detection**:
- Pre-training bias metrics
- Post-training bias metrics
- SHAP values for explainability

**Explainability**:
- Feature importance
- Partial dependence plots
- Individual predictions explanation

**Example Bias Metrics**:
```python
from sagemaker import clarify

clarify_processor = clarify.SageMakerClarifyProcessor(
    role=role,
    instance_count=1,
    instance_type='ml.m5.xlarge',
    sagemaker_session=sagemaker_session
)

bias_config = clarify.BiasConfig(
    label_values_or_threshold=[1],  # Positive outcome
    facet_name='gender',  # Sensitive attribute
    facet_values_or_threshold=['female']
)

clarify_processor.run_bias(
    data_config=data_config,
    bias_config=bias_config,
    model_config=model_config,
    model_predicted_label_config=predicted_label_config
)
```

**Bias Metrics**:
- Class Imbalance (CI)
- Difference in Positive Proportions (DPL)
- Disparate Impact (DI)
- Conditional Demographic Disparity (CDD)

### 11. SageMaker Model Monitor

**What**: Monitor model performance in production.

**Monitoring Types**:

**Data Quality Monitoring**:
- Detect data drift
- Missing features
- Feature distribution changes

**Model Quality Monitoring**:
- Accuracy degradation
- Prediction distribution
- Ground truth comparison

**Bias Drift Monitoring**:
- Bias metrics over time
- Fairness violations

**Feature Attribution Drift**:
- SHAP value changes
- Feature importance drift

**Example**:
```python
from sagemaker.model_monitor import ModelMonitor, DataCaptureConfig

# Enable data capture
data_capture_config = DataCaptureConfig(
    enable_capture=True,
    sampling_percentage=100,
    destination_s3_uri='s3://my-bucket/data-capture'
)

predictor = model.deploy(
    initial_instance_count=1,
    instance_type='ml.m5.xlarge',
    data_capture_config=data_capture_config
)

# Create baseline
my_monitor = ModelMonitor(
    role=role,
    instance_count=1,
    instance_type='ml.m5.xlarge',
    volume_size_in_gb=20,
    max_runtime_in_seconds=3600
)

my_monitor.suggest_baseline(
    baseline_dataset='s3://my-bucket/validation-data.csv',
    dataset_format=DatasetFormat.csv(header=True),
    output_s3_uri='s3://my-bucket/baseline'
)

# Schedule monitoring
my_monitor.create_monitoring_schedule(
    endpoint_input=predictor.endpoint_name,
    output_s3_uri='s3://my-bucket/monitoring-output',
    schedule_cron_expression='cron(0 * * * ? *)'  # Hourly
)
```

**Alerting**:
```python
# CloudWatch alarm for violations
alarm = cloudwatch.Alarm(
    alarm_name='ModelDriftAlarm',
    metric=cloudwatch.Metric(
        namespace='aws/sagemaker/Endpoints/data-metrics',
        metric_name='feature_baseline_drift_age'
    ),
    threshold=0.1,
    evaluation_periods=1,
    comparison_operator='GreaterThanThreshold'
)
```

### 12. SageMaker Neo

**What**: Optimize models for edge devices and cloud instances.

**Benefits**:
- 2x faster inference
- Reduced model size
- Supports multiple frameworks
- Deploy to edge (IoT Greengrass)

**Supported Devices**:
- NVIDIA Jetson
- Raspberry Pi
- AWS Inferentia
- Intel CPUs
- ARM CPUs

**Compilation**:
```python
from sagemaker.model import Model

# Compile model
compiled_model = model.compile(
    target_instance_family='ml_c5',
    input_shape={'data': [1, 3, 224, 224]},
    output_path='s3://my-bucket/compiled-models/',
    framework='pytorch',
    framework_version='1.12'
)

# Deploy compiled model
predictor = compiled_model.deploy(
    initial_instance_count=1,
    instance_type='ml.c5.xlarge'
)
```

### 13. SageMaker Debugger

**What**: Real-time debugging of training jobs.

**Features**:
- Capture tensors during training
- Built-in rules for common issues
- Custom rules
- Profiling for system bottlenecks

**Example**:
```python
from sagemaker.debugger import Rule, rule_configs, ProfilerConfig

# Configure debugger
profiler_config = ProfilerConfig(
    system_monitor_interval_millis=500,
    framework_profile_params=FrameworkProfile(
        start_step=5,
        num_steps=10
    )
)

rules = [
    Rule.sagemaker(rule_configs.vanishing_gradient()),
    Rule.sagemaker(rule_configs.overfit()),
    Rule.sagemaker(rule_configs.overtraining()),
    Rule.sagemaker(rule_configs.loss_not_decreasing())
]

estimator = TensorFlow(
    entry_point='train.py',
    role=role,
    instance_type='ml.p3.2xlarge',
    instance_count=1,
    framework_version='2.9',
    debugger_hook_config=False,
    profiler_config=profiler_config,
    rules=rules
)
```

**Common Issues Detected**:
- Vanishing/exploding gradients
- Overfitting
- Overtraining
- Poor weight initialization
- Tensor size mismatches
- GPU underutilization

## Security

### VPC Configuration
```python
from sagemaker.network import NetworkConfig

network_config = NetworkConfig(
    enable_network_isolation=True,
    security_group_ids=['sg-12345678'],
    subnets=['subnet-abcd1234', 'subnet-efgh5678']
)

estimator = Estimator(
    image_uri=image_uri,
    role=role,
    instance_type='ml.m5.xlarge',
    instance_count=1,
    network_config=network_config
)
```

### Encryption
```python
# Encryption at rest (S3, EBS)
estimator = Estimator(
    image_uri=image_uri,
    role=role,
    instance_type='ml.m5.xlarge',
    volume_kms_key='arn:aws:kms:us-east-1:123456789012:key/12345678',
    output_kms_key='arn:aws:kms:us-east-1:123456789012:key/87654321'
)

# Encryption in transit
predictor = model.deploy(
    initial_instance_count=1,
    instance_type='ml.m5.xlarge',
    endpoint_config_name='encrypted-endpoint',
    kms_key='arn:aws:kms:us-east-1:123456789012:key/12345678'
)
```

### IAM Roles
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject"
      ],
      "Resource": "arn:aws:s3:::my-sagemaker-bucket/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:log-group:/aws/sagemaker/*"
    }
  ]
}
```

## Cost Optimization

### Training Cost Optimization

**Managed Spot Training**:
```python
estimator = Estimator(
    image_uri=image_uri,
    role=role,
    instance_type='ml.p3.2xlarge',
    instance_count=4,
    use_spot_instances=True,  # Up to 90% cost savings
    max_wait=7200,  # Maximum wait time
    max_run=3600,  # Maximum training time
    checkpoint_s3_uri='s3://my-bucket/checkpoints/'  # Save progress
)
```

**Automatic Model Tuning Budget**:
```python
from sagemaker.tuner import HyperparameterTuner

tuner = HyperparameterTuner(
    estimator=estimator,
    objective_metric_name='validation:accuracy',
    hyperparameter_ranges=hyperparameter_ranges,
    max_jobs=100,
    max_parallel_jobs=10,  # Control parallelism to manage cost
    early_stopping_type='Auto'  # Stop underperforming jobs early
)
```

### Inference Cost Optimization

**Multi-Model Endpoints**:
- Host multiple models on single endpoint
- Reduce endpoint costs by 5-10x
- Good for many similar models

**Serverless Inference**:
- Pay per invocation
- Auto-scales to zero
- Good for < 1M predictions/month

**Asynchronous Inference**:
- Cheaper than real-time for large payloads
- Queue-based processing

**Inference Recommender**:
```python
# Get optimal instance type
inference_recommender = InferenceRecommender(
    role=role,
    model_package_arn=model_package_arn
)

# Runs load tests on different instance types
job = inference_recommender.create_inference_recommendations_job(
    job_name='optimization-job',
    job_type='Advanced',
    endpoint_configurations=[
        {'InstanceType': 'ml.m5.xlarge'},
        {'InstanceType': 'ml.c5.xlarge'},
        {'InstanceType': 'ml.g4dn.xlarge'}
    ]
)

# Returns cost-performance recommendations
```

## SAP-C02 Exam Scenarios

### Scenario 1: Real-time Fraud Detection
**Question**: Design ML system for credit card fraud detection (< 100ms latency, 10K TPS).

**Solution**:
```
1. Training Pipeline (SageMaker Pipelines)
   - Process transactions (SageMaker Processing)
   - Feature Store (real-time features)
   - Train XGBoost model
   - Register model if accuracy > 95%

2. Inference
   - Real-time endpoint with auto-scaling
   - Multi-AZ deployment
   - CloudWatch alarms for latency
   - Model Monitor for drift detection

3. Architecture:
   Transaction → API Gateway → Lambda → SageMaker Endpoint
                                      ↓
                                  Feature Store (online)
                                      ↓
                                  Prediction (block/allow)
```

### Scenario 2: Batch Recommendation System
**Question**: Generate product recommendations for 10M users nightly.

**Solution**:
```
1. Training (Weekly)
   - Factorization Machines algorithm
   - Historical purchase data from S3
   - Distributed training on ml.p3.16xlarge

2. Inference (Nightly)
   - Batch Transform job
   - Input: User list from S3
   - Output: Top 10 recommendations per user → S3
   - Load to DynamoDB for serving

3. Cost Optimization:
   - Spot instances for training (checkpointing)
   - Batch transform (no persistent endpoint)
   - Schedule during off-peak hours
```

### Scenario 3: Multi-Model Deployment
**Question**: Deploy 1000 ML models for multi-tenant SaaS (one model per customer).

**Solution**:
```
Option 1: Multi-Model Endpoints
- Single endpoint, 1000 models
- Models loaded on-demand
- Cost: 1 endpoint vs 1000 endpoints
- Latency: First request has cold start

Option 2: Model Router Pattern
- Lambda routes to tenant-specific endpoint
- Deploy models for top 10% customers
- Batch inference for remaining 90%

Recommendation: Multi-Model Endpoints
- 100x cost reduction
- Acceptable latency (< 1s for cold start)
- Monitor most-used models, consider dedicated endpoints
```

### Scenario 4: MLOps with CI/CD
**Question**: Implement automated model retraining and deployment.

**Solution**:
```
1. SageMaker Pipelines
   ├── Scheduled trigger (weekly)
   ├── Data validation step
   ├── Preprocessing step
   ├── Training step (with Spot instances)
   ├── Evaluation step
   ├── Condition: accuracy > baseline
   │   ├── Yes → Register model (Pending Approval)
   │   └── No → SNS alert to ML team
   
2. Model Registry
   - Manual approval by ML team
   - Version tracking
   - Deployment tags (staging, production)

3. Deployment
   - CodePipeline triggered by approval
   - Blue/Green deployment
   - Canary testing (10% traffic)
   - Full deployment after validation

4. Monitoring
   - Model Monitor for drift
   - CloudWatch dashboards
   - Automatic rollback on errors
```

### Scenario 5: Edge Deployment
**Question**: Deploy image classification to 10K IoT cameras.

**Solution**:
```
1. Model Development
   - Train in SageMaker (ResNet)
   - Achieve 95% accuracy

2. Model Optimization
   - SageMaker Neo compilation
   - Target: ARM Cortex-A72 (Raspberry Pi)
   - 50% size reduction, 2x faster

3. Deployment
   - Upload compiled model to S3
   - IoT Greengrass components
   - OTA updates via IoT Device Management
   
4. Inference
   - Local inference on camera
   - Send only alerts to cloud (reduce bandwidth)
   - Periodic model updates from cloud

5. Monitoring
   - CloudWatch metrics via Greengrass
   - Model performance tracking
   - Alert on accuracy degradation
```

## Common Pitfalls

### 1. Training-Serving Skew
```python
# ❌ Bad: Different preprocessing in training and inference
# Training
df['age_normalized'] = (df['age'] - 35) / 10  # Hardcoded values

# Inference (different values!)
df['age_normalized'] = (df['age'] - 30) / 12

# ✅ Good: Use SageMaker Feature Store or SKLearn Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline

pipeline = Pipeline([
    ('scaler', StandardScaler()),  # Learns mean/std from training data
    ('model', model)
])

# Save entire pipeline
joblib.dump(pipeline, 'model.joblib')
```

### 2. Not Using Spot Instances
```python
# ❌ Expensive: On-demand instances for training
estimator = Estimator(..., use_spot_instances=False)

# ✅ Cost-effective: Spot instances with checkpointing
estimator = Estimator(
    ...,
    use_spot_instances=True,
    max_wait=7200,
    checkpoint_s3_uri='s3://bucket/checkpoints/'
)
```

### 3. Over-provisioned Endpoints
```python
# ❌ Wasteful: 24/7 endpoint for low traffic
predictor = model.deploy(
    initial_instance_count=2,
    instance_type='ml.p3.2xlarge'  # Expensive GPU instance
)

# ✅ Cost-effective: Serverless for intermittent traffic
from sagemaker.serverless import ServerlessInferenceConfig

serverless_config = ServerlessInferenceConfig(
    memory_size_in_mb=4096,
    max_concurrency=10
)

predictor = model.deploy(
    serverless_inference_config=serverless_config
)
```

### 4. No Model Monitoring
```python
# ❌ Deploy and forget
predictor = model.deploy(...)
# Model degrades over time, no alerts!

# ✅ Monitor model performance
from sagemaker.model_monitor import ModelMonitor

monitor = ModelMonitor(...)
monitor.create_monitoring_schedule(
    endpoint_input=predictor.endpoint_name,
    schedule_cron_expression='cron(0 */4 * * ? *)'  # Every 4 hours
)
```

## Key Takeaways for SAP-C02

1. **Training at Scale**
   - Use Pipe mode for large datasets
   - Distributed training for big models/datasets
   - Spot instances for cost savings (with checkpoints)
   - Hyperparameter tuning with early stopping

2. **Inference Optimization**
   - Real-time: Auto-scaling endpoints
   - Batch: Batch Transform jobs
   - Intermittent: Serverless Inference
   - Many models: Multi-Model Endpoints
   - Edge: SageMaker Neo compilation

3. **MLOps**
   - SageMaker Pipelines for automation
   - Model Registry for versioning
   - Feature Store to prevent training-serving skew
   - Model Monitor for production monitoring

4. **Security**
   - VPC for network isolation
   - KMS for encryption at rest and in transit
   - IAM roles with least privilege
   - Private Docker registry (ECR)

5. **Cost Management**
   - Spot instances for training
   - Serverless/async inference for low traffic
   - Multi-model endpoints for many models
   - Automatic model tuning budget limits

6. **High Availability**
   - Multi-AZ endpoint deployment
   - Auto-scaling for variable load
   - Model Monitor with CloudWatch alarms
   - Blue/Green deployments for updates

7. **Integration**
   - S3 for data and model storage
   - ECR for custom containers
   - Lambda for pre/post-processing
   - Step Functions for complex workflows
   - API Gateway for RESTful endpoints