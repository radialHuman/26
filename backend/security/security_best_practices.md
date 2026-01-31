# Security Best Practices: OWASP Top 10 & Secure Coding

## Table of Contents
1. [Introduction & History](#introduction--history)
2. [OWASP Top 10 (2021)](#owasp-top-10-2021)
3. [Authentication & Authorization](#authentication--authorization)
4. [Encryption & Cryptography](#encryption--cryptography)
5. [Input Validation](#input-validation)
6. [Security Headers](#security-headers)
7. [Dependency Management](#dependency-management)
8. [Secrets Management](#secrets-management)
9. [Vulnerability Scanning](#vulnerability-scanning)
10. [Hands-On Security](#hands-on-security)

---

## Introduction & History

### The Evolution of Application Security

**1990s: Basic Security**
- **Threats**: Script kiddies, basic exploits.
- **Protection**: Firewalls, antivirus.
- **Problem**: Applications not designed securely.

**1999: SQL Injection Discovered**
- **RainForest Puppy** published SQL injection attacks.
- **Impact**: Exposed database vulnerabilities.

**2001: OWASP Founded**
- **Organization**: Open Web Application Security Project.
- **Mission**: Improve software security.
- **First Project**: OWASP Top 10 (2003).

**2003-2024: OWASP Top 10 Evolution**
- **2003**: First publication.
- **2007**: XSS, CSRF become prominent.
- **2013**: Mobile security added.
- **2017**: XML External Entities (XXE) added.
- **2021**: Latest version (focus on design flaws).

**Major Breaches**:
```
2013: Yahoo (3B accounts) - weak encryption
2014: eBay (145M users) - SQL injection
2017: Equifax (147M) - unpatched vulnerability
2018: Marriott (500M) - weak access controls
2021: Colonial Pipeline - ransomware
2023: MOVEit - SQL injection (zero-day)
```

---

## OWASP Top 10 (2021)

### 1. Broken Access Control

**What**: Users can access resources they shouldn't.

**Examples**:
```
- Viewing other users' data
- Modifying someone else's account
- Accessing admin functions
```

**Vulnerable Code (Python)**:
```python
from flask import Flask, request

@app.route('/user/<user_id>/profile')
def get_profile(user_id):
    # No authorization check!
    profile = db.get_user_profile(user_id)
    return jsonify(profile)

# Attack: https://api.com/user/123/profile
# Attacker changes URL to /user/456/profile
```

**Secure Code**:
```python
from flask import Flask, request, abort

@app.route('/user/<user_id>/profile')
def get_profile(user_id):
    current_user = get_current_user(request)
    
    # Check authorization
    if current_user.id != user_id and not current_user.is_admin:
        abort(403)  # Forbidden
    
    profile = db.get_user_profile(user_id)
    return jsonify(profile)
```

**Go Implementation**:
```go
package main

import (
	"net/http"
	"strconv"
)

func getProfile(w http.ResponseWriter, r *http.Request) {
	userID, _ := strconv.Atoi(r.URL.Query().Get("user_id"))
	currentUser := getCurrentUser(r)
	
	// Authorization check
	if currentUser.ID != userID && !currentUser.IsAdmin {
		http.Error(w, "Forbidden", http.StatusForbidden)
		return
	}
	
	profile := db.GetUserProfile(userID)
	json.NewEncoder(w).Encode(profile)
}
```

**Prevention**:
- ✅ Deny by default
- ✅ Check permissions on every request
- ✅ Use Role-Based Access Control (RBAC)
- ✅ Log access control failures

---

### 2. Cryptographic Failures

**What**: Weak encryption, storing sensitive data in plaintext.

**Vulnerable Code**:
```python
# Storing passwords in plaintext
def register_user(username, password):
    db.execute("INSERT INTO users VALUES (?, ?)", 
               username, password)  # BAD!

# Weak hashing
import hashlib
password_hash = hashlib.md5(password.encode()).hexdigest()  # BAD! MD5 is broken
```

**Secure Code**:
```python
from argon2 import PasswordHasher

ph = PasswordHasher()

def register_user(username, password):
    # Argon2 is OWASP recommended (2021)
    password_hash = ph.hash(password)
    db.execute("INSERT INTO users VALUES (?, ?)", 
               username, password_hash)

def verify_password(username, password):
    stored_hash = db.get_password_hash(username)
    try:
        ph.verify(stored_hash, password)
        return True
    except:
        return False
```

**Go Implementation**:
```go
package main

import (
	"golang.org/x/crypto/argon2"
	"crypto/rand"
	"encoding/base64"
)

func hashPassword(password string) (string, error) {
	// Generate salt
	salt := make([]byte, 16)
	if _, err := rand.Read(salt); err != nil {
		return "", err
	}
	
	// Argon2id parameters (OWASP recommended)
	hash := argon2.IDKey([]byte(password), salt, 1, 64*1024, 4, 32)
	
	// Encode: salt + hash
	encoded := base64.StdEncoding.EncodeToString(append(salt, hash...))
	return encoded, nil
}

func verifyPassword(password, encoded string) bool {
	decoded, _ := base64.StdEncoding.DecodeString(encoded)
	salt := decoded[:16]
	storedHash := decoded[16:]
	
	hash := argon2.IDKey([]byte(password), salt, 1, 64*1024, 4, 32)
	return subtle.ConstantTimeCompare(hash, storedHash) == 1
}
```

**Encryption at Rest (AES-256)**:
```python
from cryptography.fernet import Fernet

# Generate key (store securely!)
key = Fernet.generate_key()
cipher = Fernet(key)

# Encrypt
sensitive_data = "SSN: 123-45-6789"
encrypted = cipher.encrypt(sensitive_data.encode())

# Decrypt
decrypted = cipher.decrypt(encrypted).decode()
```

**Prevention**:
- ✅ Use strong algorithms (AES-256, Argon2, bcrypt)
- ✅ Encrypt data at rest and in transit (TLS)
- ✅ Rotate keys regularly
- ✅ Never store keys in code (use environment variables, vault)

---

### 3. Injection

**What**: Malicious code injected into commands/queries.

**SQL Injection**:
```python
# Vulnerable
username = request.form['username']
query = f"SELECT * FROM users WHERE username = '{username}'"
db.execute(query)

# Attack: username = "admin' --"
# Query: SELECT * FROM users WHERE username = 'admin' --'
# Result: Bypasses password check!
```

**Secure (Parameterized Queries)**:
```python
username = request.form['username']
query = "SELECT * FROM users WHERE username = ?"
db.execute(query, (username,))  # Driver escapes input
```

**Go Implementation**:
```go
package main

import (
	"database/sql"
	_ "github.com/lib/pq"
)

func getUserByUsername(username string) (*User, error) {
	// Parameterized query (safe)
	query := "SELECT id, username, email FROM users WHERE username = $1"
	
	var user User
	err := db.QueryRow(query, username).Scan(&user.ID, &user.Username, &user.Email)
	if err != nil {
		return nil, err
	}
	
	return &user, nil
}
```

**Command Injection**:
```python
# Vulnerable
filename = request.form['filename']
os.system(f"cat {filename}")  # BAD!

# Attack: filename = "file.txt; rm -rf /"
```

**Secure**:
```python
import subprocess

filename = request.form['filename']
# Validate filename
if not filename.isalnum():
    raise ValueError("Invalid filename")

# Use list (no shell interpretation)
subprocess.run(['cat', filename], check=True)
```

**Prevention**:
- ✅ Use parameterized queries (prepared statements)
- ✅ ORM (SQLAlchemy, Django ORM, GORM)
- ✅ Validate/sanitize input
- ✅ Least privilege (database user has minimal permissions)

---

### 4. Insecure Design

**What**: Security not considered in design phase.

**Example: Password Reset**
```
Insecure:
1. User enters email
2. System sends password reset link
3. Link: /reset?email=user@example.com
4. Attacker changes email in URL

Secure:
1. User enters email
2. System generates token
3. Link: /reset?token=abc123...
4. Token expires in 15 minutes
5. Token invalidated after use
```

**Implementation**:
```python
import secrets
from datetime import datetime, timedelta

def request_password_reset(email):
    # Generate cryptographically secure token
    token = secrets.token_urlsafe(32)
    expiry = datetime.utcnow() + timedelta(minutes=15)
    
    # Store token
    db.execute("""
        INSERT INTO password_resets (email, token, expiry)
        VALUES (?, ?, ?)
    """, email, token, expiry)
    
    # Send email
    send_email(email, f"Reset link: /reset?token={token}")

def reset_password(token, new_password):
    # Verify token
    row = db.execute("""
        SELECT email, expiry FROM password_resets
        WHERE token = ? AND expiry > ?
    """, token, datetime.utcnow()).fetchone()
    
    if not row:
        raise ValueError("Invalid or expired token")
    
    # Update password
    password_hash = hash_password(new_password)
    db.execute("UPDATE users SET password_hash = ? WHERE email = ?",
               password_hash, row['email'])
    
    # Invalidate token
    db.execute("DELETE FROM password_resets WHERE token = ?", token)
```

**Prevention**:
- ✅ Threat modeling
- ✅ Security requirements in design
- ✅ Code reviews
- ✅ Principle of least privilege

---

### 5. Security Misconfiguration

**What**: Insecure default configurations.

**Examples**:
```
- Default passwords (admin/admin)
- Debug mode in production
- Unnecessary features enabled
- Missing security headers
- Verbose error messages
```

**Vulnerable**:
```python
# Flask debug mode in production
app = Flask(__name__)
app.config['DEBUG'] = True  # BAD!
app.run()

# Exposes:
# - Interactive debugger
# - Source code
# - Stack traces
```

**Secure**:
```python
app = Flask(__name__)
app.config['DEBUG'] = False
app.config['ENV'] = 'production'

# Custom error handler (hide details)
@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500
```

**Security Headers**:
```python
from flask import Flask, make_response

@app.after_request
def add_security_headers(response):
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    response.headers['Content-Security-Policy'] = "default-src 'self'"
    return response
```

**Prevention**:
- ✅ Minimal install (only necessary features)
- ✅ Security headers
- ✅ Disable debug in production
- ✅ Regular updates
- ✅ Configuration management

---

### 6. Vulnerable Components

**What**: Using libraries with known vulnerabilities.

**Example**:
```
Log4Shell (CVE-2021-44228):
- Apache Log4j vulnerability
- RCE (Remote Code Execution)
- Impact: Millions of systems
```

**Detection**:
```bash
# Python: Safety
pip install safety
safety check

# Python: pip-audit
pip install pip-audit
pip-audit

# Go: govulncheck
go install golang.org/x/vuln/cmd/govulncheck@latest
govulncheck ./...

# Node.js: npm audit
npm audit

# General: Snyk
snyk test
```

**Prevention**:
- ✅ Keep dependencies updated
- ✅ Automated scanning (CI/CD)
- ✅ Monitor security advisories
- ✅ Use dependency management tools

---

### 7. Authentication Failures

**What**: Weak authentication mechanisms.

**Examples**:
```
- Weak passwords
- Credential stuffing
- Session fixation
- Missing MFA
```

**Password Policy**:
```python
import re

def validate_password(password):
    """NIST guidelines (2020)"""
    # Minimum 8 characters
    if len(password) < 8:
        return False, "Password must be at least 8 characters"
    
    # Check against common passwords
    with open('common-passwords.txt') as f:
        common = set(line.strip() for line in f)
    
    if password in common:
        return False, "Password is too common"
    
    return True, "Password accepted"
```

**Rate Limiting**:
```python
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

limiter = Limiter(
    app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"]
)

@app.route('/login', methods=['POST'])
@limiter.limit("5 per minute")  # Max 5 login attempts per minute
def login():
    username = request.form['username']
    password = request.form['password']
    
    if verify_credentials(username, password):
        return jsonify({'token': generate_token(username)})
    else:
        return jsonify({'error': 'Invalid credentials'}), 401
```

**Multi-Factor Authentication (MFA)**:
```python
import pyotp

def setup_mfa(username):
    # Generate secret
    secret = pyotp.random_base32()
    
    # Store secret for user
    db.execute("UPDATE users SET mfa_secret = ? WHERE username = ?",
               secret, username)
    
    # Generate QR code
    totp = pyotp.TOTP(secret)
    uri = totp.provisioning_uri(username, issuer_name="MyApp")
    
    return uri  # Display QR code to user

def verify_mfa(username, code):
    secret = db.get_mfa_secret(username)
    totp = pyotp.TOTP(secret)
    return totp.verify(code)  # Returns True if valid
```

---

## Hands-On: Secure API Implementation

**Complete Secure Flask API**:
```python
from flask import Flask, request, jsonify
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from argon2 import PasswordHasher
import jwt
import datetime
import secrets

app = Flask(__name__)
app.config['SECRET_KEY'] = secrets.token_hex(32)

limiter = Limiter(app, key_func=get_remote_address)
ph = PasswordHasher()

# Middleware: Security headers
@app.after_request
def add_security_headers(response):
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['Strict-Transport-Security'] = 'max-age=31536000'
    response.headers['Content-Security-Policy'] = "default-src 'self'"
    return response

# Registration
@app.route('/register', methods=['POST'])
@limiter.limit("3 per hour")
def register():
    data = request.get_json()
    
    # Input validation
    if not data or 'username' not in data or 'password' not in data:
        return jsonify({'error': 'Missing fields'}), 400
    
    username = data['username']
    password = data['password']
    
    # Validate username
    if not username.isalnum() or len(username) < 3:
        return jsonify({'error': 'Invalid username'}), 400
    
    # Validate password
    if len(password) < 8:
        return jsonify({'error': 'Password too short'}), 400
    
    # Hash password
    password_hash = ph.hash(password)
    
    # Store user (parameterized query)
    try:
        db.execute("INSERT INTO users (username, password_hash) VALUES (?, ?)",
                   username, password_hash)
    except:
        return jsonify({'error': 'Username already exists'}), 409
    
    return jsonify({'message': 'User created'}), 201

# Login
@app.route('/login', methods=['POST'])
@limiter.limit("5 per minute")
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    # Get user
    user = db.execute("SELECT * FROM users WHERE username = ?", username).fetchone()
    
    if not user:
        return jsonify({'error': 'Invalid credentials'}), 401
    
    # Verify password
    try:
        ph.verify(user['password_hash'], password)
    except:
        return jsonify({'error': 'Invalid credentials'}), 401
    
    # Generate JWT
    token = jwt.encode({
        'user_id': user['id'],
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=1)
    }, app.config['SECRET_KEY'], algorithm='HS256')
    
    return jsonify({'token': token})

# Protected endpoint
@app.route('/profile', methods=['GET'])
def profile():
    token = request.headers.get('Authorization')
    
    if not token:
        return jsonify({'error': 'Missing token'}), 401
    
    try:
        # Verify JWT
        payload = jwt.decode(token.replace('Bearer ', ''), 
                           app.config['SECRET_KEY'],
                           algorithms=['HS256'])
        
        user_id = payload['user_id']
        
        # Get user profile
        profile = db.execute("SELECT username, email FROM users WHERE id = ?",
                           user_id).fetchone()
        
        return jsonify(dict(profile))
    
    except jwt.ExpiredSignatureError:
        return jsonify({'error': 'Token expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'error': 'Invalid token'}), 401

if __name__ == '__main__':
    app.run(ssl_context='adhoc')  # HTTPS
```

---

This comprehensive security guide covers OWASP Top 10, authentication, encryption, and secure coding practices with hands-on examples. Continuing with more files.
