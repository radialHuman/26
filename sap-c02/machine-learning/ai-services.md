# AWS AI/ML Services - Complete Guide for SAP-C02

## Overview

AWS provides a comprehensive suite of AI/ML services that enable developers to add intelligence to applications without deep ML expertise. These services are categorized into three layers:
- **AI Services**: Pre-trained models (no ML expertise needed)
- **ML Services**: Build custom models (SageMaker)
- **ML Frameworks & Infrastructure**: Full control (EC2, containers)

This guide focuses on AI Services for the SAP-C02 exam.

---

## Amazon Rekognition

### What is Rekognition?

Pre-trained computer vision service for image and video analysis using deep learning.

### Key Features
- **Object and Scene Detection**: Identify thousands of objects
- **Facial Analysis**: Detect faces, emotions, demographics
- **Face Comparison**: Match faces across images
- **Face Recognition**: Identify known individuals
- **Celebrity Recognition**: Identify famous people
- **Text in Images (OCR)**: Extract text from images
- **Content Moderation**: Detect inappropriate content
- **PPE Detection**: Detect personal protective equipment
- **Video Analysis**: Analyze stored and streaming video

### Use Cases
- Content moderation for social media
- Searchable image and video libraries
- User verification and authentication
- Surveillance and security
- Retail analytics (customer demographics)
- Media and entertainment (automatic tagging)

### How It Works

**Image Analysis**:
```python
import boto3

rekognition = boto3.client('rekognition')

# Detect labels in image
response = rekognition.detect_labels(
    Image={'S3Object': {'Bucket': 'my-bucket', 'Name': 'photo.jpg'}},
    MaxLabels=10,
    MinConfidence=80
)

for label in response['Labels']:
    print(f"{label['Name']}: {label['Confidence']:.2f}%")
    
# Output:
# Person: 99.87%
# Crowd: 98.32%
# Building: 95.67%
```

**Face Detection and Analysis**:
```python
response = rekognition.detect_faces(
    Image={'S3Object': {'Bucket': 'my-bucket', 'Name': 'person.jpg'}},
    Attributes=['ALL']  # Get all facial attributes
)

for face in response['FaceDetails']:
    print(f"Age Range: {face['AgeRange']['Low']}-{face['AgeRange']['High']}")
    print(f"Gender: {face['Gender']['Value']} ({face['Gender']['Confidence']:.2f}%)")
    print(f"Emotions: {face['Emotions'][0]['Type']} ({face['Emotions'][0]['Confidence']:.2f}%)")
```

**Face Collections** (Face Recognition):
```python
# Create collection
rekognition.create_collection(CollectionId='employee-faces')

# Index faces
rekognition.index_faces(
    CollectionId='employee-faces',
    Image={'S3Object': {'Bucket': 'my-bucket', 'Name': 'john.jpg'}},
    ExternalImageId='john-doe-001',
    DetectionAttributes=['ALL']
)

# Search for face
response = rekognition.search_faces_by_image(
    CollectionId='employee-faces',
    Image={'S3Object': {'Bucket': 'my-bucket', 'Name': 'security-cam.jpg'}},
    FaceMatchThreshold=95,
    MaxFaces=5
)

for match in response['FaceMatches']:
    print(f"Match: {match['Face']['ExternalImageId']} " +
          f"(Similarity: {match['Similarity']:.2f}%)")
```

**Video Analysis**:
```python
# Start video analysis job
response = rekognition.start_label_detection(
    Video={'S3Object': {'Bucket': 'my-bucket', 'Name': 'video.mp4'}},
    NotificationChannel={
        'SNSTopicArn': 'arn:aws:sns:us-east-1:123456789012:RekognitionTopic',
        'RoleArn': 'arn:aws:iam::123456789012:role/RekognitionRole'
    }
)

job_id = response['JobId']

# Get results (after job completes)
response = rekognition.get_label_detection(JobId=job_id)

for label in response['Labels']:
    print(f"Timestamp: {label['Timestamp']}ms - {label['Label']['Name']}")
```

**Content Moderation**:
```python
response = rekognition.detect_moderation_labels(
    Image={'S3Object': {'Bucket': 'my-bucket', 'Name': 'content.jpg'}},
    MinConfidence=60
)

for label in response['ModerationLabels']:
    print(f"{label['Name']} ({label['ParentName']}): {label['Confidence']:.2f}%")
    
# Examples:
# Explicit Nudity (Explicit): 95.32%
# Violence (Explicit): 87.45%
```

**PPE Detection**:
```python
response = rekognition.detect_protective_equipment(
    Image={'S3Object': {'Bucket': 'my-bucket', 'Name': 'worker.jpg'}},
    SummarizationAttributes={'MinConfidence': 80, 'RequiredEquipmentTypes': ['FACE_COVER', 'HEAD_COVER', 'HAND_COVER']}
)

for person in response['Persons']:
    for body_part in person['BodyParts']:
        for equipment in body_part['EquipmentDetections']:
            print(f"{equipment['Type']}: {equipment['CoversBodyPart']['Value']}")
```

### Architecture Patterns

**Real-time Content Moderation**:
```
User Upload → S3 → Lambda → Rekognition → DynamoDB
                                        ↓
                                    (If inappropriate)
                                        ↓
                                   SNS → Moderation Queue
```

**Video Surveillance**:
```
Kinesis Video Streams → Rekognition Video Stream Processor
                              ↓
                    Face Match Detected → Lambda → Alert
```

---

## Amazon Comprehend

### What is Comprehend?

Natural Language Processing (NLP) service that uses machine learning to find insights and relationships in text.

### Key Features
- **Entity Recognition**: Extract people, places, brands, events
- **Sentiment Analysis**: Positive, negative, neutral, mixed
- **Key Phrase Extraction**: Important phrases in text
- **Language Detection**: Identify language of text
- **Syntax Analysis**: Parts of speech, tokenization
- **Topic Modeling**: Discover topics in document collection
- **Custom Classification**: Train custom models
- **Custom Entity Recognition**: Detect custom entities
- **PII Detection and Redaction**: Find and redact personal information

### Use Cases
- Customer feedback analysis
- Social media monitoring
- Document organization and search
- Call center analytics
- Compliance (PII detection)
- Knowledge management

### How It Works

**Sentiment Analysis**:
```python
import boto3

comprehend = boto3.client('comprehend')

response = comprehend.detect_sentiment(
    Text="I love this product! It's absolutely amazing and works perfectly.",
    LanguageCode='en'
)

print(f"Sentiment: {response['Sentiment']}")
print(f"Scores: {response['SentimentScore']}")

# Output:
# Sentiment: POSITIVE
# Scores: {'Positive': 0.98, 'Negative': 0.01, 'Neutral': 0.01, 'Mixed': 0.00}
```

**Entity Recognition**:
```python
response = comprehend.detect_entities(
    Text="Amazon Web Services was founded by Jeff Bezos in Seattle, Washington.",
    LanguageCode='en'
)

for entity in response['Entities']:
    print(f"{entity['Text']} ({entity['Type']}): {entity['Score']:.2f}")
    
# Output:
# Amazon Web Services (ORGANIZATION): 0.99
# Jeff Bezos (PERSON): 0.99
# Seattle (LOCATION): 0.98
# Washington (LOCATION): 0.97
```

**Key Phrase Extraction**:
```python
response = comprehend.detect_key_phrases(
    Text="The new iPhone features an amazing camera and long battery life.",
    LanguageCode='en'
)

for phrase in response['KeyPhrases']:
    print(f"{phrase['Text']} (Score: {phrase['Score']:.2f})")
    
# Output:
# new iPhone (Score: 0.99)
# amazing camera (Score: 0.98)
# long battery life (Score: 0.97)
```

**PII Detection and Redaction**:
```python
# Detect PII
response = comprehend.detect_pii_entities(
    Text="My name is John Doe and my email is john.doe@example.com. My SSN is 123-45-6789.",
    LanguageCode='en'
)

for entity in response['Entities']:
    print(f"{entity['Type']}: {entity['BeginOffset']}-{entity['EndOffset']}")

# Redact PII
response = comprehend.contain_pii_entities(
    Text="My SSN is 123-45-6789 and phone is 555-1234.",
    LanguageCode='en'
)

print(response['RedactedText'])
# Output: "My SSN is *********** and phone is ********."
```

**Custom Classification** (Async):
```python
# Train custom classifier
response = comprehend.create_document_classifier(
    DocumentClassifierName='support-ticket-classifier',
    DataAccessRoleArn='arn:aws:iam::123456789012:role/ComprehendRole',
    InputDataConfig={
        'S3Uri': 's3://my-bucket/training-data/',
        'DataFormat': 'COMPREHEND_CSV'
    },
    OutputDataConfig={'S3Uri': 's3://my-bucket/output/'},
    LanguageCode='en'
)

# Use classifier
response = comprehend.start_document_classification_job(
    DocumentClassifierArn='arn:aws:comprehend:us-east-1:123456789012:document-classifier/support-ticket-classifier',
    InputDataConfig={'S3Uri': 's3://my-bucket/documents/', 'InputFormat': 'ONE_DOC_PER_LINE'},
    OutputDataConfig={'S3Uri': 's3://my-bucket/classification-output/'},
    DataAccessRoleArn='arn:aws:iam::123456789012:role/ComprehendRole'
)
```

**Topic Modeling**:
```python
response = comprehend.start_topics_detection_job(
    InputDataConfig={'S3Uri': 's3://my-bucket/documents/', 'InputFormat': 'ONE_DOC_PER_FILE'},
    OutputDataConfig={'S3Uri': 's3://my-bucket/topics-output/'},
    DataAccessRoleArn='arn:aws:iam::123456789012:role/ComprehendRole',
    NumberOfTopics=10
)
```

### Architecture Patterns

**Real-time Sentiment Dashboard**:
```
Customer Reviews → API Gateway → Lambda → Comprehend (Sentiment)
                                                ↓
                                            DynamoDB → QuickSight Dashboard
```

**Document Processing Pipeline**:
```
S3 Upload → EventBridge → Lambda → Comprehend (Entities, Key Phrases)
                                        ↓
                                    OpenSearch → Searchable Index
```

---

## Amazon Transcribe

### What is Transcribe?

Automatic speech recognition (ASR) service that converts speech to text.

### Key Features
- **Batch Transcription**: Convert audio/video files to text
- **Streaming Transcription**: Real-time speech-to-text
- **Speaker Identification**: Identify different speakers
- **Custom Vocabulary**: Industry-specific terms
- **Automatic Language Identification**: Detect spoken language
- **Content Redaction**: Redact PII from transcripts
- **Channel Identification**: Separate audio channels
- **Subtitle Generation**: Create VTT/SRT subtitle files

### Supported Formats
- Audio: MP3, MP4, WAV, FLAC, AMR, OGG, WebM
- Video: MP4, MKV, MOV, FLV

### Use Cases
- Call center analytics
- Meeting transcription
- Video captioning
- Voice-controlled applications
- Medical documentation
- Legal proceedings transcription

### How It Works

**Batch Transcription**:
```python
import boto3

transcribe = boto3.client('transcribe')

response = transcribe.start_transcription_job(
    TranscriptionJobName='call-recording-001',
    Media={'MediaFileUri': 's3://my-bucket/call-recording.mp3'},
    MediaFormat='mp3',
    LanguageCode='en-US',
    Settings={
        'ShowSpeakerLabels': True,
        'MaxSpeakerLabels': 2,
        'ChannelIdentification': False,
        'ShowAlternatives': True,
        'MaxAlternatives': 2
    }
)

# Get results
response = transcribe.get_transcription_job(
    TranscriptionJobName='call-recording-001'
)

transcript_uri = response['TranscriptionJob']['Transcript']['TranscriptFileUri']
# Download and parse JSON transcript
```

**Streaming Transcription**:
```python
from amazon_transcribe.client import TranscribeStreamingClient
from amazon_transcribe.handlers import TranscriptResultStreamHandler
from amazon_transcribe.model import TranscriptEvent

class MyEventHandler(TranscriptResultStreamHandler):
    async def handle_transcript_event(self, transcript_event: TranscriptEvent):
        results = transcript_event.transcript.results
        for result in results:
            for alt in result.alternatives:
                print(alt.transcript)

client = TranscribeStreamingClient(region="us-east-1")

stream = await client.start_stream_transcription(
    language_code="en-US",
    media_sample_rate_hz=16000,
    media_encoding="pcm",
)

async for chunk in audio_stream:
    await stream.input_stream.send_audio_event(audio_chunk=chunk)
```

**Custom Vocabulary**:
```python
# Create custom vocabulary
transcribe.create_vocabulary(
    VocabularyName='medical-terms',
    LanguageCode='en-US',
    Phrases=['COVID-19', 'HIPAA', 'acetaminophen', 'electrocardiogram'],
    VocabularyFileUri='s3://my-bucket/medical-vocab.txt'
)

# Use in transcription
response = transcribe.start_transcription_job(
    TranscriptionJobName='medical-consultation-001',
    Media={'MediaFileUri': 's3://my-bucket/consultation.mp3'},
    MediaFormat='mp3',
    LanguageCode='en-US',
    Settings={'VocabularyName': 'medical-terms'}
)
```

**Content Redaction** (PII):
```python
response = transcribe.start_transcription_job(
    TranscriptionJobName='customer-call-001',
    Media={'MediaFileUri': 's3://my-bucket/call.mp3'},
    MediaFormat='mp3',
    LanguageCode='en-US',
    ContentRedaction={
        'RedactionType': 'PII',
        'RedactionOutput': 'redacted_and_unredacted',  # Both versions
        'PiiEntityTypes': ['NAME', 'CREDIT_DEBIT_NUMBER', 'SSN', 'ADDRESS']
    }
)
```

**Subtitle Generation**:
```python
response = transcribe.start_transcription_job(
    TranscriptionJobName='video-caption-001',
    Media={'MediaFileUri': 's3://my-bucket/video.mp4'},
    MediaFormat='mp4',
    LanguageCode='en-US',
    Subtitles={
        'Formats': ['vtt', 'srt'],
        'OutputStartIndex': 1
    },
    OutputBucketName='my-bucket',
    OutputKey='subtitles/'
)
```

### Architecture Patterns

**Call Center Analytics**:
```
Phone Call → Amazon Connect → S3 Recording
                                    ↓
                              Transcribe (with Speaker Labels)
                                    ↓
                              Comprehend (Sentiment)
                                    ↓
                        DynamoDB → Dashboard (Quality Metrics)
```

---

## Amazon Polly

### What is Polly?

Text-to-speech service that converts text into lifelike speech.

### Key Features
- **Neural TTS**: Most natural-sounding voices
- **Standard TTS**: Cost-effective option
- **SSML Support**: Control speech output (emphasis, pronunciation)
- **Speech Marks**: Timing data for lip-sync
- **Lexicons**: Custom pronunciations
- **Multiple Languages**: 60+ voices, 29 languages
- **Voice Customization**: Brand voices (custom)

### Voice Types
- **Neural**: Most realistic (higher cost)
- **Standard**: Good quality (lower cost)
- **Long-form**: Optimized for long content

### Use Cases
- E-learning applications
- Accessibility features
- Voice assistants
- IVR systems
- Audio books
- News readers
- Announcements and notifications

### How It Works

**Basic Speech Synthesis**:
```python
import boto3

polly = boto3.client('polly')

response = polly.synthesize_speech(
    Text='Hello, welcome to AWS Polly. This is a demonstration of text to speech.',
    OutputFormat='mp3',
    VoiceId='Joanna',  # Neural voice
    Engine='neural'
)

# Save audio
with open('speech.mp3', 'wb') as file:
    file.write(response['AudioStream'].read())
```

**SSML for Advanced Control**:
```python
ssml_text = """
<speak>
    Welcome to our store!
    <break time="500ms"/>
    Today's special is <prosody rate="slow">premium coffee</prosody> for only
    <emphasis level="strong">five dollars</emphasis>.
    <break time="300ms"/>
    That's a <prosody pitch="high">great deal</prosody>!
</speak>
"""

response = polly.synthesize_speech(
    Text=ssml_text,
    TextType='ssml',
    OutputFormat='mp3',
    VoiceId='Matthew',
    Engine='neural'
)
```

**Custom Lexicons** (Pronunciation):
```xml
<?xml version="1.0" encoding="UTF-8"?>
<lexicon version="1.0" xmlns="http://www.w3.org/2005/01/pronunciation-lexicon">
    <lexicon>
        <grapheme>AWS</grapheme>
        <alias>Amazon Web Services</alias>
    </lexicon>
    <lexicon>
        <grapheme>SageMaker</grapheme>
        <phoneme>ˈseɪdʒmeɪkər</phoneme>
    </lexicon>
</lexicon>
```

```python
# Upload lexicon
with open('tech-lexicon.xml', 'rb') as lexicon_file:
    polly.put_lexicon(
        Name='TechTerms',
        Content=lexicon_file.read()
    )

# Use lexicon
response = polly.synthesize_speech(
    Text='Learn about AWS SageMaker for machine learning.',
    OutputFormat='mp3',
    VoiceId='Joanna',
    Engine='neural',
    LexiconNames=['TechTerms']
)
```

**Speech Marks** (for lip-sync):
```python
response = polly.synthesize_speech(
    Text='Hello World',
    OutputFormat='json',
    SpeechMarkTypes=['word', 'viseme'],  # Timing data
    VoiceId='Joanna',
    Engine='neural'
)

for line in response['AudioStream'].read().decode().splitlines():
    mark = json.loads(line)
    print(f"{mark['type']}: {mark['value']} at {mark['time']}ms")
    
# Output:
# word: Hello at 0ms
# viseme: p at 50ms
# word: World at 500ms
```

### Architecture Patterns

**Podcast Generator**:
```
RSS Feed → Lambda → Extract Articles → Polly (Convert to Speech)
                                            ↓
                                        S3 (MP3) → CloudFront Distribution
```

---

## Amazon Translate

### What is Translate?

Neural machine translation service for translating text between languages.

### Key Features
- **Real-time Translation**: Low-latency translation
- **Batch Translation**: Translate large documents
- **Custom Terminology**: Industry-specific translations
- **Auto Language Detection**: Detect source language
- **Formality Settings**: Formal/informal translations
- **Profanity Masking**: Mask profane words
- **75+ Languages**: Major global languages supported

### Use Cases
- Website localization
- Real-time chat translation
- Document translation
- Multilingual customer support
- Content internationalization
- E-commerce product descriptions

### How It Works

**Real-time Translation**:
```python
import boto3

translate = boto3.client('translate')

response = translate.translate_text(
    Text='Hello, how can I help you today?',
    SourceLanguageCode='en',
    TargetLanguageCode='es'
)

print(response['TranslatedText'])
# Output: "Hola, ¿cómo puedo ayudarte hoy?"
```

**Auto Language Detection**:
```python
response = translate.translate_text(
    Text='Bonjour le monde',
    SourceLanguageCode='auto',  # Auto-detect
    TargetLanguageCode='en'
)

print(f"Detected: {response['SourceLanguageCode']}")
print(f"Translation: {response['TranslatedText']}")
# Detected: fr
# Translation: Hello world
```

**Batch Translation**:
```python
response = translate.start_text_translation_job(
    InputDataConfig={
        'S3Uri': 's3://my-bucket/documents/',
        'ContentType': 'text/plain'
    },
    OutputDataConfig={'S3Uri': 's3://my-bucket/translations/'},
    DataAccessRoleArn='arn:aws:iam::123456789012:role/TranslateRole',
    SourceLanguageCode='en',
    TargetLanguageCodes=['es', 'fr', 'de', 'it'],  # Multiple targets
    JobName='product-descriptions-translation'
)
```

**Custom Terminology**:
```csv
en,es,fr
AWS,AWS,AWS
SageMaker,SageMaker,SageMaker
EC2,EC2,EC2
```

```python
# Import terminology
translate.import_terminology(
    Name='AWSTerms',
    MergeStrategy='OVERWRITE',
    TerminologyData={
        'File': open('aws-terms.csv', 'rb').read(),
        'Format': 'CSV'
    }
)

# Use in translation
response = translate.translate_text(
    Text='Use AWS SageMaker to build ML models on EC2.',
    SourceLanguageCode='en',
    TargetLanguageCode='es',
    TerminologyNames=['AWSTerms']  # Preserves AWS terms
)
```

**Formality Settings**:
```python
response = translate.translate_text(
    Text='How are you?',
    SourceLanguageCode='en',
    TargetLanguageCode='es',
    Settings={'Formality': 'FORMAL'}  # or 'INFORMAL'
)

# FORMAL: "¿Cómo está usted?"
# INFORMAL: "¿Cómo estás?"
```

---

## Amazon Textract

### What is Textract?

Document analysis service that automatically extracts text, handwriting, and data from scanned documents using machine learning.

### Key Features
- **Text Detection**: Extract printed and handwritten text
- **Form Extraction**: Key-value pairs from forms
- **Table Extraction**: Structured data from tables
- **Document Analysis**: Layout and relationships
- **Query-based Extraction**: Ask questions about documents
- **Identity Document Processing**: Extract data from IDs, passports
- **Receipt/Invoice Processing**: Line items, totals, dates

### Use Cases
- Invoice processing automation
- Identity verification (KYC)
- Medical records digitization
- Loan application processing
- Insurance claims processing
- Contract analysis

### How It Works

**Text Detection**:
```python
import boto3

textract = boto3.client('textract')

response = textract.detect_document_text(
    Document={'S3Object': {'Bucket': 'my-bucket', 'Name': 'invoice.pdf'}}
)

for block in response['Blocks']:
    if block['BlockType'] == 'LINE':
        print(block['Text'])
```

**Form Data Extraction**:
```python
response = textract.analyze_document(
    Document={'S3Object': {'Bucket': 'my-bucket', 'Name': 'application.pdf'}},
    FeatureTypes=['FORMS']
)

# Extract key-value pairs
key_map = {}
value_map = {}
block_map = {}

for block in response['Blocks']:
    block_id = block['Id']
    block_map[block_id] = block
    
    if block['BlockType'] == 'KEY_VALUE_SET':
        if 'KEY' in block['EntityTypes']:
            key_map[block_id] = block
        else:
            value_map[block_id] = block

# Print form fields
for key_id, key_block in key_map.items():
    value_block = find_value(key_block, value_map, block_map)
    key_text = get_text(key_block, block_map)
    value_text = get_text(value_block, block_map)
    print(f"{key_text}: {value_text}")
    
# Output:
# Name: John Doe
# Date of Birth: 01/15/1985
# SSN: 123-45-6789
```

**Table Extraction**:
```python
response = textract.analyze_document(
    Document={'S3Object': {'Bucket': 'my-bucket', 'Name': 'report.pdf'}},
    FeatureTypes=['TABLES']
)

for block in response['Blocks']:
    if block['BlockType'] == 'TABLE':
        # Process table structure
        for relationship in block.get('Relationships', []):
            if relationship['Type'] == 'CHILD':
                for cell_id in relationship['Ids']:
                    cell = block_map[cell_id]
                    # Extract cell data
```

**Query-based Extraction**:
```python
response = textract.analyze_document(
    Document={'S3Object': {'Bucket': 'my-bucket', 'Name': 'contract.pdf'}},
    FeatureTypes=['QUERIES'],
    QueriesConfig={
        'Queries': [
            {'Text': 'What is the contract start date?'},
            {'Text': 'What is the total amount?'},
            {'Text': 'Who is the vendor?'}
        ]
    }
)

for block in response['Blocks']:
    if block['BlockType'] == 'QUERY_RESULT':
        print(f"Answer: {block['Text']}")
```

**Identity Document Analysis**:
```python
response = textract.analyze_id(
    DocumentPages=[
        {'S3Object': {'Bucket': 'my-bucket', 'Name': 'drivers-license.jpg'}}
    ]
)

for document in response['IdentityDocuments']:
    for field in document['IdentityDocumentFields']:
        print(f"{field['Type']['Text']}: {field['ValueDetection']['Text']}")
        
# Output:
# FIRST_NAME: John
# LAST_NAME: Doe
# DATE_OF_BIRTH: 01/15/1985
# DOCUMENT_NUMBER: D12345678
```

---

## Amazon Forecast

### What is Forecast?

Time series forecasting service based on machine learning.

### Key Features
- **Automatic Model Selection**: Chooses best algorithm
- **Multiple Algorithms**: ARIMA, Prophet, DeepAR+, CNN-QR
- **Related Time Series**: Include additional factors
- **Weather Integration**: Built-in weather data
- **Holidays**: Automatic holiday detection
- **Probabilistic Forecasts**: Confidence intervals

### Use Cases
- Demand forecasting (retail, manufacturing)
- Resource planning (workforce, inventory)
- Financial planning
- Energy demand prediction
- Cloud infrastructure capacity planning

### How It Works

**Create Dataset**:
```python
import boto3

forecast = boto3.client('forecast')

response = forecast.create_dataset(
    DatasetName='retail-demand',
    Domain='RETAIL',
    DatasetType='TARGET_TIME_SERIES',
    DataFrequency='D',  # Daily
    Schema={
        'Attributes': [
            {'AttributeName': 'timestamp', 'AttributeType': 'timestamp'},
            {'AttributeName': 'item_id', 'AttributeType': 'string'},
            {'AttributeName': 'demand', 'AttributeType': 'float'}
        ]
    }
)
```

**Import Data**:
```python
response = forecast.create_dataset_import_job(
    DatasetImportJobName='retail-demand-import',
    DatasetArn='arn:aws:forecast:us-east-1:123456789012:dataset/retail-demand',
    DataSource={
        'S3Config': {
            'Path': 's3://my-bucket/historical-demand.csv',
            'RoleArn': 'arn:aws:iam::123456789012:role/ForecastRole'
        }
    },
    TimestampFormat='yyyy-MM-dd'
)
```

**Create Predictor** (Train Model):
```python
response = forecast.create_auto_predictor(
    PredictorName='retail-demand-predictor',
    ForecastHorizon=30,  # Predict 30 days ahead
    ForecastFrequency='D',
    DataConfig={
        'DatasetGroupArn': 'arn:aws:forecast:us-east-1:123456789012:dataset-group/retail-group'
    }
)
```

**Create Forecast**:
```python
response = forecast.create_forecast(
    ForecastName='retail-demand-forecast-jan',
    PredictorArn='arn:aws:forecast:us-east-1:123456789012:predictor/retail-demand-predictor'
)
```

**Query Forecast**:
```python
forecastquery = boto3.client('forecastquery')

response = forecastquery.query_forecast(
    ForecastArn='arn:aws:forecast:us-east-1:123456789012:forecast/retail-demand-forecast-jan',
    Filters={'item_id': 'product_123'}
)

for prediction in response['Forecast']['Predictions']:
    print(f"Date: {prediction['Timestamp']}, Demand: {prediction['Value']}")
```

---

## Amazon Personalize

### What is Personalize?

Real-time personalization and recommendation service.

### Key Features
- **User Personalization**: Personalized item rankings
- **Similar Items**: Item-to-item recommendations
- **Personalized Ranking**: Rerank items for user
- **Batch Recommendations**: Generate for all users
- **Real-time Events**: Update recommendations instantly
- **Trending Now**: Popular items
- **AutoML**: Automatic recipe selection

### Use Cases
- Product recommendations (e-commerce)
- Content recommendations (media, news)
- Personalized search results
- Email campaign personalization
- Targeted marketing

### How It Works

**Create Dataset**:
```python
import boto3

personalize = boto3.client('personalize')

# Interactions dataset
response = personalize.create_schema(
    name='interactions-schema',
    schema=json.dumps({
        'type': 'record',
        'name': 'Interactions',
        'namespace': 'com.amazonaws.personalize.schema',
        'fields': [
            {'name': 'USER_ID', 'type': 'string'},
            {'name': 'ITEM_ID', 'type': 'string'},
            {'name': 'TIMESTAMP', 'type': 'long'},
            {'name': 'EVENT_TYPE', 'type': 'string'}
        ]
    })
)

response = personalize.create_dataset(
    name='interactions-dataset',
    schemaArn=schema_arn,
    datasetGroupArn=dataset_group_arn,
    datasetType='Interactions'
)
```

**Import Data**:
```python
response = personalize.create_dataset_import_job(
    jobName='interactions-import',
    datasetArn=dataset_arn,
    dataSource={
        'dataLocation': 's3://my-bucket/interactions.csv'
    },
    roleArn='arn:aws:iam::123456789012:role/PersonalizeRole'
)
```

**Create Solution** (Train Model):
```python
response = personalize.create_solution(
    name='product-recommendations',
    datasetGroupArn=dataset_group_arn,
    recipeArn='arn:aws:personalize:::recipe/aws-user-personalization'
)

response = personalize.create_solution_version(
    solutionArn=solution_arn
)
```

**Deploy Campaign**:
```python
response = personalize.create_campaign(
    name='product-recommendations-campaign',
    solutionVersionArn=solution_version_arn,
    minProvisionedTPS=10  # Transactions per second
)
```

**Get Recommendations**:
```python
personalizeRt = boto3.client('personalize-runtime')

response = personalizeRt.get_recommendations(
    campaignArn=campaign_arn,
    userId='user123',
    numResults=10
)

for item in response['itemList']:
    print(f"Recommended: {item['itemId']} (score: {item['score']})")
```

**Real-time Events**:
```python
# Track user interaction
response = personalizeRt.put_events(
    trackingId='tracking-id',
    userId='user123',
    sessionId='session456',
    eventList=[
        {
            'eventType': 'click',
            'sentAt': datetime.now().timestamp(),
            'properties': json.dumps({
                'itemId': 'product789'
            })
        }
    ]
)
```

---

## Amazon Kendra

### What is Kendra?

Intelligent enterprise search service powered by machine learning.

### Key Features
- **Natural Language Understanding**: Ask questions naturally
- **Connector Support**: 40+ data sources (S3, SharePoint, Confluence, etc.)
- **Document Ranking**: ML-based relevance ranking
- **Incremental Learning**: Improves with user feedback
- **FAQ Support**: Direct answers from FAQs
- **Document Enrichment**: Metadata extraction
- **Query Suggestions**: Auto-complete and suggestions
- **User Context**: Personalized search results

### Use Cases
- Enterprise knowledge base search
- Customer support documentation
- Intranet search
- Research and discovery
- Compliance and legal document search

### How It Works

**Create Index**:
```python
import boto3

kendra = boto3.client('kendra')

response = kendra.create_index(
    Name='enterprise-search',
    RoleArn='arn:aws:iam::123456789012:role/KendraRole',
    Edition='ENTERPRISE_EDITION'  # or DEVELOPER_EDITION
)
```

**Add Data Source** (S3):
```python
response = kendra.create_data_source(
    IndexId=index_id,
    Name='s3-documents',
    Type='S3',
    Configuration={
        'S3Configuration': {
            'BucketName': 'my-documents-bucket',
            'InclusionPrefixes': ['public/', 'knowledge-base/'],
            'DocumentsMetadataConfiguration': {
                'S3Prefix': 'metadata/'
            }
        }
    },
    RoleArn='arn:aws:iam::123456789012:role/KendraRole'
)

# Start sync
response = kendra.start_data_source_sync_job(
    Id=data_source_id,
    IndexId=index_id
)
```

**Query Index**:
```python
response = kendra.query(
    IndexId=index_id,
    QueryText='How do I reset my password?',
    AttributeFilter={
        'AndAllFilters': [
            {'EqualsTo': {'Key': '_language_code', 'Value': {'StringValue': 'en'}}},
            {'EqualsTo': {'Key': 'category', 'Value': {'StringValue': 'IT Support'}}}
        ]
    }
)

for result in response['ResultItems']:
    if result['Type'] == 'ANSWER':
        print(f"Answer: {result['DocumentExcerpt']['Text']}")
    elif result['Type'] == 'DOCUMENT':
        print(f"Document: {result['DocumentTitle']['Text']}")
        print(f"Excerpt: {result['DocumentExcerpt']['Text']}")
        print(f"URI: {result['DocumentURI']}")
```

**Submit Feedback**:
```python
response = kendra.submit_feedback(
    IndexId=index_id,
    QueryId=query_id,
    ClickFeedbackItems=[
        {
            'ResultId': result_id,
            'ClickTime': datetime.now()
        }
    ],
    RelevanceFeedbackItems=[
        {
            'ResultId': result_id,
            'RelevanceValue': 'RELEVANT'  # or NOT_RELEVANT
        }
    ]
)
```

---

## Integration Patterns for SAP-C02

### Pattern 1: Intelligent Document Processing
```
Document Upload (S3)
      ↓
  S3 Event → Lambda
      ↓
  Textract (Extract text/forms/tables)
      ↓
  Comprehend (Entity extraction, PII detection)
      ↓
  DynamoDB (Store structured data)
      ↓
  Kendra (Index for search)
      ↓
  SNS (Notify completion)
```

### Pattern 2: Multilingual Customer Support
```
Customer Message
      ↓
  Comprehend (Detect language, sentiment, entities)
      ↓
  Translate (If needed, translate to English)
      ↓
  Kendra (Search knowledge base)
      ↓
  Translate (Translate response to customer language)
      ↓
  Response to Customer
```

### Pattern 3: Media Content Analysis
```
Video Upload (S3)
      ↓
  EventBridge → Step Functions
      ├─ Transcribe (Speech → Text)
      ├─ Rekognition (Video analysis)
      └─ Comprehend (Text analysis)
      ↓
  Aggregate Results → OpenSearch
      ↓
  Searchable Media Library
```

### Pattern 4: Personalized E-commerce
```
User Browsing
      ↓
  Personalize Events (real-time tracking)
      ↓
  Personalize (Get recommendations)
      ↓
  Translate (Multi-language product descriptions)
      ↓
  Display Personalized Products
```

---

## Key Takeaways for SAP-C02

1. **Service Selection**
   - **Text from Images**: Textract (documents with structure) vs Rekognition (labels, OCR)
   - **NLP**: Comprehend (general) vs Custom (specific domain)
   - **Speech**: Transcribe (speech-to-text) vs Polly (text-to-speech)
   - **ML**: SageMaker (custom) vs AI Services (pre-trained)

2. **Cost Optimization**
   - Batch processing is cheaper than real-time (Transcribe, Translate, Textract)
   - Cache results when possible
   - Use appropriate edition (Kendra: Developer vs Enterprise)
   - Personalize: Manage provisioned TPS

3. **Integration**
   - All services integrate with S3 for input/output
   - Lambda for orchestration
   - Step Functions for complex workflows
   - EventBridge for event-driven architecture

4. **Security**
   - VPC endpoints for private access
   - IAM roles for service permissions
   - KMS encryption for data at rest
   - TLS for data in transit

5. **Scalability**
   - Services auto-scale automatically
   - Use batch processing for large workloads
   - Asynchronous processing for non-real-time needs
   - Consider quotas and limits

6. **Accuracy Improvement**
   - Custom vocabulary (Transcribe)
   - Custom terminology (Translate)
   - Custom lexicons (Polly)
   - Custom classifiers (Comprehend)
   - User feedback (Kendra, Personalize)

7. **Compliance**
   - PII detection/redaction (Comprehend, Transcribe, Textract)
   - Data residency (regional services)
   - Audit with CloudTrail
   - HIPAA, PCI-DSS eligible services
