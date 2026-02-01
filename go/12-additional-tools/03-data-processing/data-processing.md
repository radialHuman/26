# Data Processing and ETL in Go

## CSV Processing

### Reading and Processing CSV
```go
package dataprocessing

import (
    "encoding/csv"
    "io"
    "os"
)

type Record struct {
    ID    string
    Name  string
    Email string
}

func ProcessCSV(filename string, processor func(Record) error) error {
    file, err := os.Open(filename)
    if err != nil {
        return err
    }
    defer file.Close()
    
    reader := csv.NewReader(file)
    
    // Skip header
    if _, err := reader.Read(); err != nil {
        return err
    }
    
    for {
        row, err := reader.Read()
        if err == io.EOF {
            break
        }
        if err != nil {
            return err
        }
        
        record := Record{
            ID:    row[0],
            Name:  row[1],
            Email: row[2],
        }
        
        if err := processor(record); err != nil {
            return err
        }
    }
    
    return nil
}
```

## Batch Processing

### Worker Pool for Batch Jobs
```go
package batch

import (
    "context"
    "sync"
)

type Job struct {
    ID   int
    Data interface{}
}

type Result struct {
    JobID int
    Data  interface{}
    Error error
}

func ProcessBatch(ctx context.Context, jobs []Job, workers int, process func(Job) (interface{}, error)) []Result {
    jobChan := make(chan Job, len(jobs))
    resultChan := make(chan Result, len(jobs))
    
    var wg sync.WaitGroup
    
    // Start workers
    for i := 0; i < workers; i++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            for job := range jobChan {
                data, err := process(job)
                resultChan <- Result{
                    JobID: job.ID,
                    Data:  data,
                    Error: err,
                }
            }
        }()
    }
    
    // Send jobs
    for _, job := range jobs {
        jobChan <- job
    }
    close(jobChan)
    
    // Wait and collect results
    go func() {
        wg.Wait()
        close(resultChan)
    }()
    
    var results []Result
    for result := range resultChan {
        results = append(results, result)
    }
    
    return results
}
```

## Stream Processing

```go
package stream

type Pipeline struct {
    stages []func(interface{}) (interface{}, error)
}

func NewPipeline() *Pipeline {
    return &Pipeline{}
}

func (p *Pipeline) AddStage(stage func(interface{}) (interface{}, error)) *Pipeline {
    p.stages = append(p.stages, stage)
    return p
}

func (p *Pipeline) Process(input interface{}) (interface{}, error) {
    current := input
    var err error
    
    for _, stage := range p.stages {
        current, err = stage(current)
        if err != nil {
            return nil, err
        }
    }
    
    return current, nil
}
```

## Summary
Data processing includes CSV handling, batch processing with worker pools, and stream processing pipelines for ETL workflows in Go.
