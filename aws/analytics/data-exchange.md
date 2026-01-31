# AWS Data Exchange

## Overview
- **Purpose**: Find, subscribe to, and use third-party data in the cloud
- **Category**: Analytics
- **Use Case**: Data marketplace, third-party data integration

## Key Features

### Data Catalog
- **3,000+ Products**: Datasets from 250+ providers
- **Categories**: Financial, healthcare, weather, geospatial, etc.
- **Search**: Find relevant datasets
- **Preview**: Sample data before subscribing

### Subscription Model
- **Free Data**: No-cost datasets
- **Paid Subscriptions**: Monthly or annual
- **Usage-based**: Pay per API call or data volume
- **Custom**: Negotiate with providers

### Data Delivery
- **S3 Integration**: Data delivered to S3
- **API Access**: RESTful APIs for real-time data
- **Revisions**: Automatic updates from providers
- **Notifications**: EventBridge for new data

### Data Publishing
- **Become a Provider**: Publish your own datasets
- **Monetization**: Earn revenue from data
- **Access Control**: Manage subscriber access
- **Usage Tracking**: Monitor data consumption

## Data Types

### Static Datasets
- Historical data
- Reference data
- One-time downloads
- Periodic updates

### API-based Data
- Real-time feeds
- On-demand queries
- Streaming data
- Event-driven updates

## Common Data Categories

### Financial Services
- Market data
- Credit scores
- Economic indicators
- Trading data

### Healthcare & Life Sciences
- Clinical trial data
- Drug information
- Disease surveillance
- Genomic datasets

### Geospatial
- Satellite imagery
- Maps and boundaries
- Demographics
- Location intelligence

### Weather & Climate
- Historical weather
- Forecasts
- Climate models
- Environmental data

## Integration

### Amazon S3
- Automatic data delivery
- Versioned datasets
- Lifecycle policies
- Access through S3 APIs

### Amazon EventBridge
- Notifications for new revisions
- Trigger workflows
- Automate processing
- Integration with other services

### AWS Analytics Services
- Athena: Query data directly
- Redshift: Load into data warehouse
- EMR: Big data processing
- QuickSight: Visualization

## Workflow

### As a Subscriber
1. Browse or search catalog
2. Preview sample data
3. Subscribe to product
4. Configure delivery to S3
5. Access data via S3 or API
6. Receive automatic updates

### As a Provider
1. Prepare dataset
2. Create data product
3. Set pricing and terms
4. Publish to catalog
5. Manage subscribers
6. Track usage and revenue

## Access Control
- **IAM Policies**: Control who can subscribe
- **Resource Policies**: Restrict data access
- **Encryption**: Data encrypted at rest and in transit
- **Compliance**: SOC, ISO, HIPAA eligible

## Pricing Model

### Subscriber Costs
- Subscription fees (varies by product)
- S3 storage costs
- Data transfer charges
- API call charges (if applicable)

### Provider Revenue
- Set your own pricing
- AWS takes percentage
- Monthly payouts
- Usage-based or fixed pricing

## Common Use Cases

### Data Enrichment
- Enhance internal data
- Add demographics
- Geolocation data
- Market intelligence

### Analytics & ML
- Training datasets for ML models
- Market analysis
- Risk modeling
- Predictive analytics

### Application Development
- Weather data for apps
- Financial data feeds
- Location services
- Reference data

### Research
- Academic research
- Clinical studies
- Economic analysis
- Environmental monitoring

## Best Practices
- Evaluate data quality with samples
- Understand licensing terms
- Automate data ingestion
- Monitor data updates
- Set up cost alerts
- Use EventBridge for automation
- Implement data validation
- Archive historical revisions

## Security & Compliance
- Data encrypted in transit and at rest
- HIPAA eligible
- SOC compliant
- ISO certified
- Regular security audits
- Data lineage tracking

## SAP-C02 Exam Tips
- Know Data Exchange is a marketplace for third-party data
- Understand S3 integration for data delivery
- Remember EventBridge for update notifications
- Recognize use cases: data enrichment, ML training, analytics
- Know both subscription and publishing capabilities
- Understand integration with analytics services (Athena, Redshift)
- Remember automatic data updates via revisions
- Know pricing includes subscription, storage, and transfer costs
