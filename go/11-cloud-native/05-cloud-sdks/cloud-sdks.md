# Cloud Provider SDKs for Go

## AWS SDK v2

### S3 Operations
```go
package cloud

import (
    "context"
    "io"
    
    "github.com/aws/aws-sdk-go-v2/config"
    "github.com/aws/aws-sdk-go-v2/service/s3"
)

type S3Client struct {
    client *s3.Client
}

func NewS3Client(ctx context.Context) (*S3Client, error) {
    cfg, err := config.LoadDefaultConfig(ctx)
    if err != nil {
        return nil, err
    }
    
    return &S3Client{
        client: s3.NewFromConfig(cfg),
    }, nil
}

func (s *S3Client) Upload(ctx context.Context, bucket, key string, body io.Reader) error {
    _, err := s.client.PutObject(ctx, &s3.PutObjectInput{
        Bucket: &bucket,
        Key:    &key,
        Body:   body,
    })
    return err
}

func (s *S3Client) Download(ctx context.Context, bucket, key string) (io.ReadCloser, error) {
    result, err := s.client.GetObject(ctx, &s3.GetObjectInput{
        Bucket: &bucket,
        Key:    &key,
    })
    if err != nil {
        return nil, err
    }
    return result.Body, nil
}
```

### DynamoDB Operations
```go
package cloud

import (
    "context"
    
    "github.com/aws/aws-sdk-go-v2/config"
    "github.com/aws/aws-sdk-go-v2/feature/dynamodb/attributevalue"
    "github.com/aws/aws-sdk-go-v2/service/dynamodb"
)

type DynamoDBClient struct {
    client *dynamodb.Client
}

func NewDynamoDBClient(ctx context.Context) (*DynamoDBClient, error) {
    cfg, err := config.LoadDefaultConfig(ctx)
    if err != nil {
        return nil, err
    }
    
    return &DynamoDBClient{
        client: dynamodb.NewFromConfig(cfg),
    }, nil
}

func (d *DynamoDBClient) PutItem(ctx context.Context, tableName string, item interface{}) error {
    av, err := attributevalue.MarshalMap(item)
    if err != nil {
        return err
    }
    
    _, err = d.client.PutItem(ctx, &dynamodb.PutItemInput{
        TableName: &tableName,
        Item:      av,
    })
    return err
}
```

## Google Cloud SDK

### Cloud Storage
```go
package cloud

import (
    "context"
    "io"
    
    "cloud.google.com/go/storage"
)

type GCSClient struct {
    client *storage.Client
}

func NewGCSClient(ctx context.Context) (*GCSClient, error) {
    client, err := storage.NewClient(ctx)
    if err != nil {
        return nil, err
    }
    
    return &GCSClient{client: client}, nil
}

func (g *GCSClient) Upload(ctx context.Context, bucket, object string, content io.Reader) error {
    wc := g.client.Bucket(bucket).Object(object).NewWriter(ctx)
    defer wc.Close()
    
    _, err := io.Copy(wc, content)
    return err
}
```

## Azure SDK

### Blob Storage
```go
package cloud

import (
    "context"
    "io"
    
    "github.com/Azure/azure-sdk-for-go/sdk/storage/azblob"
)

type AzureBlobClient struct {
    client *azblob.Client
}

func NewAzureBlobClient(accountName, accountKey string) (*AzureBlobClient, error) {
    credential, err := azblob.NewSharedKeyCredential(accountName, accountKey)
    if err != nil {
        return nil, err
    }
    
    client, err := azblob.NewClientWithSharedKeyCredential(
        "https://"+accountName+".blob.core.windows.net/",
        credential,
        nil,
    )
    if err != nil {
        return nil, err
    }
    
    return &AzureBlobClient{client: client}, nil
}

func (a *AzureBlobClient) Upload(ctx context.Context, container, blob string, data io.Reader) error {
    _, err := a.client.UploadStream(ctx, container, blob, data, nil)
    return err
}
```

## Summary
Cloud SDKs for AWS, GCP, and Azure provide Go clients for S3/GCS/Blob storage, databases, messaging, and other cloud services with idiomatic interfaces.
