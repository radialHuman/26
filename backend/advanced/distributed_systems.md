# Distributed Systems: Complete Backend Engineer's Guide

## Table of Contents
1. [Introduction & History](#introduction--history)
2. [Why Distributed Systems Matter](#why-distributed-systems-matter)
3. [Fundamental Challenges](#fundamental-challenges)
4. [Consistency Models](#consistency-models)
5. [Consensus Algorithms](#consensus-algorithms)
6. [Distributed Transactions](#distributed-transactions)
7. [Replication Strategies](#replication-strategies)
8. [Partitioning & Sharding](#partitioning--sharding)
9. [Distributed Coordination](#distributed-coordination)
10. [Time & Ordering](#time--ordering)
11. [Failure Detection](#failure-detection)
12. [Hands-On Implementation](#hands-on-implementation)

---

## Introduction & History

### The Evolution of Distributed Systems

**1960s-1970s: ARPANET**
- **Problem**: Connecting geographically dispersed computers.
- **Solution**: Packet switching, TCP/IP.
- **Impact**: Foundation of Internet and distributed computing.

**1980s: Client-Server Architecture**
- **Problem**: Mainframe time-sharing was expensive.
- **Solution**: Personal computers as clients, servers for shared resources.
- **Example**: Ethernet LANs, file servers, print servers.

**1990s: Web & Three-Tier Architecture**
- **Problem**: Static content couldn't scale.
- **Solution**: Separation of presentation, logic, data.
- **Example**: Apache, MySQL, PHP (LAMP stack).

**2000s: Google's Distributed Systems**
- **GFS (2003)**: Google File System for distributed storage.
- **MapReduce (2004)**: Distributed data processing.
- **BigTable (2006)**: Distributed database.
- **Impact**: Inspired Hadoop, HBase, Cassandra.

**2007: Amazon Dynamo**
- **Problem**: Traditional databases couldn't achieve 99.99% availability.
- **Solution**: Eventual consistency, decentralized architecture.
- **Impact**: DynamoDB, Cassandra, Riak.

**2010s: Cloud & Microservices**
- **Docker (2013)**: Containerization enabled distributed deployments.
- **Kubernetes (2014)**: Orchestration for distributed containers.
- **Service Mesh (Istio 2017)**: Managing microservices communication.

**Present: Edge Computing & Global Distribution**
- **Cloudflare Workers**, **AWS Lambda@Edge**: Compute at network edge.
- **Multi-region databases**: CockroachDB, TiDB, YugabyteDB.
- **Real-time collaboration**: Figma, Notion (CRDTs).

---

## Why Distributed Systems Matter

### The What: Core Definition

A distributed system is a collection of independent computers that appear to users as a single coherent system.

**Key Characteristics**:
1. **No shared memory**: Communicate via message passing.
2. **Partial failures**: Some components fail while others work.
3. **Concurrency**: Multiple things happening simultaneously.
4. **No global clock**: Each node has its own clock.

### The Why: Necessity in Modern Systems

**1. Scalability**
- **Single machine limits**: CPU, memory, disk, network.
- **Example**: Facebook has billions of users; one server can't handle it.
- **Solution**: Distribute across thousands of machines.

**2. Availability**
- **Hardware fails**: Disk crashes, network partitions, power outages.
- **Requirement**: 99.99% uptime = 52 minutes downtime/year.
- **Solution**: Redundancy across multiple nodes/datacenters.

**3. Latency**
- **Physics**: Speed of light limits data transfer.
- **Example**: US to Asia: ~150ms round-trip.
- **Solution**: Geo-distributed systems (CDNs, edge computing).

**4. Fault Tolerance**
- **Failures are normal**: At scale, something is always broken.
- **Example**: Google estimates 1-5% of disks fail annually.
- **Solution**: Systems designed to tolerate failures.

### The How: Real-World Applications

| System | Why Distributed | Scale |
|--------|----------------|-------|
| Google Search | Billions of pages, < 200ms latency | Millions of servers |
| Netflix | Global streaming, 99.99% uptime | Thousands of microservices |
| WhatsApp | 2B users, real-time messaging | Millions of concurrent connections |
| Uber | Geo-distributed, low latency | Global coverage |
| Blockchain | Decentralized trust | Thousands of nodes |

---

## Fundamental Challenges

### The Eight Fallacies of Distributed Computing

**Peter Deutsch & James Gosling (1990s)**:

1. **The network is reliable** ❌
   - Networks fail, packets are lost/delayed.
   
2. **Latency is zero** ❌
   - Speed of light: 1ms for 200km fiber.
   
3. **Bandwidth is infinite** ❌
   - Limited by physical infrastructure.
   
4. **The network is secure** ❌
   - Man-in-the-middle attacks, eavesdropping.
   
5. **Topology doesn't change** ❌
   - Servers added/removed, network reconfigured.
   
6. **There is one administrator** ❌
   - Multi-cloud, different teams, security domains.
   
7. **Transport cost is zero** ❌
   - Serialization, network I/O overhead.
   
8. **The network is homogeneous** ❌
   - Different hardware, OS, protocols.

### CAP Theorem (2000, Eric Brewer)

**You can only guarantee TWO of**:
- **Consistency**: All nodes see same data.
- **Availability**: Every request gets response.
- **Partition Tolerance**: System works despite network failures.

**Practical Reality**: Networks partition, so choose CP or AP.

**CP Systems** (Sacrifice Availability):
```
Network partition occurs
Node A: Has latest data, refuses requests from Node B's partition
Node B: Cannot serve requests (unavailable)
Result: Consistent but unavailable
Examples: HBase, MongoDB (strong consistency), ZooKeeper
```

**AP Systems** (Sacrifice Consistency):
```
Network partition occurs
Node A: Serves requests with its data
Node B: Serves requests with potentially stale data
Result: Available but temporarily inconsistent
Examples: Cassandra, DynamoDB, Couchbase
```

### Split-Brain Problem

**Scenario**:
```
     Cluster
   /          \
Node A        Node B
(thinks it's  (thinks it's
 primary)      primary)

Both accept writes!
Data divergence
```

**Solutions**:
1. **Quorum**: Require majority (n/2 + 1) to elect leader.
2. **Fencing**: Use tokens to invalidate old leaders.
3. **External coordination**: ZooKeeper, etcd for leader election.

---

## Consistency Models

### Strong Consistency (Linearizability)

**Definition**: Operations appear instantaneous; once a write completes, all reads see it.

**Example**:
```
Time ───────────────────────>
T1: Write(x=1) [complete]
T2:                       Read(x) → must return 1
T3:                            Read(x) → must return 1
```

**Trade-offs**:
- ✅ Simple reasoning (single-machine semantics)
- ❌ High latency (synchronous replication)
- ❌ Lower availability (CAP theorem)

**Use cases**: Banking, inventory management, coordination.

### Eventual Consistency

**Definition**: Given enough time, all replicas converge to same value.

**Example**:
```
Time ───────────────────────>
T1: Write(x=1) to Node A
T2:    Read(x) from Node B → might return 0 (stale)
T3:           Read(x) from Node B → might return 0
T4:                  Read(x) from Node B → returns 1 (propagated)
```

**Trade-offs**:
- ✅ High availability
- ✅ Low latency
- ❌ Complex application logic (handle conflicts)

**Use cases**: Social media, caches, DNS.

### Causal Consistency

**Definition**: Causally related operations seen in order; concurrent operations can be in any order.

**Example**:
```
A: Post "Hello"
B: Reply "Hi" (causally dependent on A's post)
C: Post "World" (concurrent with A and B)

All nodes must see A before B
C can appear anywhere
```

**Implementation**: Vector clocks, Lamport timestamps.

### Read Your Writes

**Definition**: After writing, subsequent reads see that write.

**Example**:
```
User uploads profile picture
Immediately views profile → must see new picture
(Not necessarily visible to other users yet)
```

**Implementation**: Read from same replica, or track versions.

---

## Consensus Algorithms

### What is Consensus?

**Problem**: Multiple nodes must agree on a single value.

**Requirements**:
1. **Agreement**: All nodes decide same value.
2. **Validity**: Decided value was proposed by some node.
3. **Termination**: All nodes eventually decide.

**Impossibility Result** (FLP 1985): No algorithm solves consensus in asynchronous systems with even one faulty node.

**Practical Solution**: Add timing assumptions or randomization.

### Paxos (1989, Leslie Lamport)

**History**: Published in 1989 as "The Part-Time Parliament" (rejected as too complex). Republished in 2001 as "Paxos Made Simple."

**Roles**:
- **Proposers**: Propose values
- **Acceptors**: Vote on proposals
- **Learners**: Learn chosen value

**Phases**:

**Phase 1: Prepare**
```
Proposer → Acceptors: Prepare(n)
Acceptors → Proposer: Promise(n, highest_accepted_value)
```

**Phase 2: Accept**
```
Proposer → Acceptors: Accept(n, value)
Acceptors → Learners: Accepted(n, value)
```

**Example**:
```
Proposer A: Prepare(n=1)
Acceptors (majority): Promise(1, null)
Proposer A: Accept(1, "value-A")
Acceptors (majority): Accepted(1, "value-A")
Result: "value-A" chosen
```

**Challenges**:
- ❌ Complex to understand
- ❌ Complex to implement
- ❌ Livelock possible (dueling proposers)

### Raft (2014, Diego Ongaro & John Ousterhout)

**Designed for understandability**: "In search of an Understandable Consensus Algorithm"

**Roles**:
- **Leader**: Handles all client requests
- **Follower**: Passive, replicate leader's log
- **Candidate**: Trying to become leader

**Components**:

**1. Leader Election**
```
Start: All followers
Follower times out → becomes Candidate
Candidate requests votes
Majority votes → becomes Leader
Leader sends heartbeats
```

**2. Log Replication**
```
Client → Leader: Request
Leader: Append to local log
Leader → Followers: Replicate entry
Followers: Append to local log, ACK
Leader (receives majority ACKs): Commit entry
Leader → Client: Success
```

**3. Safety**
- **Election Safety**: At most one leader per term.
- **Leader Append-Only**: Leader never overwrites/deletes entries.
- **Log Matching**: If two logs have same entry at same index, all preceding entries match.
- **Leader Completeness**: If entry committed in term, present in all future leaders.
- **State Machine Safety**: If node applies entry at index, no other node applies different entry at that index.

**Advantages over Paxos**:
- ✅ Easier to understand
- ✅ Easier to implement
- ✅ Strong leader (simplifies logic)

**Used in**: etcd (Kubernetes), Consul, TiKV.

### Implementation in Go (Simplified Raft)

```go
package main

import (
	"fmt"
	"math/rand"
	"sync"
	"time"
)

type NodeState int

const (
	Follower NodeState = iota
	Candidate
	Leader
)

type LogEntry struct {
	Term    int
	Command string
}

type RaftNode struct {
	mu sync.Mutex
	
	// Persistent state
	currentTerm int
	votedFor    int
	log         []LogEntry
	
	// Volatile state
	commitIndex int
	lastApplied int
	
	// Volatile state (leaders)
	nextIndex  []int
	matchIndex []int
	
	// Node info
	id          int
	state       NodeState
	peers       []*RaftNode
	votesReceived int
	
	// Timers
	electionTimeout  time.Duration
	heartbeatTimeout time.Duration
	lastHeartbeat    time.Time
}

func NewRaftNode(id int, peers []*RaftNode) *RaftNode {
	return &RaftNode{
		id:               id,
		state:            Follower,
		peers:            peers,
		currentTerm:      0,
		votedFor:         -1,
		log:              make([]LogEntry, 0),
		electionTimeout:  time.Duration(150+rand.Intn(150)) * time.Millisecond,
		heartbeatTimeout: 50 * time.Millisecond,
		lastHeartbeat:    time.Now(),
	}
}

func (rn *RaftNode) Start() {
	go rn.run()
}

func (rn *RaftNode) run() {
	for {
		switch rn.state {
		case Follower:
			rn.runFollower()
		case Candidate:
			rn.runCandidate()
		case Leader:
			rn.runLeader()
		}
	}
}

func (rn *RaftNode) runFollower() {
	timeout := time.After(rn.electionTimeout)
	
	for {
		select {
		case <-timeout:
			// Election timeout, become candidate
			rn.mu.Lock()
			rn.state = Candidate
			rn.mu.Unlock()
			return
		}
	}
}

func (rn *RaftNode) runCandidate() {
	rn.mu.Lock()
	rn.currentTerm++
	rn.votedFor = rn.id
	rn.votesReceived = 1
	term := rn.currentTerm
	rn.mu.Unlock()
	
	fmt.Printf("Node %d starting election for term %d\n", rn.id, term)
	
	// Request votes from all peers
	for _, peer := range rn.peers {
		if peer.id != rn.id {
			go rn.requestVote(peer, term)
		}
	}
	
	// Wait for election result
	timeout := time.After(rn.electionTimeout)
	ticker := time.NewTicker(10 * time.Millisecond)
	defer ticker.Stop()
	
	for {
		select {
		case <-ticker.C:
			rn.mu.Lock()
			if rn.votesReceived > len(rn.peers)/2 {
				fmt.Printf("Node %d won election for term %d\n", rn.id, term)
				rn.state = Leader
				rn.mu.Unlock()
				return
			}
			rn.mu.Unlock()
		case <-timeout:
			// Election timeout, start new election
			return
		}
	}
}

func (rn *RaftNode) runLeader() {
	fmt.Printf("Node %d is now leader for term %d\n", rn.id, rn.currentTerm)
	
	ticker := time.NewTicker(rn.heartbeatTimeout)
	defer ticker.Stop()
	
	for {
		select {
		case <-ticker.C:
			// Send heartbeats
			rn.sendHeartbeats()
			
			rn.mu.Lock()
			if rn.state != Leader {
				rn.mu.Unlock()
				return
			}
			rn.mu.Unlock()
		}
	}
}

func (rn *RaftNode) requestVote(peer *RaftNode, term int) {
	peer.mu.Lock()
	defer peer.mu.Unlock()
	
	// Grant vote if:
	// 1. Candidate's term >= my term
	// 2. Haven't voted for anyone else this term
	if term >= peer.currentTerm && (peer.votedFor == -1 || peer.votedFor == rn.id) {
		peer.votedFor = rn.id
		peer.currentTerm = term
		
		rn.mu.Lock()
		rn.votesReceived++
		rn.mu.Unlock()
		
		fmt.Printf("Node %d voted for Node %d in term %d\n", peer.id, rn.id, term)
	}
}

func (rn *RaftNode) sendHeartbeats() {
	for _, peer := range rn.peers {
		if peer.id != rn.id {
			go rn.sendHeartbeat(peer)
		}
	}
}

func (rn *RaftNode) sendHeartbeat(peer *RaftNode) {
	rn.mu.Lock()
	term := rn.currentTerm
	rn.mu.Unlock()
	
	peer.mu.Lock()
	defer peer.mu.Unlock()
	
	if term >= peer.currentTerm {
		peer.currentTerm = term
		peer.state = Follower
		peer.lastHeartbeat = time.Now()
		peer.votedFor = -1
	}
}

func main() {
	// Create 5-node cluster
	nodes := make([]*RaftNode, 5)
	for i := range nodes {
		nodes[i] = NewRaftNode(i, nodes)
	}
	
	// Start all nodes
	for _, node := range nodes {
		node.Start()
	}
	
	// Let it run for a while
	time.Sleep(10 * time.Second)
	fmt.Println("Simulation complete")
}
```

---

## Distributed Transactions

### Two-Phase Commit (2PC)

**Goal**: Atomic commit across multiple nodes.

**Phases**:

**Phase 1: Prepare (Vote)**
```
Coordinator → Participants: Prepare
Participants: Lock resources, write to log
Participants → Coordinator: Vote (Yes/No)
```

**Phase 2: Commit/Abort**
```
If all voted Yes:
    Coordinator → Participants: Commit
    Participants: Apply changes, release locks
Else:
    Coordinator → Participants: Abort
    Participants: Rollback, release locks
```

**Example**:
```
Bank transfer: $100 from Account A to Account B
A on Node 1, B on Node 2

Coordinator → Node 1: Prepare (debit A, $100)
Coordinator → Node 2: Prepare (credit B, $100)
Node 1 → Coordinator: Yes (can debit)
Node 2 → Coordinator: Yes (can credit)
Coordinator → Both: Commit
Both: Apply changes
```

**Problems**:
- **Blocking**: If coordinator crashes after prepare, participants are stuck.
- **Slow**: Multiple round-trips, resources locked entire time.

**Solution**: Three-Phase Commit (3PC) adds timeout, but still has issues.

### Saga Pattern

**Alternative to 2PC**: Chain of local transactions with compensating transactions.

**Example**:
```
Book flight → Reserve hotel → Charge credit card

If "Charge credit card" fails:
    Compensate: Cancel hotel → Cancel flight
```

**Implementation**:
```python
class Saga:
    def __init__(self):
        self.steps = []
        self.compensations = []
    
    def add_step(self, action, compensation):
        self.steps.append(action)
        self.compensations.append(compensation)
    
    def execute(self):
        completed = []
        
        try:
            for i, step in enumerate(self.steps):
                result = step()
                completed.append(i)
        except Exception as e:
            # Compensate in reverse order
            for i in reversed(completed):
                self.compensations[i]()
            raise e

# Usage
saga = Saga()
saga.add_step(
    action=lambda: book_flight(),
    compensation=lambda: cancel_flight()
)
saga.add_step(
    action=lambda: reserve_hotel(),
    compensation=lambda: cancel_hotel()
)
saga.add_step(
    action=lambda: charge_card(),
    compensation=lambda: refund_card()
)

saga.execute()
```

**Trade-offs**:
- ✅ No blocking, high availability
- ❌ Eventual consistency
- ❌ Compensations must be idempotent

---

## Time & Ordering

### Physical Clocks

**Problem**: Distributed nodes have different clocks.

**Clock Drift**: Clocks run at slightly different rates.
```
Node A: 1000ms, 1001ms, 1002ms
Node B: 1000ms, 1001ms, 1002ms, 1003ms (faster)
After 1000s: ~1s difference
```

**NTP (Network Time Protocol)**:
- Synchronizes clocks over network
- Accuracy: ~5ms on LAN, ~100ms on Internet
- Not perfect! Clocks can still drift

### Logical Clocks

**Lamport Timestamps (1978)**:

**Rules**:
1. Each process increments its counter before each event.
2. When sending message, include counter.
3. On receiving message, set counter = max(local, received) + 1.

**Example**:
```
Process A:  1    2    3         5
            │    │    │         │
            ↓    ↓    ↓         ↓
Events:     e1   e2   send(m)   e4
                      │
                      │ m(3)
                      │
Process B:  1    2    ↓    4
            │    │    │    │
            ↓    ↓    ↓    ↓
Events:     e5   e6   recv(m)  e7
                      ↑
                   max(2,3)+1=4
```

**Property**: If A happened before B, then timestamp(A) < timestamp(B).
**Limitation**: Converse not true (can't determine causality from timestamps alone).

### Vector Clocks

**Improvement over Lamport**: Can determine causality.

**Structure**: Each node maintains vector of all nodes' timestamps.
```
Node A: [A:2, B:1, C:0]
Node B: [A:1, B:3, C:2]
Node C: [A:0, B:2, C:4]
```

**Rules**:
1. Increment own counter on each event.
2. When sending, include vector.
3. On receiving, merge vectors (element-wise max) and increment own counter.

**Causality**:
```
V1 < V2  (V1 happened before V2) if:
  ∀i: V1[i] ≤ V2[i] AND ∃j: V1[j] < V2[j]

V1 || V2 (concurrent) if:
  V1 ≮ V2 AND V2 ≮ V1
```

**Example**:
```
Node A: [1,0,0] → [2,0,0] → [2,1,0] (after receiving from B)
                    ↓
                 send(m)
                    ↓
Node B: [0,1,0] → [2,2,0] (max(2,0)+0, 1+1, max(0,0)+0)
```

---

## Hands-On: Distributed Key-Value Store

### Implementation in Python

```python
import socket
import threading
import json
import hashlib
from typing import Dict, Any, Optional

class Node:
    """Single node in distributed KV store."""
    
    def __init__(self, node_id: str, port: int, peers: list):
        self.node_id = node_id
        self.port = port
        self.peers = peers  # [(id, host, port), ...]
        self.data: Dict[str, Any] = {}
        self.vector_clock: Dict[str, int] = {node_id: 0}
        self.running = True
    
    def hash_key(self, key: str) -> str:
        """Determine which node should store this key."""
        hash_val = int(hashlib.md5(key.encode()).hexdigest(), 16)
        all_nodes = [self.node_id] + [peer[0] for peer in self.peers]
        all_nodes.sort()
        return all_nodes[hash_val % len(all_nodes)]
    
    def get(self, key: str) -> Optional[Any]:
        """Get value for key."""
        owner = self.hash_key(key)
        
        if owner == self.node_id:
            return self.data.get(key)
        else:
            # Forward to owner
            return self.forward_get(owner, key)
    
    def put(self, key: str, value: Any):
        """Put key-value pair."""
        owner = self.hash_key(key)
        
        if owner == self.node_id:
            self.vector_clock[self.node_id] += 1
            self.data[key] = {
                'value': value,
                'vector_clock': self.vector_clock.copy()
            }
            # Replicate to peers
            self.replicate(key, value)
        else:
            # Forward to owner
            self.forward_put(owner, key, value)
    
    def replicate(self, key: str, value: Any):
        """Replicate data to peers."""
        for peer_id, host, port in self.peers:
            try:
                self.send_to_peer(host, port, {
                    'type': 'replicate',
                    'key': key,
                    'value': value,
                    'vector_clock': self.vector_clock
                })
            except Exception as e:
                print(f"Replication to {peer_id} failed: {e}")
    
    def forward_get(self, owner: str, key: str) -> Optional[Any]:
        """Forward GET request to owner node."""
        for peer_id, host, port in self.peers:
            if peer_id == owner:
                response = self.send_to_peer(host, port, {
                    'type': 'get',
                    'key': key
                })
                return response.get('value')
        return None
    
    def forward_put(self, owner: str, key: str, value: Any):
        """Forward PUT request to owner node."""
        for peer_id, host, port in self.peers:
            if peer_id == owner:
                self.send_to_peer(host, port, {
                    'type': 'put',
                    'key': key,
                    'value': value
                })
                break
    
    def send_to_peer(self, host: str, port: int, message: dict) -> dict:
        """Send message to peer node."""
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.connect((host, port))
            s.sendall(json.dumps(message).encode())
            response = s.recv(4096)
            return json.loads(response.decode())
    
    def handle_request(self, conn, addr):
        """Handle incoming request."""
        try:
            data = conn.recv(4096)
            message = json.loads(data.decode())
            
            if message['type'] == 'get':
                value = self.data.get(message['key'])
                response = {'value': value['value'] if value else None}
            
            elif message['type'] == 'put':
                self.put(message['key'], message['value'])
                response = {'status': 'ok'}
            
            elif message['type'] == 'replicate':
                # Merge vector clocks
                for node, timestamp in message['vector_clock'].items():
                    if node not in self.vector_clock:
                        self.vector_clock[node] = 0
                    self.vector_clock[node] = max(
                        self.vector_clock[node],
                        timestamp
                    )
                
                self.data[message['key']] = {
                    'value': message['value'],
                    'vector_clock': message['vector_clock']
                }
                response = {'status': 'ok'}
            
            else:
                response = {'error': 'unknown type'}
            
            conn.sendall(json.dumps(response).encode())
        
        except Exception as e:
            print(f"Error handling request: {e}")
        finally:
            conn.close()
    
    def start(self):
        """Start node server."""
        server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        server.bind(('localhost', self.port))
        server.listen(5)
        
        print(f"Node {self.node_id} listening on port {self.port}")
        
        while self.running:
            try:
                conn, addr = server.accept()
                thread = threading.Thread(
                    target=self.handle_request,
                    args=(conn, addr)
                )
                thread.start()
            except Exception as e:
                print(f"Server error: {e}")
                break
        
        server.close()

# Usage example
if __name__ == "__main__":
    # Create 3-node cluster
    peers_1 = [('node2', 'localhost', 5002), ('node3', 'localhost', 5003)]
    peers_2 = [('node1', 'localhost', 5001), ('node3', 'localhost', 5003)]
    peers_3 = [('node1', 'localhost', 5001), ('node2', 'localhost', 5002)]
    
    node1 = Node('node1', 5001, peers_1)
    node2 = Node('node2', 5002, peers_2)
    node3 = Node('node3', 5003, peers_3)
    
    # Start nodes in separate threads
    threading.Thread(target=node1.start).start()
    threading.Thread(target=node2.start).start()
    threading.Thread(target=node3.start).start()
    
    # Test operations
    import time
    time.sleep(1)  # Let servers start
    
    node1.put('user:1', {'name': 'Alice', 'age': 25})
    node2.put('user:2', {'name': 'Bob', 'age': 30})
    
    print(node1.get('user:1'))
    print(node2.get('user:2'))
    print(node3.get('user:1'))  # Should forward to node1
```

---

This comprehensive distributed systems guide covers fundamental concepts, algorithms, and practical implementations. Let me continue with more files.
