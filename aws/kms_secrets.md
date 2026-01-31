# AWS KMS & Secrets Manager: Encryption and Secret Management

## Table of Contents
1. [Introduction and History](#introduction-and-history)
2. [AWS KMS Fundamentals](#aws-kms-fundamentals)
3. [Customer Master Keys (CMKs)](#customer-master-keys-cmks)
4. [Envelope Encryption](#envelope-encryption)
5. [Key Policies and Grants](#key-policies-and-grants)
6. [AWS Secrets Manager](#aws-secrets-manager)
7. [Parameter Store vs Secrets Manager](#parameter-store-vs-secrets-manager)
8. [Encryption Best Practices](#encryption-best-practices)
9. [LocalStack Examples](#localstack-examples)
10. [Interview Questions](#interview-questions)

---

## Introduction and History

### The Genesis of AWS KMS (2014)

AWS Key Management Service (KMS) was launched in **November 2014** to address the challenge of managing encryption keys at scale. Before KMS, customers had to build custom key management systems or use third-party solutions.

**Key Historical Milestones:**

- **2014**: KMS launched with symmetric encryption
- **2015**: Integration with S3, EBS, RDS for encryption at rest
- **2016**: Import your own key (BYOK) feature added
- **2017**: Custom key stores with CloudHSM
- **2018**: Asymmetric keys support (RSA, ECC)
- **2019**: Multi-Region keys for global applications
- **2020**: Automatic key rotation enabled by default
- **2021**: KMS external key store (XKS) for keys outside AWS
- **2022**: HMAC keys for message authentication
- **2023**: Post-quantum cryptography research integration

**AWS Secrets Manager** launched in **April 2018** to automate secret rotation and centralize secret management.

### Why KMS and Secrets Manager Exist

**Encryption Challenges Without KMS:**
1. **Key Generation**: Creating cryptographically secure keys
2. **Key Storage**: Storing keys securely (not in source code!)
3. **Key Rotation**: Changing keys regularly
4. **Access Control**: Who can use which keys
5. **Audit**: Tracking key usage
6. **Compliance**: Meeting regulatory requirements (HIPAA, PCI-DSS)

**Secret Management Challenges:**
1. **Hardcoded Credentials**: Database passwords in code
2. **Manual Rotation**: Changing passwords requires application restart
3. **Secret Sprawl**: Secrets scattered across config files
4. **No Audit Trail**: Who accessed which secret?

**KMS Solves:**
- Centralized key management
- Integration with 100+ AWS services
- Automatic key rotation
- CloudTrail logging of all key operations
- FIPS 140-2 validated hardware security modules (HSMs)

**Secrets Manager Solves:**
- Automatic secret rotation (Lambda-based)
- Versioning and rollback
- Integration with RDS, Redshift, DocumentDB
- Secrets retrieval via API (no hardcoded credentials)

---

## AWS KMS Fundamentals

### What is KMS?

AWS KMS is a **managed service** that makes it easy to create and control encryption keys. It uses **hardware security modules (HSMs)** to protect keys.

**Core Concepts:**

1. **Customer Master Key (CMK)**: The primary resource in KMS
2. **Data Key**: Encryption key used to encrypt data
3. **Envelope Encryption**: Encrypt data with data key, encrypt data key with CMK
4. **Key Policy**: Resource-based policy controlling key access
5. **Grants**: Temporary permissions for key usage

### KMS Architecture

```
Application
    ↓ Encrypt API call
AWS KMS (Control Plane)
    ↓ Generates data key
HSM (Data Plane - FIPS 140-2)
    ↓ Encrypts data key with CMK
Returns: Plaintext data key + Encrypted data key
    ↓
Application encrypts data with plaintext data key
Stores: Encrypted data + Encrypted data key
```

**Decrypt Flow:**

```
Application retrieves: Encrypted data + Encrypted data key
    ↓ Decrypt API call with encrypted data key
AWS KMS
    ↓ Uses CMK to decrypt data key
Returns: Plaintext data key
    ↓
Application decrypts data with plaintext data key
```

### KMS API Operations

```python
import boto3
import base64

kms = boto3.client('kms', endpoint_url='http://localhost:4566')

# 1. Encrypt small data directly (up to 4 KB)
response = kms.encrypt(
    KeyId='alias/my-key',
    Plaintext=b'Secret password'
)

ciphertext = response['CiphertextBlob']
print(f"Encrypted: {base64.b64encode(ciphertext).decode()}")

# 2. Decrypt
response = kms.decrypt(
    CiphertextBlob=ciphertext
)

plaintext = response['Plaintext']
print(f"Decrypted: {plaintext.decode()}")

# 3. Generate data key (for envelope encryption)
response = kms.generate_data_key(
    KeyId='alias/my-key',
    KeySpec='AES_256'  # 256-bit key
)

plaintext_key = response['Plaintext']  # Use this to encrypt data
encrypted_key = response['CiphertextBlob']  # Store this with encrypted data

# 4. Re-encrypt (change CMK without decrypting data)
response = kms.re_encrypt(
    CiphertextBlob=encrypted_key,
    SourceKeyId='alias/old-key',
    DestinationKeyId='alias/new-key'
)
```

---

## Customer Master Keys (CMKs)

### Key Types

#### 1. AWS Managed CMK

Created automatically when you enable encryption for an AWS service.

```
Key Alias: aws/s3, aws/rds, aws/lambda, etc.
Rotation: Automatic every 3 years (cannot disable)
Cost: Free
Key Policy: Cannot modify (AWS manages)
Deletion: Cannot delete
```

```python
# S3 automatically uses AWS managed key
s3 = boto3.client('s3')

s3.put_object(
    Bucket='my-bucket',
    Key='file.txt',
    Body=b'Sensitive data',
    ServerSideEncryption='aws:kms'  # Uses aws/s3 key
)
```

#### 2. Customer Managed CMK

You create, own, and manage these keys.

```
Key Alias: alias/my-app-key
Rotation: Optional (automatic every year)
Cost: $1/month + $0.03 per 10,000 requests
Key Policy: Full control
Deletion: Scheduled deletion (7-30 day waiting period)
```

```python
# Create customer managed CMK
response = kms.create_key(
    Description='My application encryption key',
    KeyUsage='ENCRYPT_DECRYPT',
    Origin='AWS_KMS',  # KMS creates key material
    MultiRegion=False
)

key_id = response['KeyMetadata']['KeyId']

# Create alias
kms.create_alias(
    AliasName='alias/my-app-key',
    TargetKeyId=key_id
)

# Enable automatic rotation
kms.enable_key_rotation(KeyId=key_id)
```

#### 3. Imported Key Material (BYOK)

You generate key material and import it to KMS.

```
Use Case: Regulatory requirement to generate keys on-premises
Rotation: Manual only
Deletion: Can delete immediately
Risk: You're responsible for key material backup
```

```python
# Step 1: Create CMK without key material
response = kms.create_key(
    Description='Imported key',
    Origin='EXTERNAL'
)

key_id = response['KeyMetadata']['KeyId']

# Step 2: Get import parameters
response = kms.get_parameters_for_import(
    KeyId=key_id,
    WrappingAlgorithm='RSAES_OAEP_SHA_256',
    WrappingKeySpec='RSA_2048'
)

import_token = response['ImportToken']
public_key = response['PublicKey']

# Step 3: Generate key material locally (256-bit AES key)
import os
key_material = os.urandom(32)  # 256 bits

# Step 4: Encrypt key material with public key
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives.serialization import load_der_public_key

public_key_obj = load_der_public_key(public_key, backend=default_backend())
encrypted_key_material = public_key_obj.encrypt(
    key_material,
    padding.OAEP(
        mgf=padding.MGF1(algorithm=hashes.SHA256()),
        algorithm=hashes.SHA256(),
        label=None
    )
)

# Step 5: Import to KMS
kms.import_key_material(
    KeyId=key_id,
    ImportToken=import_token,
    EncryptedKeyMaterial=encrypted_key_material,
    ExpirationModel='KEY_MATERIAL_EXPIRES',
    ValidTo=datetime(2025, 12, 31)  # Expiration date
)
```

#### 4. Custom Key Store (CloudHSM)

Store keys in your own CloudHSM cluster for extra control.

```
Use Case: Regulatory requirement for dedicated HSM
Cost: CloudHSM cluster (~$1.60/hour) + KMS API costs
Control: Complete control over HSM cluster
```

### Symmetric vs Asymmetric CMKs

#### Symmetric Keys (Default)

```
Algorithm: AES-256-GCM
Use Case: Encryption/decryption, envelope encryption
Key Material: Never leaves KMS (FIPS 140-2 boundary)
Performance: Fast
```

```python
# Symmetric key operations
response = kms.create_key(
    KeyUsage='ENCRYPT_DECRYPT',
    KeySpec='SYMMETRIC_DEFAULT'  # AES-256
)
```

#### Asymmetric Keys

```
Algorithms: RSA (2048, 3072, 4096), ECC (NIST P-256, P-384, P-521, secp256k1)
Use Cases: 
  - Digital signatures (verify outside AWS)
  - Encryption (public key can be outside AWS)
  - Cryptocurrency (secp256k1 for Bitcoin/Ethereum)
Key Material: Public key can be downloaded
```

```python
# Asymmetric RSA key
response = kms.create_key(
    KeyUsage='ENCRYPT_DECRYPT',
    KeySpec='RSA_4096'
)

# Get public key
public_key_response = kms.get_public_key(KeyId=key_id)
public_key = public_key_response['PublicKey']

# Encrypt outside AWS with public key (locally)
# Decrypt in AWS with private key (never leaves KMS)

# Asymmetric ECC key for signing
response = kms.create_key(
    KeyUsage='SIGN_VERIFY',
    KeySpec='ECC_NIST_P256'
)

# Sign message
response = kms.sign(
    KeyId=key_id,
    Message=b'Document to sign',
    MessageType='RAW',
    SigningAlgorithm='ECDSA_SHA_256'
)

signature = response['Signature']

# Verify signature (can be done outside AWS with public key)
response = kms.verify(
    KeyId=key_id,
    Message=b'Document to sign',
    MessageType='RAW',
    Signature=signature,
    SigningAlgorithm='ECDSA_SHA_256'
)

print(f"Signature valid: {response['SignatureValid']}")
```

### Key Rotation

**Automatic Rotation (Recommended):**

```python
# Enable automatic rotation (once per year)
kms.enable_key_rotation(KeyId=key_id)

# Check rotation status
response = kms.get_key_rotation_status(KeyId=key_id)
print(f"Rotation enabled: {response['KeyRotationEnabled']}")
```

**How Automatic Rotation Works:**

```
Year 1: CMK key_id (backing key: key_material_v1)
Year 2: CMK key_id (backing key: key_material_v2)  ← New key material
Year 3: CMK key_id (backing key: key_material_v3)  ← New key material

Old encrypted data: KMS automatically uses correct backing key
New encrypted data: Uses latest backing key
No application changes needed!
```

**Manual Rotation (For Asymmetric or Imported Keys):**

```python
def manual_key_rotation(old_key_alias):
    """
    Manual key rotation process
    1. Create new key
    2. Update alias to point to new key
    3. Re-encrypt data with new key
    4. Disable old key after grace period
    """
    # Create new key
    new_key = kms.create_key(Description='Rotated key')
    new_key_id = new_key['KeyMetadata']['KeyId']
    
    # Update alias
    kms.update_alias(
        AliasName=old_key_alias,
        TargetKeyId=new_key_id
    )
    
    # Re-encrypt data (application code)
    # ... re-encrypt all data encrypted with old key ...
    
    # After verification period, disable old key
    # kms.disable_key(KeyId=old_key_id)
    
    return new_key_id
```

---

## Envelope Encryption

### What is Envelope Encryption?

**Envelope Encryption** is the practice of encrypting data with a **data key**, then encrypting the data key with a **master key (CMK)**.

**Why Use Envelope Encryption?**

1. **Performance**: KMS has 4 KB limit per Encrypt API call
2. **Efficiency**: Don't send large data to KMS over network
3. **Cost**: Fewer KMS API calls ($0.03 per 10,000 requests)

### Envelope Encryption Flow

```
┌─────────────────────────────────────────────────────────────┐
│ ENCRYPTION                                                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 1. App calls: GenerateDataKey(KeyId=CMK)                   │
│     ↓                                                       │
│ 2. KMS returns:                                             │
│    - Plaintext data key (256-bit AES)                       │
│    - Encrypted data key (encrypted with CMK)                │
│     ↓                                                       │
│ 3. App encrypts data with plaintext data key (AES-256)      │
│     ↓                                                       │
│ 4. App stores:                                              │
│    - Encrypted data                                         │
│    - Encrypted data key (alongside encrypted data)          │
│     ↓                                                       │
│ 5. App deletes plaintext data key from memory               │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ DECRYPTION                                                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 1. App retrieves: Encrypted data + Encrypted data key       │
│     ↓                                                       │
│ 2. App calls: Decrypt(CiphertextBlob=encrypted_data_key)    │
│     ↓                                                       │
│ 3. KMS returns: Plaintext data key                          │
│     ↓                                                       │
│ 4. App decrypts data with plaintext data key                │
│     ↓                                                       │
│ 5. App deletes plaintext data key from memory               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Implementation (Python)

```python
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend
import os

def encrypt_file(file_path, kms_key_id):
    """Encrypt file using envelope encryption"""
    # Read file data
    with open(file_path, 'rb') as f:
        plaintext_data = f.read()
    
    # Generate data key
    response = kms.generate_data_key(
        KeyId=kms_key_id,
        KeySpec='AES_256'
    )
    
    plaintext_key = response['Plaintext']
    encrypted_key = response['CiphertextBlob']
    
    # Generate IV for AES-GCM
    iv = os.urandom(12)
    
    # Encrypt data with data key
    cipher = Cipher(
        algorithms.AES(plaintext_key),
        modes.GCM(iv),
        backend=default_backend()
    )
    encryptor = cipher.encryptor()
    ciphertext = encryptor.update(plaintext_data) + encryptor.finalize()
    
    # Get authentication tag
    tag = encryptor.tag
    
    # Write encrypted file
    with open(file_path + '.encrypted', 'wb') as f:
        # Format: [encrypted_key_length][encrypted_key][iv][tag][ciphertext]
        f.write(len(encrypted_key).to_bytes(4, 'big'))
        f.write(encrypted_key)
        f.write(iv)
        f.write(tag)
        f.write(ciphertext)
    
    print(f"Encrypted {file_path} -> {file_path}.encrypted")

def decrypt_file(encrypted_file_path):
    """Decrypt file using envelope encryption"""
    with open(encrypted_file_path, 'rb') as f:
        # Read encrypted key
        key_length = int.from_bytes(f.read(4), 'big')
        encrypted_key = f.read(key_length)
        
        # Read IV and tag
        iv = f.read(12)
        tag = f.read(16)
        
        # Read ciphertext
        ciphertext = f.read()
    
    # Decrypt data key with KMS
    response = kms.decrypt(CiphertextBlob=encrypted_key)
    plaintext_key = response['Plaintext']
    
    # Decrypt data with data key
    cipher = Cipher(
        algorithms.AES(plaintext_key),
        modes.GCM(iv, tag),
        backend=default_backend()
    )
    decryptor = cipher.decryptor()
    plaintext = decryptor.update(ciphertext) + decryptor.finalize()
    
    # Write decrypted file
    output_path = encrypted_file_path.replace('.encrypted', '.decrypted')
    with open(output_path, 'wb') as f:
        f.write(plaintext)
    
    print(f"Decrypted {encrypted_file_path} -> {output_path}")
    return plaintext

# Example usage
encrypt_file('sensitive_data.csv', 'alias/my-app-key')
decrypt_file('sensitive_data.csv.encrypted')
```

### Implementation (Go)

```go
package main

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/binary"
	"fmt"
	"io"
	"os"

	"github.com/aws/aws-sdk-go-v2/service/kms"
)

func encryptFile(kmsClient *kms.Client, filePath, keyID string) error {
	// Read file
	data, err := os.ReadFile(filePath)
	if err != nil {
		return err
	}

	// Generate data key
	resp, err := kmsClient.GenerateDataKey(context.TODO(), &kms.GenerateDataKeyInput{
		KeyId:   &keyID,
		KeySpec: types.DataKeySpecAes256,
	})
	if err != nil {
		return err
	}

	plaintextKey := resp.Plaintext
	encryptedKey := resp.CiphertextBlob

	// Create AES-GCM cipher
	block, err := aes.NewCipher(plaintextKey)
	if err != nil {
		return err
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return err
	}

	// Generate nonce
	nonce := make([]byte, gcm.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return err
	}

	// Encrypt data
	ciphertext := gcm.Seal(nonce, nonce, data, nil)

	// Write encrypted file: [key_length][encrypted_key][ciphertext]
	outFile, err := os.Create(filePath + ".encrypted")
	if err != nil {
		return err
	}
	defer outFile.Close()

	// Write encrypted key length
	keyLen := uint32(len(encryptedKey))
	binary.Write(outFile, binary.BigEndian, keyLen)

	// Write encrypted key
	outFile.Write(encryptedKey)

	// Write ciphertext (includes nonce)
	outFile.Write(ciphertext)

	fmt.Printf("Encrypted %s -> %s.encrypted\n", filePath, filePath)
	return nil
}

func decryptFile(kmsClient *kms.Client, encryptedPath string) error {
	// Read encrypted file
	file, err := os.Open(encryptedPath)
	if err != nil {
		return err
	}
	defer file.Close()

	// Read encrypted key length
	var keyLen uint32
	binary.Read(file, binary.BigEndian, &keyLen)

	// Read encrypted key
	encryptedKey := make([]byte, keyLen)
	file.Read(encryptedKey)

	// Read ciphertext
	ciphertext, err := io.ReadAll(file)
	if err != nil {
		return err
	}

	// Decrypt data key with KMS
	resp, err := kmsClient.Decrypt(context.TODO(), &kms.DecryptInput{
		CiphertextBlob: encryptedKey,
	})
	if err != nil {
		return err
	}

	plaintextKey := resp.Plaintext

	// Decrypt data
	block, err := aes.NewCipher(plaintextKey)
	if err != nil {
		return err
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return err
	}

	nonceSize := gcm.NonceSize()
	nonce, ciphertext := ciphertext[:nonceSize], ciphertext[nonceSize:]

	plaintext, err := gcm.Open(nil, nonce, ciphertext, nil)
	if err != nil {
		return err
	}

	// Write decrypted file
	outputPath := strings.TrimSuffix(encryptedPath, ".encrypted") + ".decrypted"
	err = os.WriteFile(outputPath, plaintext, 0644)
	if err != nil {
		return err
	}

	fmt.Printf("Decrypted %s -> %s\n", encryptedPath, outputPath)
	return nil
}
```

---

## Key Policies and Grants

### Key Policies

**Key policies** are resource-based policies attached to CMKs.

**Default Key Policy:**

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "Enable IAM User Permissions",
    "Effect": "Allow",
    "Principal": {
      "AWS": "arn:aws:iam::123456789012:root"
    },
    "Action": "kms:*",
    "Resource": "*"
  }]
}
```

This allows IAM policies to control key access (delegated to IAM).

**Custom Key Policy:**

```python
key_policy = {
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "Allow account root full access",
            "Effect": "Allow",
            "Principal": {"AWS": "arn:aws:iam::123456789012:root"},
            "Action": "kms:*",
            "Resource": "*"
        },
        {
            "Sid": "Allow Lambda to decrypt",
            "Effect": "Allow",
            "Principal": {
                "AWS": "arn:aws:iam::123456789012:role/LambdaExecutionRole"
            },
            "Action": [
                "kms:Decrypt",
                "kms:DescribeKey"
            ],
            "Resource": "*"
        },
        {
            "Sid": "Allow administrators to manage key",
            "Effect": "Allow",
            "Principal": {
                "AWS": "arn:aws:iam::123456789012:role/AdminRole"
            },
            "Action": [
                "kms:Create*",
                "kms:Describe*",
                "kms:Enable*",
                "kms:List*",
                "kms:Put*",
                "kms:Update*",
                "kms:Revoke*",
                "kms:Disable*",
                "kms:Get*",
                "kms:Delete*",
                "kms:ScheduleKeyDeletion",
                "kms:CancelKeyDeletion"
            ],
            "Resource": "*"
        }
    ]
}

# Update key policy
kms.put_key_policy(
    KeyId=key_id,
    PolicyName='default',
    Policy=json.dumps(key_policy)
)
```

### Grants

**Grants** provide temporary, delegatable permissions for KMS keys.

**Use Cases:**
- Service-to-service authorization (S3 → KMS)
- Temporary access (expires automatically)
- Programmatic access delegation

```python
# Create grant allowing S3 to use CMK for encryption
response = kms.create_grant(
    KeyId=key_id,
    GranteePrincipal='arn:aws:iam::123456789012:role/S3AccessRole',
    Operations=[
        'Encrypt',
        'Decrypt',
        'GenerateDataKey'
    ],
    Constraints={
        'EncryptionContextSubset': {
            'Department': 'Finance'
        }
    }
)

grant_token = response['GrantToken']
grant_id = response['GrantId']

# Use grant (pass GrantTokens in KMS API call)
kms.encrypt(
    KeyId=key_id,
    Plaintext=b'Sensitive data',
    GrantTokens=[grant_token],
    EncryptionContext={'Department': 'Finance'}
)

# Revoke grant
kms.revoke_grant(
    KeyId=key_id,
    GrantId=grant_id
)

# List grants
response = kms.list_grants(KeyId=key_id)
for grant in response['Grants']:
    print(f"Grant ID: {grant['GrantId']}")
    print(f"Grantee: {grant['GranteePrincipal']}")
    print(f"Operations: {grant['Operations']}")
```

### Encryption Context

**Encryption context** provides additional authenticated data (AAD) for encryption.

**Benefits:**
1. **Audit**: CloudTrail logs encryption context
2. **Authorization**: Grant/deny based on encryption context
3. **Integrity**: Ensures data is decrypted with same context

```python
# Encrypt with encryption context
response = kms.encrypt(
    KeyId='alias/my-key',
    Plaintext=b'Patient medical records',
    EncryptionContext={
        'patient_id': 'P12345',
        'department': 'cardiology',
        'hospital': 'General Hospital'
    }
)

ciphertext = response['CiphertextBlob']

# Decrypt requires SAME encryption context
response = kms.decrypt(
    CiphertextBlob=ciphertext,
    EncryptionContext={
        'patient_id': 'P12345',
        'department': 'cardiology',
        'hospital': 'General Hospital'
    }
)

# Wrong context = decryption fails
try:
    kms.decrypt(
        CiphertextBlob=ciphertext,
        EncryptionContext={'patient_id': 'WRONG'}
    )
except Exception as e:
    print("Decryption failed: encryption context mismatch")
```

---

## AWS Secrets Manager

### What is Secrets Manager?

AWS Secrets Manager is a service for **storing, retrieving, and rotating secrets** (database credentials, API keys, passwords).

**Features:**
- Automatic rotation (Lambda-based)
- Versioning (AWSCURRENT, AWSPENDING, AWSPREVIOUS)
- Encryption with KMS
- Fine-grained access control
- Integration with RDS, Redshift, DocumentDB

### Creating and Retrieving Secrets

```python
secrets_manager = boto3.client('secretsmanager', endpoint_url='http://localhost:4566')

# Create secret
secrets_manager.create_secret(
    Name='prod/myapp/database',
    Description='Production database credentials',
    SecretString=json.dumps({
        'username': 'admin',
        'password': 'SuperSecret123!',
        'host': 'db.example.com',
        'port': 5432,
        'database': 'myapp'
    }),
    KmsKeyId='alias/my-app-key'  # Encrypt with custom KMS key
)

# Retrieve secret
response = secrets_manager.get_secret_value(SecretId='prod/myapp/database')
secret = json.loads(response['SecretString'])

print(f"Database: {secret['host']}:{secret['port']}")
print(f"Username: {secret['username']}")
print(f"Password: {secret['password']}")
```

### Automatic Rotation

```python
# Enable automatic rotation
secrets_manager.rotate_secret(
    SecretId='prod/myapp/database',
    RotationLambdaARN='arn:aws:lambda:us-east-1:123456789012:function:SecretsManagerRotation',
    RotationRules={
        'AutomaticallyAfterDays': 30
    }
)

# Rotation Lambda function
def lambda_handler(event, context):
    """
    Rotation Lambda (called by Secrets Manager)
    
    Steps:
    1. createSecret: Generate new password
    2. setSecret: Update database with new password
    3. testSecret: Verify new password works
    4. finishSecret: Mark new version as AWSCURRENT
    """
    step = event['Step']
    secret_arn = event['SecretId']
    token = event['ClientRequestToken']
    
    if step == 'createSecret':
        # Generate new password
        new_password = generate_random_password()
        
        # Store new password with AWSPENDING label
        secrets_manager.put_secret_value(
            SecretId=secret_arn,
            ClientRequestToken=token,
            SecretString=json.dumps({'password': new_password}),
            VersionStages=['AWSPENDING']
        )
    
    elif step == 'setSecret':
        # Update database with new password
        pending_secret = get_secret_version(secret_arn, 'AWSPENDING')
        update_database_password(pending_secret['password'])
    
    elif step == 'testSecret':
        # Test connection with new password
        pending_secret = get_secret_version(secret_arn, 'AWSPENDING')
        test_database_connection(pending_secret)
    
    elif step == 'finishSecret':
        # Promote AWSPENDING to AWSCURRENT
        secrets_manager.update_secret_version_stage(
            SecretId=secret_arn,
            VersionStage='AWSCURRENT',
            MoveToVersionId=token,
            RemoveFromVersionId=get_current_version_id(secret_arn)
        )
```

### Secret Versioning

```
AWSCURRENT  → Active version (applications use this)
AWSPENDING  → Rotation in progress
AWSPREVIOUS → Previous version (rollback if needed)
```

```python
# Get specific version
current = secrets_manager.get_secret_value(
    SecretId='prod/myapp/database',
    VersionStage='AWSCURRENT'
)

previous = secrets_manager.get_secret_value(
    SecretId='prod/myapp/database',
    VersionStage='AWSPREVIOUS'
)

# List all versions
response = secrets_manager.list_secret_version_ids(
    SecretId='prod/myapp/database'
)

for version_id, stages in response['Versions'].items():
    print(f"Version: {version_id}, Stages: {stages['VersionStages']}")
```

---

## Parameter Store vs Secrets Manager

| Feature | Parameter Store | Secrets Manager |
|---------|----------------|-----------------|
| **Purpose** | Configuration management | Secret management |
| **Rotation** | Manual only | Automatic (Lambda) |
| **Versioning** | Up to 100 versions | Unlimited |
| **Cost** | Free (standard), $0.05/param/month (advanced) | $0.40/secret/month + $0.05 per 10K API calls |
| **Secret Size** | 4 KB (standard), 8 KB (advanced) | 64 KB |
| **Integration** | CloudFormation, EC2, ECS | RDS, Redshift, DocumentDB |
| **Use Case** | App config, feature flags | Database passwords, API keys |

### When to Use Parameter Store

```python
ssm = boto3.client('ssm')

# Store configuration
ssm.put_parameter(
    Name='/myapp/config/api_endpoint',
    Value='https://api.example.com',
    Type='String'  # String, StringList, SecureString
)

# Store encrypted parameter
ssm.put_parameter(
    Name='/myapp/config/api_key',
    Value='secret-api-key-12345',
    Type='SecureString',  # Encrypted with default KMS key
    KeyId='alias/my-app-key'  # Or custom KMS key
)

# Retrieve parameters
response = ssm.get_parameters(
    Names=[
        '/myapp/config/api_endpoint',
        '/myapp/config/api_key'
    ],
    WithDecryption=True  # Decrypt SecureString parameters
)

for param in response['Parameters']:
    print(f"{param['Name']}: {param['Value']}")

# Get parameters by path
response = ssm.get_parameters_by_path(
    Path='/myapp/config',
    Recursive=True,
    WithDecryption=True
)
```

### When to Use Secrets Manager

Use Secrets Manager when you need:
1. **Automatic rotation**: Database passwords
2. **Fine-grained versioning**: Rollback capability
3. **Cross-region replication**: Multi-region applications
4. **Built-in RDS integration**: Automatic credential management

```python
# Create RDS secret with automatic rotation
secrets_manager.create_secret(
    Name='rds/myapp/master',
    SecretString=json.dumps({
        'engine': 'postgres',
        'username': 'postgres',
        'password': 'InitialPassword123!',
        'host': 'myapp-db.cluster-xyz.us-east-1.rds.amazonaws.com',
        'port': 5432
    })
)

# Attach rotation configuration
secrets_manager.rotate_secret(
    SecretId='rds/myapp/master',
    RotationLambdaARN='arn:aws:serverlessrepo:us-east-1:297356227924:applications/SecretsManagerRDSPostgreSQLRotationSingleUser',
    RotationRules={'AutomaticallyAfterDays': 30}
)
```

---

## Encryption Best Practices

### 1. Encrypt Data at Rest

```python
# S3: Server-side encryption
s3.put_object(
    Bucket='my-bucket',
    Key='sensitive.txt',
    Body=b'Sensitive data',
    ServerSideEncryption='aws:kms',
    SSEKMSKeyId='alias/my-app-key'
)

# EBS: Encrypted volumes
ec2.create_volume(
    AvailabilityZone='us-east-1a',
    Size=100,
    Encrypted=True,
    KmsKeyId='alias/my-app-key'
)

# RDS: Encrypted database
rds.create_db_instance(
    DBInstanceIdentifier='mydb',
    DBInstanceClass='db.t3.micro',
    Engine='postgres',
    MasterUsername='admin',
    MasterUserPassword='TempPassword123!',
    AllocatedStorage=20,
    StorageEncrypted=True,
    KmsKeyId='alias/my-app-key'
)
```

### 2. Encrypt Data in Transit

```python
# Use TLS/HTTPS for all communication
# S3: Deny unencrypted uploads
bucket_policy = {
    "Version": "2012-10-17",
    "Statement": [{
        "Effect": "Deny",
        "Principal": "*",
        "Action": "s3:PutObject",
        "Resource": "arn:aws:s3:::my-bucket/*",
        "Condition": {
            "Bool": {
                "aws:SecureTransport": "false"
            }
        }
    }]
}
```

### 3. Use Least Privilege for Key Access

```json
{
  "Effect": "Allow",
  "Principal": {
    "AWS": "arn:aws:iam::123456789012:role/AppRole"
  },
  "Action": [
    "kms:Decrypt",
    "kms:DescribeKey"
  ],
  "Resource": "*",
  "Condition": {
    "StringEquals": {
      "kms:EncryptionContext:AppName": "MyApp"
    }
  }
}
```

### 4. Enable Key Rotation

```python
# Automatic rotation for customer managed keys
kms.enable_key_rotation(KeyId='alias/my-app-key')

# Monitor rotation status
response = kms.get_key_rotation_status(KeyId='alias/my-app-key')
if not response['KeyRotationEnabled']:
    print("WARNING: Key rotation not enabled!")
```

### 5. Use Encryption Context for Audit

```python
# Encrypt with context
kms.encrypt(
    KeyId='alias/my-key',
    Plaintext=b'Data',
    EncryptionContext={
        'user_id': 'user-123',
        'action': 'purchase',
        'timestamp': str(int(time.time()))
    }
)

# CloudTrail will log encryption context for audit
```

---

## LocalStack Examples

### Complete KMS + Secrets Manager Demo

```python
import boto3
import json
from cryptography.fernet import Fernet

# Initialize clients
kms = boto3.client('kms', endpoint_url='http://localhost:4566')
secrets_manager = boto3.client('secretsmanager', endpoint_url='http://localhost:4566')

# 1. Create KMS key
print("Creating KMS key...")
key_response = kms.create_key(
    Description='Application encryption key',
    KeyUsage='ENCRYPT_DECRYPT'
)
key_id = key_response['KeyMetadata']['KeyId']

# Create alias
kms.create_alias(
    AliasName='alias/demo-key',
    TargetKeyId=key_id
)

# 2. Encrypt data with KMS
print("\nEncrypting data with KMS...")
plaintext = b'Sensitive application data'
encrypt_response = kms.encrypt(
    KeyId='alias/demo-key',
    Plaintext=plaintext
)
ciphertext = encrypt_response['CiphertextBlob']
print(f"Ciphertext length: {len(ciphertext)} bytes")

# 3. Decrypt data
decrypt_response = kms.decrypt(CiphertextBlob=ciphertext)
decrypted = decrypt_response['Plaintext']
print(f"Decrypted: {decrypted.decode()}")

# 4. Envelope encryption with data key
print("\nGenerating data key for envelope encryption...")
data_key_response = kms.generate_data_key(
    KeyId='alias/demo-key',
    KeySpec='AES_256'
)

plaintext_key = data_key_response['Plaintext']
encrypted_key = data_key_response['CiphertextBlob']

# Encrypt large data with data key (using Fernet for simplicity)
f = Fernet(base64.urlsafe_b64encode(plaintext_key))
large_data = b'A' * 10000  # 10 KB data
encrypted_data = f.encrypt(large_data)

print(f"Encrypted {len(large_data)} bytes of data")
print(f"Encrypted data key size: {len(encrypted_key)} bytes")

# 5. Create secret in Secrets Manager
print("\nCreating secret in Secrets Manager...")
secrets_manager.create_secret(
    Name='demo/database/credentials',
    SecretString=json.dumps({
        'username': 'admin',
        'password': 'P@ssw0rd123!',
        'host': 'localhost',
        'port': 5432,
        'database': 'myapp'
    }),
    KmsKeyId=key_id
)

# 6. Retrieve secret
secret_response = secrets_manager.get_secret_value(
    SecretId='demo/database/credentials'
)
secret_data = json.loads(secret_response['SecretString'])
print(f"Retrieved secret: username={secret_data['username']}, host={secret_data['host']}")

# 7. Update secret
print("\nUpdating secret...")
secrets_manager.update_secret(
    SecretId='demo/database/credentials',
    SecretString=json.dumps({
        **secret_data,
        'password': 'NewP@ssw0rd456!'
    })
)

# 8. List secret versions
versions = secrets_manager.list_secret_version_ids(
    SecretId='demo/database/credentials'
)
print(f"Secret has {len(versions['Versions'])} version(s)")

print("\n✓ Demo completed successfully!")
```

---

## Interview Questions

### Q1: Explain envelope encryption and why it's used

**Answer:**

**Envelope Encryption** is encrypting data with a **data key**, then encrypting the data key with a **master key (CMK)**.

**Process:**
```
1. App requests data key from KMS
2. KMS generates:
   - Plaintext data key (256-bit AES)
   - Encrypted data key (encrypted with CMK)
3. App encrypts data locally with plaintext key
4. App stores:
   - Encrypted data
   - Encrypted data key
5. App deletes plaintext key from memory

Decryption:
1. App sends encrypted data key to KMS
2. KMS decrypts data key with CMK
3. KMS returns plaintext data key
4. App decrypts data locally
5. App deletes plaintext key
```

**Why Use Envelope Encryption:**

1. **Performance**: 
   - KMS Encrypt API limited to 4 KB
   - Encrypting large files (GB) would require thousands of API calls
   - Envelope encryption: 1 GenerateDataKey call, encrypt locally

2. **Cost**:
   - KMS: $0.03 per 10,000 requests
   - Encrypting 1 GB file in 4 KB chunks: 262,144 requests = $0.79
   - Envelope encryption: 1 request = $0.000003

3. **Network Efficiency**:
   - Don't send large data to KMS over network
   - Only encrypt small data key with KMS

4. **Key Management**:
   - CMK never leaves KMS (FIPS 140-2 HSM)
   - Data keys can be used locally, then discarded

**Real-World Example:**

S3 server-side encryption with KMS:
```
1. Client uploads file to S3
2. S3 calls KMS: GenerateDataKey(CMK)
3. S3 encrypts file with plaintext data key
4. S3 stores: encrypted file + encrypted data key
5. S3 deletes plaintext data key

On download:
1. S3 calls KMS: Decrypt(encrypted data key)
2. S3 decrypts file with plaintext data key
3. S3 sends plaintext file to client
4. S3 deletes plaintext data key
```

---

### Q2: What's the difference between AWS Managed Keys, Customer Managed Keys, and Imported Keys?

**Answer:**

| Feature | AWS Managed | Customer Managed | Imported (BYOK) |
|---------|------------|-----------------|-----------------|
| **Who Creates** | AWS (automatic) | You | You |
| **Alias** | aws/service (e.g., aws/s3) | custom (alias/my-key) | custom |
| **Key Material** | AWS generates | AWS generates | You generate |
| **Rotation** | Every 3 years (automatic) | Optional (yearly) | Manual only |
| **Key Policy** | Cannot modify | Full control | Full control |
| **Deletion** | Cannot delete | 7-30 day waiting period | Can delete immediately |
| **Cost** | Free | $1/month + API costs | $1/month + API costs |
| **Use Case** | Simple encryption | Custom policies, rotation control | Regulatory compliance |

**When to Use Each:**

**AWS Managed Keys:**
- Default encryption for S3, RDS, EBS
- No key management overhead
- Good for most use cases

```python
# S3 with AWS managed key
s3.put_object(
    Bucket='my-bucket',
    Key='file.txt',
    Body=b'Data',
    ServerSideEncryption='aws:kms'  # Uses aws/s3 key
)
```

**Customer Managed Keys:**
- Need custom key policies (grant access to specific roles)
- Need automatic rotation control
- Need to disable/delete key
- Multi-region replication

```python
# Create customer managed key
response = kms.create_key(Description='My app key')
kms.create_alias(AliasName='alias/my-app', TargetKeyId=response['KeyMetadata']['KeyId'])

# Custom policy
kms.put_key_policy(
    KeyId='alias/my-app',
    PolicyName='default',
    Policy=json.dumps({
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Principal": {"AWS": "arn:aws:iam::123456789012:role/AppRole"},
            "Action": "kms:Decrypt",
            "Resource": "*"
        }]
    })
)
```

**Imported Keys (BYOK):**
- Regulatory requirement to generate keys on-premises
- Need to maintain key material backup
- Must prove key ownership

```python
# Create CMK for imported key material
response = kms.create_key(Origin='EXTERNAL')
# ... import process (get parameters, encrypt key material, import) ...
```

**Key Rotation Comparison:**

```
AWS Managed: Rotates every 3 years (cannot disable)
             Old encrypted data: automatically uses old backing key
             New encrypted data: uses new backing key
             No application changes needed

Customer Managed: Optional yearly rotation
                 Same automatic behavior as AWS managed
                 Can disable rotation

Imported Keys: Manual rotation only
              Must create new CMK, re-encrypt data, update applications
              Your responsibility to track old key material
```

---

### Q3: How would you implement database credential rotation with Secrets Manager?

**Answer:**

**Architecture:**

```
Secrets Manager
    ↓ Triggers rotation (every 30 days)
Lambda Rotation Function
    ↓ Updates credentials
RDS Database
    ↓
Application retrieves credentials from Secrets Manager (not hardcoded)
```

**Implementation Steps:**

**1. Create Secret:**

```python
secrets_manager.create_secret(
    Name='prod/myapp/db',
    Description='Production database credentials',
    SecretString=json.dumps({
        'username': 'app_user',
        'password': 'InitialPassword123!',
        'engine': 'postgres',
        'host': 'myapp.cluster-xyz.us-east-1.rds.amazonaws.com',
        'port': 5432,
        'dbname': 'production'
    })
)
```

**2. Rotation Lambda Function:**

```python
import boto3
import json
import psycopg2
import random
import string

secrets_client = boto3.client('secretsmanager')

def lambda_handler(event, context):
    """
    Rotation Lambda called by Secrets Manager
    
    Steps (executed in order):
    1. createSecret: Generate new password
    2. setSecret: Update database with new password
    3. testSecret: Verify new credentials work
    4. finishSecret: Promote to AWSCURRENT
    """
    arn = event['SecretId']
    token = event['ClientRequestToken']
    step = event['Step']
    
    # Get secret metadata
    metadata = secrets_client.describe_secret(SecretId=arn)
    if token not in metadata['VersionIdsToStages']:
        raise ValueError("Invalid token")
    
    if step == 'createSecret':
        create_secret(arn, token)
    elif step == 'setSecret':
        set_secret(arn, token)
    elif step == 'testSecret':
        test_secret(arn, token)
    elif step == 'finishSecret':
        finish_secret(arn, token)
    else:
        raise ValueError(f"Invalid step: {step}")

def create_secret(arn, token):
    """Generate new password and store as AWSPENDING"""
    # Get current secret
    current = secrets_client.get_secret_value(
        SecretId=arn,
        VersionStage='AWSCURRENT'
    )
    current_dict = json.loads(current['SecretString'])
    
    # Generate new password
    new_password = ''.join(random.choices(
        string.ascii_letters + string.digits + '!@#$%^&*()',
        k=32
    ))
    
    # Store new secret with AWSPENDING label
    current_dict['password'] = new_password
    secrets_client.put_secret_value(
        SecretId=arn,
        ClientRequestToken=token,
        SecretString=json.dumps(current_dict),
        VersionStages=['AWSPENDING']
    )

def set_secret(arn, token):
    """Update database with new password"""
    # Get pending secret
    pending = secrets_client.get_secret_value(
        SecretId=arn,
        VersionId=token,
        VersionStage='AWSPENDING'
    )
    pending_dict = json.loads(pending['SecretString'])
    
    # Get current secret (for admin connection)
    current = secrets_client.get_secret_value(
        SecretId=arn,
        VersionStage='AWSCURRENT'
    )
    current_dict = json.loads(current['SecretString'])
    
    # Connect as admin and update password
    conn = psycopg2.connect(
        host=current_dict['host'],
        port=current_dict['port'],
        database=current_dict['dbname'],
        user=current_dict['username'],
        password=current_dict['password']
    )
    
    cursor = conn.cursor()
    cursor.execute(
        f"ALTER USER {pending_dict['username']} PASSWORD %s",
        (pending_dict['password'],)
    )
    conn.commit()
    conn.close()

def test_secret(arn, token):
    """Verify new credentials work"""
    pending = secrets_client.get_secret_value(
        SecretId=arn,
        VersionId=token,
        VersionStage='AWSPENDING'
    )
    pending_dict = json.loads(pending['SecretString'])
    
    # Test connection with new password
    try:
        conn = psycopg2.connect(
            host=pending_dict['host'],
            port=pending_dict['port'],
            database=pending_dict['dbname'],
            user=pending_dict['username'],
            password=pending_dict['password']
        )
        cursor = conn.cursor()
        cursor.execute('SELECT 1')
        conn.close()
    except Exception as e:
        raise ValueError(f"Failed to connect with new credentials: {e}")

def finish_secret(arn, token):
    """Promote AWSPENDING to AWSCURRENT"""
    # Get current version
    metadata = secrets_client.describe_secret(SecretId=arn)
    current_version = None
    for version, stages in metadata['VersionIdsToStages'].items():
        if 'AWSCURRENT' in stages:
            current_version = version
            break
    
    # Move AWSCURRENT to new version, AWSPREVIOUS to old
    secrets_client.update_secret_version_stage(
        SecretId=arn,
        VersionStage='AWSCURRENT',
        MoveToVersionId=token,
        RemoveFromVersionId=current_version
    )
    
    secrets_client.update_secret_version_stage(
        SecretId=arn,
        VersionStage='AWSPREVIOUS',
        MoveToVersionId=current_version
    )
```

**3. Enable Rotation:**

```python
secrets_manager.rotate_secret(
    SecretId='prod/myapp/db',
    RotationLambdaARN='arn:aws:lambda:us-east-1:123456789012:function:DBRotation',
    RotationRules={
        'AutomaticallyAfterDays': 30
    }
)
```

**4. Application Code (Retrieve Credentials):**

```python
def get_db_connection():
    """Get database connection with rotated credentials"""
    # Retrieve secret
    response = secrets_manager.get_secret_value(SecretId='prod/myapp/db')
    secret = json.loads(response['SecretString'])
    
    # Connect to database
    conn = psycopg2.connect(
        host=secret['host'],
        port=secret['port'],
        database=secret['dbname'],
        user=secret['username'],
        password=secret['password']
    )
    
    return conn

# Application always gets current credentials
conn = get_db_connection()
```

**Benefits:**
- **Zero downtime**: Applications automatically use new credentials
- **Automatic**: Rotates every 30 days without manual intervention
- **Rollback**: If rotation fails, AWSCURRENT remains unchanged
- **Audit**: CloudTrail logs all rotation events

---

### Q4: Explain the difference between encryption at rest and encryption in transit

**Answer:**

**Encryption at Rest:** Protects data stored on disk/storage.

**Encryption in Transit:** Protects data moving between systems over a network.

**Comparison:**

| Aspect | Encryption at Rest | Encryption in Transit |
|--------|-------------------|----------------------|
| **Protects Against** | Stolen disks, unauthorized file access | Network eavesdropping, MITM attacks |
| **Technology** | AES-256, KMS | TLS/SSL, HTTPS, VPN |
| **AWS Services** | S3 SSE, EBS encryption, RDS encryption | HTTPS APIs, VPC VPN, Direct Connect |
| **Performance Impact** | Minimal (hardware acceleration) | Low (TLS handshake overhead) |
| **Compliance** | HIPAA, PCI-DSS require it | Same |

**Encryption at Rest Examples:**

```python
# S3: Server-side encryption
s3.put_object(
    Bucket='my-bucket',
    Key='file.txt',
    Body=b'Data',
    ServerSideEncryption='aws:kms',  # Encrypted on disk
    SSEKMSKeyId='alias/my-key'
)

# EBS: Encrypted volumes
ec2.create_volume(
    AvailabilityZone='us-east-1a',
    Size=100,
    Encrypted=True,  # All data encrypted at rest
    KmsKeyId='alias/my-key'
)

# RDS: Encrypted database
rds.create_db_instance(
    DBInstanceIdentifier='mydb',
    Engine='postgres',
    StorageEncrypted=True,  # Database files encrypted
    KmsKeyId='alias/my-key'
)
```

**Encryption in Transit Examples:**

```python
# HTTPS for S3
s3 = boto3.client('s3', endpoint_url='https://s3.amazonaws.com')  # TLS

# Enforce TLS with bucket policy
bucket_policy = {
    "Version": "2012-10-17",
    "Statement": [{
        "Effect": "Deny",
        "Principal": "*",
        "Action": "s3:*",
        "Resource": "arn:aws:s3:::my-bucket/*",
        "Condition": {
            "Bool": {"aws:SecureTransport": "false"}  # Deny non-HTTPS
        }
    }]
}

# RDS: SSL connection
conn = psycopg2.connect(
    host='mydb.cluster-xyz.us-east-1.rds.amazonaws.com',
    sslmode='require',  # Enforce SSL
    sslrootcert='/path/to/rds-ca-cert.pem'
)

# Lambda to Lambda: HTTPS
invoke_response = lambda_client.invoke(
    FunctionName='other-function',
    InvocationType='RequestResponse'
)
# Always HTTPS (AWS service-to-service)
```

**Best Practice: Use Both**

```
Client (Browser)
    ↓ HTTPS (in transit)
API Gateway
    ↓ TLS (in transit)
Lambda
    ↓ TLS (in transit)
S3
    ↓ SSE-KMS (at rest)
Encrypted on disk
```

**Why Both Matter:**

- **At Rest**: Protects if AWS employee steals disk (compliance requirement)
- **In Transit**: Protects from network sniffer on internet path

**Compliance Requirements:**

PCI-DSS:
- Requirement 3.4: Render PAN unreadable (at rest encryption)
- Requirement 4.1: Use strong cryptography for PAN transmission (in transit)

HIPAA:
- Administrative Safeguards: Encrypt ePHI at rest
- Technical Safeguards: Encrypt ePHI in transit

---

### Q5: How do you secure KMS keys in a multi-account organization?

**Answer:**

**Architecture:**

```
Organization
├─ Security Account (centralized KMS keys)
├─ Development Account
├─ Staging Account
└─ Production Account
```

**Strategy 1: Centralized KMS Keys in Security Account**

**Security Account: Create CMK**

```python
# Security Account (111111111111)
key_policy = {
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "Enable IAM policies",
            "Effect": "Allow",
            "Principal": {"AWS": "arn:aws:iam::111111111111:root"},
            "Action": "kms:*",
            "Resource": "*"
        },
        {
            "Sid": "Allow Production account to use key",
            "Effect": "Allow",
            "Principal": {"AWS": "arn:aws:iam::333333333333:root"},  # Prod account
            "Action": [
                "kms:Encrypt",
                "kms:Decrypt",
                "kms:GenerateDataKey",
                "kms:DescribeKey"
            ],
            "Resource": "*"
        },
        {
            "Sid": "Allow Dev account read-only",
            "Effect": "Allow",
            "Principal": {"AWS": "arn:aws:iam::222222222222:root"},  # Dev account
            "Action": [
                "kms:Decrypt",
                "kms:DescribeKey"
            ],
            "Resource": "*"
        }
    ]
}

response = kms.create_key(
    Description='Cross-account encryption key',
    Policy=json.dumps(key_policy)
)

key_id = response['KeyMetadata']['KeyId']
kms.create_alias(AliasName='alias/cross-account-key', TargetKeyId=key_id)
```

**Production Account: Use CMK**

```python
# Production Account (333333333333)
# Must have IAM policy allowing kms:Encrypt/Decrypt on cross-account key

production_role_policy = {
    "Version": "2012-10-17",
    "Statement": [{
        "Effect": "Allow",
        "Action": [
            "kms:Encrypt",
            "kms:Decrypt",
            "kms:GenerateDataKey"
        ],
        "Resource": "arn:aws:kms:us-east-1:111111111111:key/*"
    }]
}

# Use cross-account key
s3.put_object(
    Bucket='prod-bucket',
    Key='sensitive.txt',
    Body=b'Production data',
    ServerSideEncryption='aws:kms',
    SSEKMSKeyId='arn:aws:kms:us-east-1:111111111111:key/12345678-1234-...'
)
```

**Strategy 2: Multi-Region Keys**

For global applications:

```python
# Create multi-region primary key
response = kms.create_key(
    Description='Multi-region key',
    MultiRegion=True
)

primary_key_id = response['KeyMetadata']['KeyId']

# Replicate to other regions
kms_eu = boto3.client('kms', region_name='eu-west-1')
kms_eu.replicate_key(
    KeyId=primary_key_id,
    ReplicaRegion='eu-west-1'
)

# Applications in both regions can use locally
# Same key ID, but replicated key material
```

**Strategy 3: Service Control Policies (SCPs)**

Prevent key deletion across organization:

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Deny",
    "Action": [
      "kms:ScheduleKeyDeletion",
      "kms:DeleteAlias"
    ],
    "Resource": "*",
    "Condition": {
      "StringNotLike": {
        "aws:PrincipalArn": "arn:aws:iam::*:role/SecurityAdmin"
      }
    }
  }]
}
```

**Monitoring:**

```python
# CloudWatch alarm for key usage in unexpected accounts
cloudwatch.put_metric_alarm(
    AlarmName='UnauthorizedKMSUsage',
    MetricName='KMSKeyUsageCount',
    Namespace='AWS/KMS',
    Statistic='Sum',
    Period=300,
    EvaluationPeriods=1,
    Threshold=0,
    ComparisonOperator='GreaterThanThreshold',
    Dimensions=[
        {'Name': 'AccountId', 'Value': 'unexpected-account-id'}
    ],
    AlarmActions=['arn:aws:sns:us-east-1:111111111111:security-alerts']
)
```

**Best Practices:**

1. **Least Privilege**: Grant minimum KMS permissions
2. **Encryption Context**: Require encryption context in key policy
3. **CloudTrail**: Log all KMS API calls
4. **Key Rotation**: Enable automatic rotation
5. **Separate Keys**: Different keys for dev/staging/prod
6. **No Public Keys**: Never make KMS keys public

---

## Summary

**AWS KMS** provides centralized key management with hardware security modules (HSMs) for encryption at rest and in transit. **Secrets Manager** automates secret rotation and centralized secret storage.

**Key Takeaways:**

1. **KMS CMK Types**: AWS Managed (free, automatic), Customer Managed ($1/month, full control), Imported (BYOK for compliance)
2. **Envelope Encryption**: Encrypt data with data key, encrypt data key with CMK (performance + cost optimization)
3. **Key Policies**: Resource-based policies control key access
4. **Grants**: Temporary, delegatable permissions
5. **Encryption Context**: Additional authenticated data for audit and authorization
6. **Secrets Manager**: Automatic rotation ($0.40/secret/month) vs Parameter Store (free, manual)
7. **Rotation**: Automatic yearly rotation for CMKs, Lambda-based rotation for secrets
8. **Multi-Account**: Cross-account key access with key policies
9. **Encryption at Rest**: S3 SSE, EBS, RDS encryption
10. **Encryption in Transit**: TLS/HTTPS for all AWS API calls

KMS and Secrets Manager are critical for FAANG interviews—expect questions on envelope encryption, key rotation strategies, cross-account access, and encryption compliance.

