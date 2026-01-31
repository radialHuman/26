# File Upload Handling

## What is File Upload?

**File uploads** allow users to send files (images, documents, videos) to your server:
- **User Avatars**: Profile pictures
- **Documents**: PDFs, Word files, spreadsheets
- **Media**: Images, videos, audio
- **Attachments**: Email attachments, support tickets
- **Bulk Data**: CSV imports, data migrations

## Why Handle Properly?

Poor file handling leads to:
- **Security Vulnerabilities**: Malicious files, path traversal
- **Storage Issues**: Unlimited uploads, disk full
- **Performance Problems**: Large file blocking requests
- **Data Loss**: Corrupted or incomplete uploads

## Basic File Upload (Gin)

### Single File Upload

```go
package main

import (
    "fmt"
    "net/http"
    "path/filepath"
    
    "github.com/gin-gonic/gin"
    "github.com/google/uuid"
)

func uploadFile(c *gin.Context) {
    // Single file
    file, err := c.FormFile("file")
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "No file uploaded"})
        return
    }
    
    // Validate file size (max 5MB)
    if file.Size > 5*1024*1024 {
        c.JSON(http.StatusBadRequest, gin.H{"error": "File too large (max 5MB)"})
        return
    }
    
    // Generate unique filename
    ext := filepath.Ext(file.Filename)
    newFilename := uuid.New().String() + ext
    
    // Save to disk
    dst := filepath.Join("./uploads", newFilename)
    if err := c.SaveUploadedFile(file, dst); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"})
        return
    }
    
    c.JSON(http.StatusOK, gin.H{
        "message":  "File uploaded successfully",
        "filename": newFilename,
        "size":     file.Size,
    })
}

func main() {
    r := gin.Default()
    
    // Limit upload size (default 32MB)
    r.MaxMultipartMemory = 8 << 20 // 8 MiB
    
    r.POST("/upload", uploadFile)
    
    r.Run(":8080")
}
```

### Multiple File Upload

```go
func uploadMultipleFiles(c *gin.Context) {
    // Get form
    form, err := c.MultipartForm()
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid form"})
        return
    }
    
    // Get files
    files := form.File["files"]
    
    if len(files) == 0 {
        c.JSON(http.StatusBadRequest, gin.H{"error": "No files uploaded"})
        return
    }
    
    // Limit number of files
    if len(files) > 10 {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Too many files (max 10)"})
        return
    }
    
    var uploadedFiles []map[string]interface{}
    
    for _, file := range files {
        // Validate each file
        if file.Size > 5*1024*1024 {
            continue // Skip files > 5MB
        }
        
        // Generate unique filename
        ext := filepath.Ext(file.Filename)
        newFilename := uuid.New().String() + ext
        dst := filepath.Join("./uploads", newFilename)
        
        // Save file
        if err := c.SaveUploadedFile(file, dst); err != nil {
            continue // Skip on error
        }
        
        uploadedFiles = append(uploadedFiles, map[string]interface{}{
            "original_name": file.Filename,
            "saved_name":    newFilename,
            "size":          file.Size,
        })
    }
    
    c.JSON(http.StatusOK, gin.H{
        "message": "Files uploaded successfully",
        "files":   uploadedFiles,
        "count":   len(uploadedFiles),
    })
}
```

## File Validation

### Validate File Type

```go
package validation

import (
    "errors"
    "mime/multipart"
    "net/http"
    "path/filepath"
    "strings"
)

var (
    ImageTypes = map[string]bool{
        "image/jpeg": true,
        "image/png":  true,
        "image/gif":  true,
        "image/webp": true,
    }
    
    DocumentTypes = map[string]bool{
        "application/pdf":                                                      true,
        "application/msword":                                                   true,
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document": true,
        "application/vnd.ms-excel":                                             true,
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":    true,
    }
)

func ValidateFileType(file *multipart.FileHeader, allowedTypes map[string]bool) error {
    // Check MIME type from header
    contentType := file.Header.Get("Content-Type")
    if !allowedTypes[contentType] {
        return errors.New("invalid file type")
    }
    
    // Verify by reading file content (more secure)
    src, err := file.Open()
    if err != nil {
        return err
    }
    defer src.Close()
    
    // Read first 512 bytes to detect content type
    buffer := make([]byte, 512)
    _, err = src.Read(buffer)
    if err != nil {
        return err
    }
    
    detectedType := http.DetectContentType(buffer)
    if !allowedTypes[detectedType] {
        return errors.New("file content doesn't match extension")
    }
    
    return nil
}

func ValidateImageExtension(filename string) error {
    ext := strings.ToLower(filepath.Ext(filename))
    
    allowedExts := map[string]bool{
        ".jpg":  true,
        ".jpeg": true,
        ".png":  true,
        ".gif":  true,
        ".webp": true,
    }
    
    if !allowedExts[ext] {
        return errors.New("invalid file extension")
    }
    
    return nil
}

// Usage
func uploadImage(c *gin.Context) {
    file, _ := c.FormFile("image")
    
    // Validate extension
    if err := ValidateImageExtension(file.Filename); err != nil {
        c.JSON(400, gin.H{"error": err.Error()})
        return
    }
    
    // Validate content type
    if err := ValidateFileType(file, ImageTypes); err != nil {
        c.JSON(400, gin.H{"error": err.Error()})
        return
    }
    
    // File is valid, proceed with upload
}
```

## Image Processing

```bash
go get github.com/disintegration/imaging
```

```go
package images

import (
    "image"
    "mime/multipart"
    "path/filepath"
    
    "github.com/disintegration/imaging"
    "github.com/google/uuid"
)

type ImageProcessor struct {
    UploadDir string
}

func NewImageProcessor(uploadDir string) *ImageProcessor {
    return &ImageProcessor{UploadDir: uploadDir}
}

// Resize image
func (p *ImageProcessor) ProcessAndSave(file *multipart.FileHeader, maxWidth, maxHeight int) (string, error) {
    // Open file
    src, err := file.Open()
    if err != nil {
        return "", err
    }
    defer src.Close()
    
    // Decode image
    img, err := imaging.Decode(src)
    if err != nil {
        return "", err
    }
    
    // Get original dimensions
    bounds := img.Bounds()
    width := bounds.Dx()
    height := bounds.Dy()
    
    // Resize if needed (maintain aspect ratio)
    if width > maxWidth || height > maxHeight {
        img = imaging.Fit(img, maxWidth, maxHeight, imaging.Lanczos)
    }
    
    // Generate filename
    filename := uuid.New().String() + ".jpg"
    dst := filepath.Join(p.UploadDir, filename)
    
    // Save as JPEG with quality 90
    err = imaging.Save(img, dst, imaging.JPEGQuality(90))
    if err != nil {
        return "", err
    }
    
    return filename, nil
}

// Create thumbnail
func (p *ImageProcessor) CreateThumbnail(file *multipart.FileHeader, size int) (string, error) {
    src, err := file.Open()
    if err != nil {
        return "", err
    }
    defer src.Close()
    
    img, err := imaging.Decode(src)
    if err != nil {
        return "", err
    }
    
    // Create square thumbnail
    thumb := imaging.Fill(img, size, size, imaging.Center, imaging.Lanczos)
    
    filename := "thumb_" + uuid.New().String() + ".jpg"
    dst := filepath.Join(p.UploadDir, filename)
    
    err = imaging.Save(thumb, dst, imaging.JPEGQuality(85))
    if err != nil {
        return "", err
    }
    
    return filename, nil
}

// Usage
func uploadAvatar(c *gin.Context) {
    file, _ := c.FormFile("avatar")
    
    processor := NewImageProcessor("./uploads/avatars")
    
    // Create full-size image (max 800x800)
    filename, err := processor.ProcessAndSave(file, 800, 800)
    if err != nil {
        c.JSON(500, gin.H{"error": "Failed to process image"})
        return
    }
    
    // Create thumbnail (200x200)
    thumbFilename, err := processor.CreateThumbnail(file, 200)
    if err != nil {
        c.JSON(500, gin.H{"error": "Failed to create thumbnail"})
        return
    }
    
    c.JSON(200, gin.H{
        "image":     filename,
        "thumbnail": thumbFilename,
    })
}
```

## Cloud Storage (AWS S3)

```bash
go get github.com/aws/aws-sdk-go/aws
go get github.com/aws/aws-sdk-go/service/s3
```

```go
package storage

import (
    "bytes"
    "fmt"
    "mime/multipart"
    "net/http"
    "path/filepath"
    "time"
    
    "github.com/aws/aws-sdk-go/aws"
    "github.com/aws/aws-sdk-go/aws/credentials"
    "github.com/aws/aws-sdk-go/aws/session"
    "github.com/aws/aws-sdk-go/service/s3"
    "github.com/google/uuid"
)

type S3Storage struct {
    client *s3.S3
    bucket string
}

func NewS3Storage(region, bucket, accessKey, secretKey string) *S3Storage {
    sess := session.Must(session.NewSession(&aws.Config{
        Region:      aws.String(region),
        Credentials: credentials.NewStaticCredentials(accessKey, secretKey, ""),
    }))
    
    return &S3Storage{
        client: s3.New(sess),
        bucket: bucket,
    }
}

func (s *S3Storage) Upload(file *multipart.FileHeader, folder string) (string, error) {
    // Open file
    src, err := file.Open()
    if err != nil {
        return "", err
    }
    defer src.Close()
    
    // Read file content
    buffer := make([]byte, file.Size)
    src.Read(buffer)
    
    // Generate unique key
    ext := filepath.Ext(file.Filename)
    key := fmt.Sprintf("%s/%s%s", folder, uuid.New().String(), ext)
    
    // Detect content type
    contentType := http.DetectContentType(buffer)
    
    // Upload to S3
    _, err = s.client.PutObject(&s3.PutObjectInput{
        Bucket:        aws.String(s.bucket),
        Key:           aws.String(key),
        Body:          bytes.NewReader(buffer),
        ContentLength: aws.Int64(file.Size),
        ContentType:   aws.String(contentType),
        ACL:           aws.String("public-read"), // Make publicly accessible
    })
    
    if err != nil {
        return "", err
    }
    
    // Return URL
    url := fmt.Sprintf("https://%s.s3.amazonaws.com/%s", s.bucket, key)
    return url, nil
}

func (s *S3Storage) GeneratePresignedURL(key string, expiry time.Duration) (string, error) {
    req, _ := s.client.GetObjectRequest(&s3.GetObjectInput{
        Bucket: aws.String(s.bucket),
        Key:    aws.String(key),
    })
    
    url, err := req.Presign(expiry)
    return url, err
}

func (s *S3Storage) Delete(key string) error {
    _, err := s.client.DeleteObject(&s3.DeleteObjectInput{
        Bucket: aws.String(s.bucket),
        Key:    aws.String(key),
    })
    
    return err
}

// Usage
func uploadToS3(c *gin.Context) {
    file, _ := c.FormFile("file")
    
    storage := NewS3Storage(
        "us-east-1",
        "my-bucket",
        os.Getenv("AWS_ACCESS_KEY"),
        os.Getenv("AWS_SECRET_KEY"),
    )
    
    url, err := storage.Upload(file, "uploads")
    if err != nil {
        c.JSON(500, gin.H{"error": "Upload failed"})
        return
    }
    
    c.JSON(200, gin.H{"url": url})
}
```

## Chunked Upload (Large Files)

For files > 100MB, use chunked uploads.

```go
package upload

import (
    "fmt"
    "io"
    "os"
    "path/filepath"
    
    "github.com/gin-gonic/gin"
    "github.com/google/uuid"
)

type ChunkUpload struct {
    UploadID     string
    Filename     string
    TotalChunks  int
    ChunksDir    string
    receivedChunks map[int]bool
}

var activeUploads = make(map[string]*ChunkUpload)

func initChunkUpload(c *gin.Context) {
    var req struct {
        Filename    string `json:"filename" binding:"required"`
        TotalChunks int    `json:"total_chunks" binding:"required"`
    }
    
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(400, gin.H{"error": err.Error()})
        return
    }
    
    uploadID := uuid.New().String()
    chunksDir := filepath.Join("./uploads/chunks", uploadID)
    os.MkdirAll(chunksDir, 0755)
    
    activeUploads[uploadID] = &ChunkUpload{
        UploadID:       uploadID,
        Filename:       req.Filename,
        TotalChunks:    req.TotalChunks,
        ChunksDir:      chunksDir,
        receivedChunks: make(map[int]bool),
    }
    
    c.JSON(200, gin.H{"upload_id": uploadID})
}

func uploadChunk(c *gin.Context) {
    uploadID := c.Param("upload_id")
    chunkNumber := c.GetInt("chunk_number")
    
    upload, exists := activeUploads[uploadID]
    if !exists {
        c.JSON(404, gin.H{"error": "Upload not found"})
        return
    }
    
    // Get chunk file
    file, err := c.FormFile("chunk")
    if err != nil {
        c.JSON(400, gin.H{"error": "No chunk uploaded"})
        return
    }
    
    // Save chunk
    chunkPath := filepath.Join(upload.ChunksDir, fmt.Sprintf("chunk_%d", chunkNumber))
    if err := c.SaveUploadedFile(file, chunkPath); err != nil {
        c.JSON(500, gin.H{"error": "Failed to save chunk"})
        return
    }
    
    upload.receivedChunks[chunkNumber] = true
    
    // Check if all chunks received
    if len(upload.receivedChunks) == upload.TotalChunks {
        // Merge chunks
        finalPath, err := mergeChunks(upload)
        if err != nil {
            c.JSON(500, gin.H{"error": "Failed to merge chunks"})
            return
        }
        
        // Cleanup
        os.RemoveAll(upload.ChunksDir)
        delete(activeUploads, uploadID)
        
        c.JSON(200, gin.H{
            "message":  "Upload complete",
            "filename": finalPath,
        })
        return
    }
    
    c.JSON(200, gin.H{
        "message": "Chunk received",
        "progress": fmt.Sprintf("%d/%d", len(upload.receivedChunks), upload.TotalChunks),
    })
}

func mergeChunks(upload *ChunkUpload) (string, error) {
    finalPath := filepath.Join("./uploads", upload.Filename)
    finalFile, err := os.Create(finalPath)
    if err != nil {
        return "", err
    }
    defer finalFile.Close()
    
    // Merge chunks in order
    for i := 0; i < upload.TotalChunks; i++ {
        chunkPath := filepath.Join(upload.ChunksDir, fmt.Sprintf("chunk_%d", i))
        chunkFile, err := os.Open(chunkPath)
        if err != nil {
            return "", err
        }
        
        io.Copy(finalFile, chunkFile)
        chunkFile.Close()
    }
    
    return upload.Filename, nil
}
```

## Database Storage

Store file metadata in database.

```go
package models

import (
    "time"
)

type File struct {
    ID           int       `json:"id"`
    UserID       int       `json:"user_id"`
    Filename     string    `json:"filename"`
    OriginalName string    `json:"original_name"`
    Size         int64     `json:"size"`
    MimeType     string    `json:"mime_type"`
    Path         string    `json:"path"`
    URL          string    `json:"url"`
    CreatedAt    time.Time `json:"created_at"`
}

func SaveFileRecord(db *sql.DB, file File) error {
    query := `
        INSERT INTO files (user_id, filename, original_name, size, mime_type, path, url, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `
    
    _, err := db.Exec(query,
        file.UserID,
        file.Filename,
        file.OriginalName,
        file.Size,
        file.MimeType,
        file.Path,
        file.URL,
        time.Now(),
    )
    
    return err
}

// Usage
func uploadWithDB(c *gin.Context) {
    file, _ := c.FormFile("file")
    userID := c.GetInt("user_id")
    
    // Save to disk
    filename := uuid.New().String() + filepath.Ext(file.Filename)
    dst := filepath.Join("./uploads", filename)
    c.SaveUploadedFile(file, dst)
    
    // Save to database
    fileRecord := File{
        UserID:       userID,
        Filename:     filename,
        OriginalName: file.Filename,
        Size:         file.Size,
        MimeType:     file.Header.Get("Content-Type"),
        Path:         dst,
        URL:          "/uploads/" + filename,
    }
    
    err := SaveFileRecord(db, fileRecord)
    if err != nil {
        c.JSON(500, gin.H{"error": "Failed to save file record"})
        return
    }
    
    c.JSON(200, fileRecord)
}
```

## Best Practices

1. **Always Validate**: Size, type, extension
2. **Unique Filenames**: Prevent collisions (UUID)
3. **Limit Upload Size**: Prevent DoS
4. **Sanitize Filenames**: Remove special characters
5. **Scan for Viruses**: Use antivirus for user uploads
6. **Use Cloud Storage**: S3, Google Cloud Storage for scalability
7. **Serve with CDN**: Faster delivery
8. **Implement Quotas**: Per-user storage limits

## Summary

File uploads require:
- **Validation**: Size, type, content
- **Processing**: Resize, compress, convert
- **Storage**: Local, cloud (S3)
- **Security**: Prevent malicious uploads
- **Performance**: Chunked uploads for large files

Critical for user-generated content platforms.
