# Serverless Go Applications

## AWS Lambda

### Lambda Handler
```go
package main

import (
    "context"
    "encoding/json"
    
    "github.com/aws/aws-lambda-go/events"
    "github.com/aws/aws-lambda-go/lambda"
)

type Request struct {
    Name string `json:"name"`
}

type Response struct {
    Message string `json:"message"`
}

func handler(ctx context.Context, request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
    var req Request
    json.Unmarshal([]byte(request.Body), &req)
    
    response := Response{
        Message: "Hello, " + req.Name,
    }
    
    body, _ := json.Marshal(response)
    
    return events.APIGatewayProxyResponse{
        StatusCode: 200,
        Headers: map[string]string{
            "Content-Type": "application/json",
        },
        Body: string(body),
    }, nil
}

func main() {
    lambda.Start(handler)
}
```

### Deployment with SAM
```yaml
# template.yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31

Resources:
  MyFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: .
      Handler: bootstrap
      Runtime: provided.al2
      Architectures:
        - arm64
      MemorySize: 512
      Timeout: 30
      Environment:
        Variables:
          TABLE_NAME: !Ref MyTable
      Events:
        ApiEvent:
          Type: Api
          Properties:
            Path: /hello
            Method: post
```

## Google Cloud Functions

```go
package function

import (
    "encoding/json"
    "net/http"
)

type Message struct {
    Text string `json:"text"`
}

func HelloWorld(w http.ResponseWriter, r *http.Request) {
    var msg Message
    if err := json.NewDecoder(r.Body).Decode(&msg); err != nil {
        http.Error(w, err.Error(), http.StatusBadRequest)
        return
    }
    
    response := map[string]string{
        "message": "Hello, " + msg.Text,
    }
    
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(response)
}
```

## Azure Functions

```go
package main

import (
    "context"
    "encoding/json"
    "log"
    "net/http"
    "os"
)

func main() {
    customHandlerPort, exists := os.LookupEnv("FUNCTIONS_CUSTOMHANDLER_PORT")
    if !exists {
        customHandlerPort = "8080"
    }
    
    http.HandleFunc("/api/HttpTrigger", httpTrigger)
    log.Fatal(http.ListenAndServe(":"+customHandlerPort, nil))
}

func httpTrigger(w http.ResponseWriter, r *http.Request) {
    var req map[string]interface{}
    json.NewDecoder(r.Body).Decode(&req)
    
    response := map[string]string{
        "message": "Hello from Azure Functions",
    }
    
    json.NewEncoder(w).Encode(response)
}
```

## Summary
Serverless Go applications run on AWS Lambda, Google Cloud Functions, or Azure Functions with event-driven architectures and automatic scaling.
