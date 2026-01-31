# Amazon SageMaker Clarify

## Overview
- **Purpose**: Detect bias and explain ML model predictions
- **Category**: Machine Learning
- **Use Case**: Responsible AI, model transparency, fairness

## Key Features

### Bias Detection
- **Pre-training**: Analyze training data for bias
- **Post-training**: Evaluate model predictions for bias
- **Metrics**: Multiple bias metrics (DI, DPL, etc.)
- **Reports**: Detailed bias analysis reports

### Explainability
- **Feature Importance**: SHAP values
- **Global Explanations**: Overall model behavior
- **Local Explanations**: Individual prediction explanations
- **Partial Dependence**: Feature impact analysis

### Integration
- **SageMaker Pipelines**: Built-in bias checks
- **Model Monitor**: Continuous bias monitoring
- **Studio**: Visual analysis in notebooks
- **Model Registry**: Track bias metrics

## Bias Metrics

### Pre-training Bias
- **Class Imbalance (CI)**: Distribution of labels
- **Difference in Proportions (DPL)**: Feature distribution differences
- **KL Divergence (KL)**: Distribution similarity
- **Jensen-Shannon Divergence (JS)**: Symmetric divergence

### Post-training Bias
- **Difference in Positive Proportions (DPPL)**: Prediction rate differences
- **Disparate Impact (DI)**: Ratio of positive outcomes
- **Conditional Acceptance (CA)**: Acceptance rate given qualification
- **Treatment Equality (TE)**: Error rate differences

## Explainability Methods

### SHAP (SHapley Additive exPlanations)
- **Kernel SHAP**: Model-agnostic
- **Feature Attribution**: Per-prediction importance
- **Baseline**: Reference for comparisons
- **Visualizations**: Feature importance plots

## Common Use Cases

### Regulatory Compliance
- Fair lending practices
- Equal employment opportunity
- Healthcare fairness
- Algorithmic transparency

### Model Governance
- Bias monitoring
- Explainability requirements
- Audit trails
- Risk assessment

### Model Improvement
- Identify problematic features
- Understand prediction drivers
- Debug model behavior
- Feature engineering insights

## Configuration

### Bias Analysis
```yaml
Facet: Protected attribute (e.g., gender, age)
Label: Positive outcome
Methods: Pre-training and/or post-training
Metrics: CI, DPL, DI, DPPL, etc.
```

### Explainability Analysis
```yaml
Method: SHAP or PDP
Baseline: Reference dataset
Features: All or selected
Granularity: Global or local
```

## Reports and Outputs

### Bias Report
- Metric values and thresholds
- Visual charts
- Recommendations
- JSON format for automation

### Explainability Report
- Feature importance rankings
- SHAP values per prediction
- Partial dependence plots
- Interactive visualizations

## Integration with SageMaker

### Training Jobs
- Automated bias detection
- Pre-training analysis
- Data quality checks

### Model Monitoring
- Continuous bias tracking
- Drift detection
- Alerting on threshold violations

### Endpoints
- Real-time explainability
- Per-prediction SHAP values
- Online bias monitoring

## Pricing Model
- Processing job charges
- Compute instance hours
- Storage for reports
- No additional licensing

## Best Practices
- Define sensitive attributes clearly
- Set appropriate bias thresholds
- Run analysis regularly
- Document findings
- Use both pre and post-training checks
- Combine with human review
- Store reports for auditing

## SAP-C02 Exam Tips
- Know Clarify provides bias detection and explainability
- Understand pre-training vs post-training bias
- Remember SHAP for feature importance
- Recognize compliance and governance use cases
- Know integration with SageMaker Pipelines and Model Monitor
- Understand bias metrics (DI, DPL, DPPL)
- Remember Clarify runs as processing jobs
