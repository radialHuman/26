# Amazon SageMaker Ground Truth

## Overview
- **Purpose**: Data labeling service for building training datasets
- **Category**: Machine Learning
- **Use Case**: Create high-quality labeled datasets for ML models

## Key Features

### Labeling Workflows
- **Built-in Task Types**: Image, text, video classification
- **Custom Templates**: Create custom labeling interfaces
- **3D Point Clouds**: Label LiDAR data for autonomous vehicles
- **Video Labeling**: Frame-by-frame or object tracking

### Workforce Options
- **Mechanical Turk**: Public workforce
- **Vendor Workforce**: Third-party labeling services
- **Private Workforce**: Your own employees
- **Plus Teams**: Managed expert workforce

### Active Learning
- **Automatic Labeling**: ML models label data automatically
- **Human Review**: Only uncertain predictions go to humans
- **Cost Reduction**: Up to 70% lower labeling costs
- **Quality Improvement**: Continuous model refinement

### Label Quality
- **Annotation Consolidation**: Multiple labelers per item
- **Quality Metrics**: Track labeling accuracy
- **Audit Workflows**: Review and correct labels
- **Verification Jobs**: Validate existing labels

## Common Use Cases

### Computer Vision
- Object detection and segmentation
- Image classification
- Semantic segmentation
- 3D point cloud labeling

### Natural Language Processing
- Text classification
- Named entity recognition
- Sentiment analysis
- Document analysis

### Video Analysis
- Object tracking
- Activity recognition
- Event detection
- Frame-by-frame labeling

## Integration
- **SageMaker**: Direct integration with training
- **S3**: Store raw and labeled data
- **CloudWatch**: Monitor labeling jobs
- **Lambda**: Custom labeling logic

## Pricing Model
- Object labeling charges
- Workforce charges (per task)
- Training compute for auto-labeling
- S3 storage costs

## Best Practices
- Use built-in task types when possible
- Start with small batches
- Implement quality checks
- Use active learning to reduce costs
- Provide clear labeling instructions
- Monitor workforce performance

## SAP-C02 Exam Tips
- Understand workforce options and when to use each
- Know active learning benefits (cost reduction)
- Recognize use cases for Ground Truth
- Understand integration with SageMaker training
- Remember quality control mechanisms
- Know pricing factors
