# Amazon QuickSight

## What is Amazon QuickSight?

Amazon QuickSight is a fast, cloud-powered business intelligence (BI) service that makes it easy to deliver insights to everyone in your organization. It's a fully managed, serverless service that lets you easily create and publish interactive dashboards, perform ad-hoc analysis, and get business insights from your data. Think of QuickSight as your self-service BI tool that scales automatically.

## Why Use Amazon QuickSight?

### Key Benefits
- **Serverless**: No infrastructure to manage
- **Pay-per-Session**: Cost-effective pricing model
- **Fast**: In-memory calculation engine (SPICE)
- **ML-Powered**: Built-in ML insights and forecasting
- **Embedded**: Embed dashboards in applications
- **Scalable**: Supports thousands of users
- **Integrated**: Connects to AWS and external data sources

### Use Cases
- Business intelligence dashboards
- Executive reporting
- Self-service analytics
- Embedded analytics in SaaS applications
- Ad-hoc data exploration
- What-if analysis
- Anomaly detection
- Sales forecasting

## How QuickSight Works

### Architecture

```
Data Sources → QuickSight → SPICE (optional) → Analysis → Dashboard
    ↓                                              ↓
Athena, S3,                                  Interactive
RDS, Redshift,                              Visualizations
Salesforce, etc.
```

### Core Components

**1. Data Sources**:
- AWS services (S3, Athena, Redshift, RDS, etc.)
- On-premises databases
- SaaS applications (Salesforce, Jira)
- File uploads (CSV, Excel, JSON)

**2. Datasets**:
- Logical representation of data
- Can combine multiple sources (joins)
- Calculated fields
- Row-level security

**3. SPICE**:
- Super-fast, Parallel, In-memory Calculation Engine
- Columnar storage
- Auto-refreshed or scheduled refresh
- Compressed data storage

**4. Analysis**:
- Interactive workspace for creating visualizations
- Drag-and-drop interface
- Multiple sheets per analysis

**5. Dashboard**:
- Published read-only version of analysis
- Shareable with users
- Interactive filtering and drill-downs
- Can be embedded

## Data Sources and Connectivity

### AWS Data Sources

**Direct Query**:
- **Amazon Athena**: Query S3 data lakes
- **Amazon Redshift**: Data warehouse queries
- **Amazon RDS**: MySQL, PostgreSQL, SQL Server
- **Amazon Aurora**: MySQL, PostgreSQL compatible
- **AWS IoT Analytics**: IoT data

**Import to SPICE**:
- **Amazon S3**: CSV, JSON, Parquet, ORC
- **Amazon Athena**: Results imported to SPICE
- **AWS Data Exchange**: Third-party data

### External Data Sources

**Databases**:
- MySQL, PostgreSQL, SQL Server
- Oracle, Teradata, Snowflake
- Presto, Apache Spark
- Amazon OpenSearch Service

**SaaS Applications**:
- Salesforce
- ServiceNow
- Jira
- Adobe Analytics
- Twitter

**Files**:
- Upload CSV, TSV, Excel, JSON
- S3 bucket files
- Manifest files for multiple S3 objects

### Connection Methods

**Direct Query**:
- Real-time data
- No data import needed
- Requires source availability
- May be slower for large datasets

**SPICE**:
- Imported data
- Super-fast queries
- Scheduled refresh
- Offline dashboard access
- 10 GB free per user, then $0.25/GB/month

## SPICE (Super-fast, Parallel, In-memory Calculation Engine)

### How SPICE Works

**Data Ingestion**:
```
Source Data → Compression → Columnar Storage → In-Memory Cache
```

**Benefits**:
- **Fast**: Sub-second query response
- **Compressed**: 10:1 compression ratio typical
- **Parallel**: Multiple queries simultaneously
- **Cost-Effective**: Efficient storage pricing

**Refresh Options**:
- **Full Refresh**: Replace all data
- **Incremental Refresh**: Update only changed data
- **Scheduled**: Hourly, daily, weekly, monthly
- **Manual**: On-demand refresh

**Capacity**:
- 10 GB free per user (Enterprise edition)
- Additional capacity: $0.25/GB/month
- Up to 1 TB per dataset

### When to Use SPICE vs Direct Query

**Use SPICE When**:
- Fast dashboard performance needed
- Data doesn't change frequently
- Large number of concurrent users
- Complex calculations
- Offline access required

**Use Direct Query When**:
- Real-time data required
- Data changes very frequently
- Data size exceeds SPICE limits
- Regulatory requirements (no data copy)
- Federated queries across sources

## Creating Visualizations

### Visualization Types

**Comparison**:
- Bar charts (vertical, horizontal, stacked)
- Combo charts (bar + line)
- Line charts

**Distribution**:
- Histograms
- Box plots
- Scatter plots

**Composition**:
- Pie charts
- Donut charts
- Tree maps
- Stacked area charts

**Relationship**:
- Scatter plots
- Heat maps
- Bubble charts

**Trends**:
- Line charts
- Area charts
- Combo charts

**Tabular**:
- Tables
- Pivot tables

**Geospatial**:
- Maps (points, heat maps)
- Filled maps (choropleth)

**Advanced**:
- Funnel charts
- Waterfall charts
- KPIs
- Gauges

### AutoGraph

**What is it?**
- AI-powered visualization selection
- Automatically picks best chart type
- Based on selected fields

**How it works**:
1. Select fields for analysis
2. QuickSight suggests visualization
3. Can override with manual selection

## ML Insights

### Built-in ML Features

**1. Anomaly Detection**:
- Automatically detect outliers
- Uses Random Cut Forest algorithm
- Severity ranking
- Drill down to root cause

**Example Use Cases**:
- Sales spikes or drops
- Unusual user activity
- Infrastructure anomalies

**2. Forecasting**:
- Time-series predictions
- Up to 1000 data points ahead
- Confidence intervals
- Seasonal pattern detection

**Configuration**:
```
Forecast Settings:
  - Periods to forecast: 10
  - Confidence interval: 95%
  - Seasonality: Auto-detect or Manual
  - Exclude periods: Holidays, events
```

**3. Narrative Insights**:
- Auto-generated summaries
- Key drivers analysis
- Natural language explanations
- Customizable narratives

**4. ML-Powered Suggestions**:
- Suggested analyses
- Recommended visualizations
- Data preparation suggestions

### Q (Natural Language Query)

**What is Q?**
- Ask questions in plain English
- Get instant visualizations
- No technical knowledge required

**Example Questions**:
- "What were sales last quarter?"
- "Show me top 10 products by revenue"
- "How does this compare to last year?"

**Requirements**:
- Q Topic configuration
- Training on business terminology
- Field mappings

**Pricing**:
- $250/month per reader
- Separate from standard QuickSight pricing

## Row-Level Security (RLS)

### What is RLS?

**Purpose**:
- Control data access at row level
- Different users see different data
- Same dashboard, personalized data

**Implementation Methods**:

**1. Dataset Rules**:
```
User: john@example.com
Filter: Region = 'East'

User: jane@example.com  
Filter: Region = 'West'
```

**2. Manifest File** (for multiple rules):
```json
{
  "UserName": "john@example.com",
  "Region": "East",
  "Department": "Sales"
}
```

**Use Cases**:
- Multi-tenant SaaS applications
- Regional data segmentation
- Department-specific views
- Customer-specific dashboards

## Embedding QuickSight

### Embedded Dashboards

**Purpose**:
- Embed QuickSight in web applications
- Provide analytics without QuickSight login
- Branded user experience

**Implementation**:
```javascript
var params = {
    url: "https://quicksight.aws.amazon.com/...",
    container: document.getElementById("dashboardContainer"),
    height: "600px",
    width: "100%"
};

QuickSightEmbedding.embedDashboard(params);
```

**Authentication Methods**:
- IAM (for AWS users)
- Anonymous embedding (public dashboards)
- Custom identity (SAML, OpenID Connect)

**Pricing**:
- Reader sessions: $0.30 per session (up to 30 min)
- Author sessions: Higher pricing

### Embedding Use Cases

**SaaS Applications**:
- Customer analytics portals
- Multi-tenant reporting
- Self-service BI for customers

**Internal Applications**:
- Corporate portals
- Custom dashboards
- Workflow integrations

## Advanced Features

### Calculated Fields

**Types**:
- **Simple**: field1 + field2
- **Aggregate**: sum(sales), avg(price)
- **Conditional**: ifelse(condition, value1, value2)
- **String**: concat, substring, upper, lower
- **Date**: addDateTime, dateDiff, truncDate

**Example**:
```
Profit Margin = (Revenue - Cost) / Revenue * 100
Year-over-Year Growth = (ThisYear - LastYear) / LastYear * 100
```

### Parameters

**What are Parameters?**
- Dynamic values for filtering
- User-controlled inputs
- What-if analysis

**Example**:
```
Parameter: Growth_Rate (default: 0.05)
Calculated Field: Projected_Sales = Sales * (1 + Growth_Rate)
```

**Controls**:
- Dropdowns
- Sliders
- Text inputs
- Date pickers

### Drill-Downs

**Hierarchy Navigation**:
```
Year → Quarter → Month → Day
Country → State → City → Zip Code
Category → Subcategory → Product
```

**Configuration**:
- Define field hierarchies
- Enable drill-down in visuals
- Automatic or custom navigation

### Themes

**Custom Branding**:
- Colors and fonts
- Logo placement
- Consistent styling across dashboards

**Components**:
- Data colors
- Background colors
- Font families and sizes
- Border styles

## User Management and Permissions

### User Types

**Standard Edition**:
- **Author**: Create analyses and dashboards
  - $12/month/user
- **Reader**: View dashboards only
  - $0.30/session (up to 30 min)

**Enterprise Edition**:
- **Author**: Create and share
  - $18/month/user
- **Reader**: View dashboards
  - $5/month/user or $0.30/session
- **Admin**: Manage QuickSight account

### Permissions

**Asset Permissions**:
- Dataset: View, Edit, Share
- Analysis: View, Edit, Share
- Dashboard: View, Share

**Folder Permissions**:
- Organize assets
- Inherited permissions
- Bulk permission management

**Row-Level Security**:
- Data-level access control
- User-specific filtering

## Monitoring and Management

### CloudWatch Integration

**Metrics**:
- API request counts
- Error rates
- Dataset refresh status
- SPICE capacity usage

**Alarms**:
- Failed dataset refreshes
- High error rates
- Capacity thresholds

### Audit and Logging

**CloudTrail Events**:
- User actions
- API calls
- Configuration changes
- Dashboard views

**Use Cases**:
- Compliance auditing
- Security monitoring
- Usage tracking

## Performance Optimization

### Best Practices

**1. Use SPICE**:
- Faster than direct query
- Enable for frequently accessed dashboards
- Schedule refreshes during off-peak hours

**2. Optimize Datasets**:
- Remove unnecessary columns
- Filter at source (pushdown predicates)
- Use appropriate data types
- Avoid over-joining

**3. Efficient Visuals**:
- Limit data points per visual
- Use filters to reduce data
- Avoid too many visuals per sheet
- Use parameters for interactivity

**4. Incremental Refresh**:
- Update only changed data
- Reduces refresh time
- Lower data source load

**5. Pre-Aggregate Data**:
- Aggregate at source when possible
- Use materialized views
- Create summary datasets

## Security

### Encryption

**At Rest**:
- SPICE data encrypted by default
- AWS managed keys
- No customer configuration needed

**In Transit**:
- HTTPS/TLS for all connections
- Encrypted data transfer

### Network Security

**VPC Connectivity**:
- Connect to VPC resources
- Use Elastic Network Interface (ENI)
- Security group controls

**Private VPC Access**:
```
QuickSight → VPC ENI → Private Subnet → RDS/Redshift
```

### Authentication

**AWS IAM**:
- Integrated with IAM
- Federated access (SAML, OpenID)
- MFA support

**Active Directory**:
- Microsoft AD integration
- SSO for enterprise users

## Cost Optimization

### Pricing Model

**Standard Edition**:
- Authors: $12/user/month
- Readers: $0.30/session (max $5/month)

**Enterprise Edition**:
- Authors: $18/user/month
- Readers: $5/user/month OR $0.30/session
- Additional SPICE: $0.25/GB/month
- Q: $250/reader/month

**Embedded Analytics**:
- Session-based pricing
- $0.30 per 30-minute session

### Cost Reduction Strategies

**1. Choose Right Edition**:
- Standard for small teams
- Enterprise for large organizations

**2. Reader Pricing**:
- Per-session for occasional users
- Monthly for frequent users
- Breakeven: ~17 sessions/month

**3. SPICE Optimization**:
- Remove unused datasets
- Clean up old data
- Use incremental refresh
- Optimize data models

**4. Resource Management**:
- Delete unused analyses
- Archive old dashboards
- Consolidate similar dashboards

## Integration Patterns

### Data Lake Analytics

```
S3 Data Lake → Glue Crawler → Athena → QuickSight (SPICE)
                                            ↓
                                     Dashboards
```

### Real-Time Dashboards

```
Application → Kinesis → Lambda → RDS
                                  ↓
                          QuickSight (Direct Query)
```

### Multi-Source BI

```
Salesforce ┐
RDS        ├→ QuickSight → Combined Dataset → Dashboard
Redshift   ┘
```

### Embedded Analytics

```
SaaS Application → API Gateway → Lambda → QuickSight Embedding API
                                               ↓
                                    Embedded Dashboard (iframe)
```

## Best Practices for SAP-C02

### Design Principles

1. **Use SPICE for Performance**
   - Import frequently accessed data
   - Schedule off-peak refreshes
   - Monitor SPICE capacity

2. **Implement Row-Level Security**
   - Segment data by user/customer
   - Use dataset rules or manifests
   - Test thoroughly before deployment

3. **Optimize Data Sources**
   - Pre-aggregate at source
   - Use views and materialized views
   - Minimize joins in QuickSight

4. **Leverage ML Insights**
   - Enable anomaly detection
   - Use forecasting for trends
   - Add narrative insights

5. **Embed Strategically**
   - Use for SaaS applications
   - Implement proper authentication
   - Monitor session costs

### Common Exam Scenarios

**Scenario 1**: Cost-Effective BI for Occasional Users
- **Solution**: QuickSight with per-session reader pricing

**Scenario 2**: Real-Time Dashboard on Data Lake
- **Solution**: S3 → Athena → QuickSight with SPICE, scheduled refresh

**Scenario 3**: Multi-Tenant SaaS Analytics
- **Solution**: QuickSight embedded dashboards with RLS, per-session pricing

**Scenario 4**: Fast Interactive Dashboards
- **Solution**: Import data to SPICE, use calculated fields, enable ML insights

**Scenario 5**: Secure Access to Private Databases
- **Solution**: QuickSight VPC connection to RDS in private subnet

## QuickSight vs Other BI Tools

| Feature | QuickSight | Tableau | Power BI | Looker |
|---------|------------|---------|----------|--------|
| **Hosting** | AWS Cloud | Cloud/On-prem | Cloud/On-prem | Cloud |
| **Pricing** | Session-based | User-based | User-based | User-based |
| **ML Features** | Built-in | Limited | Azure ML | Limited |
| **Embedding** | Native | Yes | Yes | Yes |
| **AWS Integration** | Excellent | Good | Good | Good |
| **Learning Curve** | Low | Medium | Low | Medium |

## Quick Reference

### Common Operations

**Create Dataset**:
```
Data Sources → Select Source → Configure Connection → Preview Data → Create
```

**Create Analysis**:
```
Datasets → Select Dataset → Create Analysis → Add Visuals → Publish Dashboard
```

**Schedule Refresh**:
```
Dataset → Refresh → Schedule Refresh → Set Frequency → Save
```

### Important Limits

- Max visuals per sheet: 30
- Max sheets per analysis: 20
- Max datasets per analysis: 30
- Max files per upload: 5
- Max file size: 1 GB
- SPICE capacity: 10 GB free per user (Enterprise)
- Max rows in SPICE: Billions (depends on columns)
- Query timeout: 120 seconds (Direct Query)

### Exam Tips

1. **QuickSight is serverless BI**: No infrastructure to manage
2. **SPICE for performance**: In-memory engine, fast queries
3. **Row-Level Security**: Control data access per user
4. **ML-powered insights**: Anomaly detection, forecasting, narratives
5. **Embedded analytics**: Integrate dashboards in applications
6. **Pay-per-session**: Cost-effective for occasional users
7. **AWS integration**: Native support for S3, Athena, Redshift, RDS
8. **VPC connectivity**: Access private databases securely
9. **Q for NLQ**: Natural language queries for non-technical users
10. **Enterprise vs Standard**: Choose based on features needed (RLS, AD integration, capacity)

## Summary

Amazon QuickSight is the serverless BI service for:
- Interactive dashboards and visualizations
- Self-service analytics for business users
- ML-powered insights and forecasting
- Embedded analytics in applications
- Cost-effective BI with session-based pricing

Key strengths: Serverless, SPICE for speed, ML insights, native AWS integration, embedded analytics, pay-per-session pricing, VPC connectivity.
