# Database Internals: Complete Backend Engineer's Guide

## Table of Contents
1. [Introduction & History](#introduction--history)
2. [Why Database Internals Matter](#why-database-internals-matter)
3. [Storage Engines](#storage-engines)
4. [Indexing](#indexing)
5. [Query Execution](#query-execution)
6. [Transactions & ACID](#transactions--acid)
7. [Concurrency Control](#concurrency-control)
8. [Replication](#replication)
9. [Sharding & Partitioning](#sharding--partitioning)
10. [PostgreSQL Deep Dive](#postgresql-deep-dive)
11. [MySQL Deep Dive](#mysql-deep-dive)
12. [Performance Tuning](#performance-tuning)
13. [Hands-On Practice](#hands-on-practice)

---

## Introduction & History

### The Evolution of Databases

**1960s: Hierarchical & Network Databases**
- **Problem**: File systems couldn't handle complex data relationships.
- **IBM IMS (1966)**: Hierarchical database for Apollo program.
- **Structure**: Tree-like parent-child relationships.
- **Limitation**: Had to know exact path to data; rigid schema.

**1970: Relational Model Revolution**
- **Edgar F. Codd** (IBM researcher) published "A Relational Model of Data".
- **Innovation**: Data as tables (relations), query with algebra.
- **Why Revolutionary**: Logical vs physical data independence.
- **Impact**: Foundation of SQL and modern databases.

**1974-1979: SQL is Born**
- **System R** (IBM): First implementation of SQL.
- **Problem**: Relational databases were "too slow" initially.
- **Solution**: Query optimization, indexing algorithms.
- **1979**: Oracle released first commercial RDBMS.

**1980s: Commercial RDBMS Dominance**
- **Oracle, IBM DB2, Microsoft SQL Server**.
- **ACID properties** formalized (1983).
- **B-Trees** became standard for indexes.
- **Transaction processing** enabled banking, e-commerce.

**2000s: NoSQL Movement**
- **Problem**: Relational databases struggled with web scale.
- **Google BigTable (2006)**, **Amazon Dynamo (2007)** papers.
- **MongoDB (2009)**, **Cassandra (2008)**, **Redis (2009)**.
- **Why**: Horizontal scaling, flexible schemas, performance.
- **Trade-off**: Sacrificed ACID for availability/partition-tolerance (CAP theorem).

**2010s-Present: NewSQL & Hybrid**
- **CockroachDB (2015)**, **TiDB (2016)**: Distributed SQL with ACID.
- **Problem**: Need both ACID and horizontal scalability.
- **Innovation**: Distributed consensus (Raft, Paxos) for consistency.

---

## Why Database Internals Matter

### The What: Database Components

```
┌─────────────────────────────────────────┐
│         SQL Interface                    │
├─────────────────────────────────────────┤
│         Query Parser                     │
├─────────────────────────────────────────┤
│         Query Optimizer                  │
├─────────────────────────────────────────┤
│         Execution Engine                 │
├─────────────────────────────────────────┤
│    Transaction Manager    │  Lock Manager│
├─────────────────────────────────────────┤
│         Buffer Pool                      │
├─────────────────────────────────────────┤
│         Storage Engine                   │
└─────────────────────────────────────────┘
           │              │
      Index Files    Data Files
```

### The Why: Impact on Backend Systems

**1. Performance**:
- **Example**: Wrong index = 1000x slower query
- **B-Tree vs Hash index**: B-Tree for ranges, Hash for equality
- **Query plan**: Understanding EXPLAIN prevents slow queries

**2. Data Integrity**:
- **ACID**: Prevents data corruption
- **Example**: Bank transfer must debit and credit atomically
- **Isolation levels**: Prevent dirty reads, phantom reads

**3. Scalability**:
- **Vertical scaling**: Bigger machine (limited)
- **Horizontal scaling**: More machines (complex)
- **Replication**: Read scaling
- **Sharding**: Write scaling

**4. Reliability**:
- **Write-Ahead Logging (WAL)**: Crash recovery
- **Replication**: High availability
- **Backup/Restore**: Data recovery

### The How: Real-World Applications

| Internal Concept | Production Use Case | Example |
|------------------|---------------------|---------|
| B-Tree indexes | Fast lookups | User ID → User data |
| WAL | Crash recovery | Power failure during write |
| MVCC | Concurrent reads/writes | High-traffic web app |
| Replication | Read scaling | Separate read/write DBs |
| Partitioning | Data distribution | User data by region |
| Query planner | Performance | Choosing best join strategy |

---

## Storage Engines

### What is a Storage Engine?

The component that manages how data is stored, retrieved, and updated on disk.

**Two Main Categories**:

1. **Row-Oriented (OLTP - Online Transaction Processing)**
   - Store entire rows together
   - Optimized for: Inserts, updates, point queries
   - Examples: InnoDB (MySQL), PostgreSQL heap

2. **Column-Oriented (OLAP - Online Analytical Processing)**
   - Store columns together
   - Optimized for: Analytics, aggregations, scans
   - Examples: ClickHouse, Apache Parquet

### Row-Oriented vs Column-Oriented

**Row-Oriented Storage**:
```
Row 1: [1, "Alice", 25, "NYC"]
Row 2: [2, "Bob", 30, "SF"]
Row 3: [3, "Charlie", 35, "LA"]

Disk layout: [1,"Alice",25,"NYC"][2,"Bob",30,"SF"][3,"Charlie",35,"LA"]
```

**Column-Oriented Storage**:
```
ID column:   [1, 2, 3]
Name column: ["Alice", "Bob", "Charlie"]
Age column:  [25, 30, 35]
City column: ["NYC", "SF", "LA"]

Disk layout: [1,2,3]["Alice","Bob","Charlie"][25,30,35]["NYC","SF","LA"]
```

**When to Use**:

| Storage Type | Use Case | Query Pattern |
|--------------|----------|---------------|
| Row-Oriented | OLTP (transactions) | `SELECT * FROM users WHERE id = 123` |
| Column-Oriented | OLAP (analytics) | `SELECT AVG(age) FROM users` |

### InnoDB (MySQL Default)

**Architecture**:
```
┌─────────────────────────────────────┐
│         Buffer Pool (RAM)           │
│  ┌──────────┐  ┌──────────────┐    │
│  │ Data Pages│  │ Index Pages  │    │
│  └──────────┘  └──────────────┘    │
├─────────────────────────────────────┤
│         Change Buffer               │
├─────────────────────────────────────┤
│         Redo Log (WAL)              │
├─────────────────────────────────────┤
│         Undo Log                    │
└─────────────────────────────────────┘
            │
       Disk Files
      (.ibd files)
```

**Key Features**:
1. **ACID Transactions**: Full support
2. **Row-level locking**: Better concurrency than table locks
3. **MVCC**: Multiple versions for concurrent reads
4. **Crash recovery**: WAL (redo log)
5. **Clustered index**: Data stored in B+Tree by primary key

**Data Organization**:
- Primary key index: Data stored in leaf nodes
- Secondary indexes: Contain primary key (not row pointer)

### PostgreSQL Heap Storage

**Architecture**:
```
┌─────────────────────────────────────┐
│     Shared Buffers (RAM Cache)      │
├─────────────────────────────────────┤
│          WAL Buffers                │
└─────────────────────────────────────┘
            │
      WAL Files (pg_wal/)
            │
      Data Files (base/)
       ┌────┴────┐
    Tables    Indexes
```

**Key Features**:
1. **MVCC**: No read locks
2. **TOAST**: Store large data separately (The Oversized-Attribute Storage Technique)
3. **Vacuum**: Cleanup old row versions
4. **Extensible**: Custom types, functions, indexes

**Row Version Chain** (MVCC):
```
Row ID: 100
Version 1 (xmin=10, xmax=20): {id: 1, name: "Alice"}
Version 2 (xmin=20, xmax=∞):  {id: 1, name: "Alice Smith"}

Transaction 15 sees: Version 1
Transaction 25 sees: Version 2
```

---

## Indexing

### B-Tree Indexes

**What**: Self-balancing tree structure for fast lookups.

**History (1970)**: Rudolf Bayer & Ed McCreight at Boeing invented B-Trees for efficiently accessing blocks on disk.

**Why B-Trees Won**:
- **Disk-friendly**: Wide nodes (hundreds of keys) minimize disk seeks
- **Balanced**: All leaves at same depth = predictable performance
- **Range queries**: Sorted order enables efficient ranges

**B+Tree Structure** (used in databases):
```
                [10 | 20 | 30]
                /     |    |   \
          [1|5]  [10|15] [20|25] [30|35|40]
           / \    / \     / \      / | \
        Data  Data Data Data  Data Data Data
```

**Properties**:
- All data in leaf nodes
- Internal nodes only store keys (more fan-out)
- Leaf nodes linked (efficient range scans)

**Time Complexity**:
- Search: O(log n)
- Insert: O(log n)
- Delete: O(log n)
- Range: O(log n + k) where k = results

**Example**:
```sql
CREATE INDEX idx_users_email ON users(email);

-- Without index: Full table scan O(n)
SELECT * FROM users WHERE email = 'alice@example.com';

-- With index: B-Tree search O(log n)
-- For 1 million rows: ~20 disk reads instead of 1 million
```

### Hash Indexes

**What**: Hash table for exact-match lookups.

**Structure**:
```
Hash("alice@example.com") → 12345 → Row location
Hash("bob@example.com")   → 67890 → Row location
```

**Pros**:
- ✅ O(1) exact match
- ✅ Faster than B-Tree for equality

**Cons**:
- ❌ No range queries
- ❌ No sorting
- ❌ Hash collisions

**When to Use**:
```sql
-- Good: Exact match
SELECT * FROM users WHERE id = 123;

-- Bad: Can't use hash index
SELECT * FROM users WHERE id > 100;
SELECT * FROM users WHERE id BETWEEN 100 AND 200;
SELECT * FROM users ORDER BY id;
```

### Bitmap Indexes

**What**: Bitmap for each distinct value.

**Example**:
```
Table: users
ID | Gender
1  | M
2  | F
3  | M
4  | F

Bitmap Index on Gender:
M: [1, 0, 1, 0]
F: [0, 1, 0, 1]

Query: SELECT * FROM users WHERE gender = 'M'
Result: Scan M bitmap → rows 1, 3
```

**Pros**:
- ✅ Extremely space-efficient for low-cardinality columns
- ✅ Fast AND/OR/NOT operations (bitwise)
- ✅ Great for data warehouses

**Cons**:
- ❌ Expensive updates (need to update bitmaps)
- ❌ Only good for low-cardinality (few distinct values)

**Use Cases**:
- Gender (M/F)
- Boolean flags
- Status codes
- Country codes

### Full-Text Indexes (Inverted Index)

**What**: Map words to documents.

**Structure**:
```
Document 1: "The quick brown fox"
Document 2: "The lazy dog"

Inverted Index:
"the"   → [1, 2]
"quick" → [1]
"brown" → [1]
"fox"   → [1]
"lazy"  → [2]
"dog"   → [2]
```

**Example**:
```sql
-- PostgreSQL
CREATE INDEX idx_articles_content ON articles USING gin(to_tsvector('english', content));

SELECT * FROM articles 
WHERE to_tsvector('english', content) @@ to_tsquery('english', 'database & performance');

-- MySQL
CREATE FULLTEXT INDEX idx_articles_content ON articles(content);

SELECT * FROM articles WHERE MATCH(content) AGAINST('database performance' IN NATURAL LANGUAGE MODE);
```

### Composite Indexes

**What**: Index on multiple columns.

**Key Rule**: **Leftmost prefix** must be used.

```sql
CREATE INDEX idx_users_name_age ON users(last_name, first_name, age);

-- Can use index (leftmost prefix):
SELECT * FROM users WHERE last_name = 'Smith';
SELECT * FROM users WHERE last_name = 'Smith' AND first_name = 'John';
SELECT * FROM users WHERE last_name = 'Smith' AND first_name = 'John' AND age = 30;

-- CANNOT use index (no leftmost prefix):
SELECT * FROM users WHERE first_name = 'John';
SELECT * FROM users WHERE age = 30;
SELECT * FROM users WHERE first_name = 'John' AND age = 30;
```

### Index Implementation in Go

```go
package main

import (
	"fmt"
	"sort"
)

// Simple B-Tree node
type BTreeNode struct {
	keys     []int
	values   []interface{}
	children []*BTreeNode
	isLeaf   bool
}

// Simple B-Tree (order 3 for demonstration)
type BTree struct {
	root  *BTreeNode
	order int
}

func NewBTree(order int) *BTree {
	return &BTree{
		root: &BTreeNode{
			keys:   make([]int, 0),
			values: make([]interface{}, 0),
			isLeaf: true,
		},
		order: order,
	}
}

// Search in B-Tree
func (bt *BTree) Search(key int) (interface{}, bool) {
	return bt.searchNode(bt.root, key)
}

func (bt *BTree) searchNode(node *BTreeNode, key int) (interface{}, bool) {
	i := 0
	for i < len(node.keys) && key > node.keys[i] {
		i++
	}
	
	if i < len(node.keys) && key == node.keys[i] {
		return node.values[i], true
	}
	
	if node.isLeaf {
		return nil, false
	}
	
	return bt.searchNode(node.children[i], key)
}

// Hash Index implementation
type HashIndex struct {
	buckets map[int]interface{}
}

func NewHashIndex() *HashIndex {
	return &HashIndex{
		buckets: make(map[int]interface{}),
	}
}

func (hi *HashIndex) Insert(key int, value interface{}) {
	hi.buckets[key] = value
}

func (hi *HashIndex) Search(key int) (interface{}, bool) {
	value, exists := hi.buckets[key]
	return value, exists
}

func (hi *HashIndex) Delete(key int) {
	delete(hi.buckets, key)
}

// Bitmap Index implementation
type BitmapIndex struct {
	bitmaps map[string][]bool
	size    int
}

func NewBitmapIndex(size int) *BitmapIndex {
	return &BitmapIndex{
		bitmaps: make(map[string][]bool),
		size:    size,
	}
}

func (bi *BitmapIndex) Insert(value string, rowID int) {
	if bi.bitmaps[value] == nil {
		bi.bitmaps[value] = make([]bool, bi.size)
	}
	if rowID < bi.size {
		bi.bitmaps[value][rowID] = true
	}
}

func (bi *BitmapIndex) Search(value string) []int {
	bitmap, exists := bi.bitmaps[value]
	if !exists {
		return []int{}
	}
	
	result := make([]int, 0)
	for i, present := range bitmap {
		if present {
			result = append(result, i)
		}
	}
	return result
}

// Inverted Index implementation
type InvertedIndex struct {
	index map[string][]int // word -> document IDs
}

func NewInvertedIndex() *InvertedIndex {
	return &InvertedIndex{
		index: make(map[string][]int),
	}
}

func (ii *InvertedIndex) AddDocument(docID int, words []string) {
	for _, word := range words {
		if !contains(ii.index[word], docID) {
			ii.index[word] = append(ii.index[word], docID)
		}
	}
}

func (ii *InvertedIndex) Search(word string) []int {
	return ii.index[word]
}

func contains(slice []int, item int) bool {
	for _, v := range slice {
		if v == item {
			return true
		}
	}
	return false
}

func main() {
	fmt.Println("=== Index Implementations ===\n")
	
	// B-Tree
	fmt.Println("--- B-Tree Index ---")
	btree := NewBTree(3)
	// In real implementation, insert would be more complex
	btree.root.keys = []int{10, 20, 30}
	btree.root.values = []interface{}{"ten", "twenty", "thirty"}
	
	if val, found := btree.Search(20); found {
		fmt.Printf("Found: %v\n\n", val)
	}
	
	// Hash Index
	fmt.Println("--- Hash Index ---")
	hashIdx := NewHashIndex()
	hashIdx.Insert(1, "Alice")
	hashIdx.Insert(2, "Bob")
	hashIdx.Insert(3, "Charlie")
	
	if val, found := hashIdx.Search(2); found {
		fmt.Printf("Found: %v\n\n", val)
	}
	
	// Bitmap Index
	fmt.Println("--- Bitmap Index ---")
	bitmapIdx := NewBitmapIndex(10)
	bitmapIdx.Insert("M", 0)
	bitmapIdx.Insert("F", 1)
	bitmapIdx.Insert("M", 2)
	bitmapIdx.Insert("F", 3)
	
	males := bitmapIdx.Search("M")
	fmt.Printf("Male rows: %v\n\n", males)
	
	// Inverted Index
	fmt.Println("--- Inverted Index ---")
	invertedIdx := NewInvertedIndex()
	invertedIdx.AddDocument(1, []string{"database", "performance", "tuning"})
	invertedIdx.AddDocument(2, []string{"database", "design"})
	invertedIdx.AddDocument(3, []string{"performance", "optimization"})
	
	docs := invertedIdx.Search("database")
	fmt.Printf("Documents with 'database': %v\n", docs)
	
	docs = invertedIdx.Search("performance")
	fmt.Printf("Documents with 'performance': %v\n", docs)
}
```

---

## Query Execution

### Query Processing Pipeline

```
SQL Query
    ↓
┌─────────────┐
│   Parser    │  → Syntax check, build parse tree
└──────┬──────┘
       ↓
┌─────────────┐
│  Analyzer   │  → Semantic check, resolve names
└──────┬──────┘
       ↓
┌─────────────┐
│  Rewriter   │  → Simplify, substitute views
└──────┬──────┘
       ↓
┌─────────────┐
│  Optimizer  │  → Generate execution plans, choose best
└──────┬──────┘
       ↓
┌─────────────┐
│  Executor   │  → Execute plan, return results
└─────────────┘
```

### Query Optimization

**Cost-Based Optimization**:

```sql
SELECT u.name, o.total
FROM users u
JOIN orders o ON u.id = o.user_id
WHERE u.country = 'US' AND o.total > 100;
```

**Possible Plans**:

1. **Nested Loop Join**:
   ```
   for each user in users where country = 'US':
       for each order in orders where user_id = user.id AND total > 100:
           output (user.name, order.total)
   
   Cost: O(n * m) where n=users, m=orders
   ```

2. **Hash Join**:
   ```
   Build hash table on users where country = 'US'
   Probe with orders where total > 100
   
   Cost: O(n + m)
   Better for large datasets
   ```

3. **Merge Join** (if both sorted):
   ```
   Sort users by id
   Sort orders by user_id
   Merge
   
   Cost: O(n log n + m log m + n + m)
   Good if already sorted or index available
   ```

**Optimizer Chooses Based On**:
- Table sizes (statistics)
- Index availability
- Join selectivity
- Memory available

### EXPLAIN Plans

**PostgreSQL**:
```sql
EXPLAIN ANALYZE
SELECT * FROM users WHERE email = 'alice@example.com';

-- Output:
Index Scan using idx_users_email on users  (cost=0.42..8.44 rows=1 width=100) (actual time=0.015..0.016 rows=1 loops=1)
  Index Cond: (email = 'alice@example.com'::text)
Planning Time: 0.123 ms
Execution Time: 0.034 ms
```

**Key Fields**:
- **cost**: Estimated cost (not time)
- **rows**: Estimated rows
- **actual time**: Real execution time
- **loops**: How many times this node executed

**Common Scan Types**:

| Scan Type | Description | When Used |
|-----------|-------------|-----------|
| Seq Scan | Full table scan | No index, small table |
| Index Scan | Use index + fetch rows | Selective query |
| Index Only Scan | All data in index | Covering index |
| Bitmap Heap Scan | Combine multiple indexes | Multiple conditions |

---

## Transactions & ACID

### ACID Properties

**Atomicity**: All or nothing

```sql
BEGIN TRANSACTION;
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;
COMMIT;  -- Both updates or neither

-- If crash happens between UPDATEs, WAL ensures rollback
```

**Consistency**: Database constraints maintained

```sql
-- Constraint: balance >= 0
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
-- If this would make balance negative, transaction fails
```

**Isolation**: Concurrent transactions don't interfere

```sql
-- Transaction 1
BEGIN;
SELECT balance FROM accounts WHERE id = 1;  -- Returns 100
UPDATE accounts SET balance = 90 WHERE id = 1;
COMMIT;

-- Transaction 2 (concurrent)
BEGIN;
SELECT balance FROM accounts WHERE id = 1;  -- Should see 100 or 90?
-- Depends on isolation level!
```

**Durability**: Committed data persists

```sql
COMMIT;  -- Data written to WAL, survives crash
```

### Isolation Levels

| Level | Dirty Read | Non-Repeatable Read | Phantom Read |
|-------|------------|---------------------|--------------|
| Read Uncommitted | ✅ | ✅ | ✅ |
| Read Committed | ❌ | ✅ | ✅ |
| Repeatable Read | ❌ | ❌ | ✅ |
| Serializable | ❌ | ❌ | ❌ |

**Examples**:

**Dirty Read** (Reading uncommitted data):
```sql
-- Transaction 1
BEGIN;
UPDATE accounts SET balance = 1000 WHERE id = 1;
-- NOT YET COMMITTED

-- Transaction 2
BEGIN;
SELECT balance FROM accounts WHERE id = 1;  -- Sees 1000 (dirty read!)
COMMIT;

-- Transaction 1
ROLLBACK;  -- Balance actually still 500!
```

**Non-Repeatable Read** (Same query, different results):
```sql
-- Transaction 1
BEGIN;
SELECT balance FROM accounts WHERE id = 1;  -- Returns 500

-- Transaction 2
BEGIN;
UPDATE accounts SET balance = 1000 WHERE id = 1;
COMMIT;

-- Transaction 1
SELECT balance FROM accounts WHERE id = 1;  -- Returns 1000 (changed!)
COMMIT;
```

**Phantom Read** (New rows appear):
```sql
-- Transaction 1
BEGIN;
SELECT COUNT(*) FROM accounts WHERE balance > 100;  -- Returns 5

-- Transaction 2
BEGIN;
INSERT INTO accounts (id, balance) VALUES (10, 200);
COMMIT;

-- Transaction 1
SELECT COUNT(*) FROM accounts WHERE balance > 100;  -- Returns 6 (phantom!)
COMMIT;
```

---

## Hands-On Practice

### Setting Up PostgreSQL

```bash
# Install PostgreSQL
sudo apt-get update
sudo apt-get install -y postgresql postgresql-contrib

# Start service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Connect
sudo -u postgres psql

# Create database and user
CREATE DATABASE testdb;
CREATE USER testuser WITH ENCRYPTED PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE testdb TO testuser;

# Connect as user
psql -U testuser -d testdb -h localhost
```

### Setting Up MySQL

```bash
# Install MySQL
sudo apt-get install -y mysql-server

# Secure installation
sudo mysql_secure_installation

# Connect
sudo mysql

# Create database and user
CREATE DATABASE testdb;
CREATE USER 'testuser'@'localhost' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON testdb.* TO 'testuser'@'localhost';
FLUSH PRIVILEGES;

# Connect as user
mysql -u testuser -p testdb
```

### Practical Exercises

```sql
-- Create test schema
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100),
    age INT,
    country VARCHAR(2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    total DECIMAL(10, 2),
    status VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert test data
INSERT INTO users (email, name, age, country) VALUES
('alice@example.com', 'Alice', 25, 'US'),
('bob@example.com', 'Bob', 30, 'UK'),
('charlie@example.com', 'Charlie', 35, 'US');

INSERT INTO orders (user_id, total, status) VALUES
(1, 100.00, 'completed'),
(1, 50.00, 'pending'),
(2, 200.00, 'completed');

-- Test queries
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'alice@example.com';

-- Create index
CREATE INDEX idx_users_email ON users(email);

-- Test again
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'alice@example.com';

-- Test transaction
BEGIN;
UPDATE users SET age = 26 WHERE id = 1;
SELECT * FROM users WHERE id = 1;
ROLLBACK;
SELECT * FROM users WHERE id = 1;  -- Age still 25
```

---

This covers the fundamental database internals. Let me continue with more topics.
