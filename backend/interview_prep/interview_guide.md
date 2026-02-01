# FAANG Backend Interview Preparation Guide

## Table of Contents
1. [Interview Process Overview](#interview-process-overview)
2. [Coding Interview Strategies](#coding-interview-strategies)
3. [Advanced Coding Topics](#advanced-coding-topics)
4. [System Design Interview Framework](#system-design-interview-framework)
5. [Behavioral Interview Preparation](#behavioral-interview-preparation)
6. [Domain-Specific Backend Questions](#domain-specific-backend-questions)
7. [Object-Oriented Design (OOD)](#object-oriented-design-ood)
8. [Production & Infrastructure Questions](#production--infrastructure-questions)
9. [Company-Specific Tips](#company-specific-tips)
10. [Language-Specific Tips](#language-specific-tips)
11. [Common Mistakes to Avoid](#common-mistakes-to-avoid)
12. [Negotiation & Offer Stage](#negotiation--offer-stage)
13. [Salary & Compensation Data](#salary--compensation-data)
14. [Post-Interview Actions](#post-interview-actions)
15. [Mental Preparation & Interview Anxiety](#mental-preparation--interview-anxiety)
16. [Practice Resources](#practice-resources)
17. [Timeline & Study Plan](#timeline--study-plan)

---

## Interview Process Overview

### Typical FAANG Interview Stages

**1. Phone Screen** (45-60 min)
- 1-2 coding questions (LeetCode Easy/Medium)
- Behavioral questions
- **Pass Rate**: ~30%

**2. Onsite/Virtual Onsite** (4-6 rounds × 45-60 min)
- **Coding** (2-3 rounds): LeetCode Medium/Hard
- **System Design** (1-2 rounds): Design scalable systems
- **Behavioral** (1 round): Leadership principles, past experience
- **Domain-Specific** (Optional): ML, distributed systems, etc.
- **Pass Rate**: ~15-20%

**3. Hiring Committee**
- Review feedback from all rounds
- Decision: Hire / No hire / Repeat interview

**Total Timeline**: 6-8 weeks from application to offer

---

## Coding Interview Strategies

### Before the Interview

**Preparation**:
```
Timeframe: 3-6 months
Target: 200-300 problems (LeetCode)
Distribution:
- Easy: 30% (confidence builders)
- Medium: 60% (interview standard)
- Hard: 10% (FAANG level)
```

**Problem Categories** (Master these):
```
1. Arrays & Strings (40 problems)
2. Linked Lists (20 problems)
3. Trees & Graphs (40 problems)
4. Dynamic Programming (30 problems)
5. Sorting & Searching (20 problems)
6. Hash Tables (20 problems)
7. Stacks & Queues (15 problems)
8. Recursion & Backtracking (15 problems)
```

### During the Interview

**Step-by-Step Framework**:

**1. Clarify the Problem** (2-3 min)
```
Questions to Ask:
- Input format? (e.g., sorted array? can have duplicates?)
- Output format?
- Edge cases? (empty input, negative numbers, etc.)
- Constraints? (time/space complexity requirements)

Example:
Interviewer: "Find two numbers that sum to target"
You: "Can the array have duplicates?" → Clarify!
     "Should I return indices or values?"
     "What if no solution exists?"
```

**2. Think Out Loud** (5-7 min)
```
Approach:
1. Start with brute force
   "The naive approach would be nested loops, O(n²)"
   
2. Optimize
   "Can use hash table to get O(n) time, O(n) space"
   
3. Discuss trade-offs
   "Time vs space: hash table faster but uses more memory"
   
4. Propose best solution
   "I'll implement the hash table approach"
```

**3. Write Code** (20-25 min)
```
Best Practices:
✅ Use meaningful variable names (not x, y, z)
✅ Write clean, readable code
✅ Add comments for complex logic
✅ Handle edge cases
✅ Test as you go
```

**4. Test Your Code** (5-7 min)
```
Test Cases:
1. Normal case: [1,2,3,4], target=5 → [1,4]
2. Edge case: [], target=0 → null
3. Edge case: [1], target=1 → null
4. Large input: [1..10000], target=19999

Walk through code line by line with test case
```

**5. Analyze Complexity** (2-3 min)
```
Time: O(n) - single pass through array
Space: O(n) - hash table storage
```

### Example Problem Walkthrough

**Problem**: Two Sum (LeetCode #1)
```
Given array of integers, return indices of two numbers that add to target.
```

**Interview Dialogue**:
```
[Clarify]
You: "Can the array have duplicates?"
Interviewer: "Yes"
You: "Can I use the same element twice?"
Interviewer: "No, each element used once"
You: "What if no solution?"
Interviewer: "Assume exactly one solution"

[Think Out Loud]
You: "Brute force: Check all pairs - O(n²) time, O(1) space"
     "Better: Use hash table to store seen numbers"
     "As I iterate, check if complement (target - current) exists"
     "O(n) time, O(n) space"

[Code]
```

```python
def twoSum(nums, target):
    """
    Time: O(n)
    Space: O(n)
    """
    seen = {}  # num -> index
    
    for i, num in enumerate(nums):
        complement = target - num
        
        if complement in seen:
            return [seen[complement], i]
        
        seen[num] = i
    
    return None  # No solution (shouldn't reach here per problem)
```

```
[Test]
You: "Let me test with [2,7,11,15], target=9"
     "i=0, num=2, complement=7, not in seen, seen={2:0}"
     "i=1, num=7, complement=2, found! return [0,1]" ✓

[Edge Cases]
You: "Edge case: [1], target=2 → no pair, return None"
     "Edge case: [3,3], target=6 → [0,1]" ✓

[Complexity]
You: "Time complexity: O(n) single pass"
     "Space complexity: O(n) for hash table"
```

### Common Patterns to Master

**1. Sliding Window**
```python
# Max sum subarray of size k
def maxSumSubarray(arr, k):
    window_sum = sum(arr[:k])
    max_sum = window_sum
    
    for i in range(k, len(arr)):
        window_sum += arr[i] - arr[i-k]  # Slide window
        max_sum = max(max_sum, window_sum)
    
    return max_sum
```

**2. Two Pointers**
```python
# Remove duplicates from sorted array (in-place)
def removeDuplicates(nums):
    if not nums:
        return 0
    
    slow = 0
    for fast in range(1, len(nums)):
        if nums[fast] != nums[slow]:
            slow += 1
            nums[slow] = nums[fast]
    
    return slow + 1
```

**3. Fast & Slow Pointers**
```python
# Detect cycle in linked list
def hasCycle(head):
    slow = fast = head
    
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
        
        if slow == fast:
            return True
    
    return False
```

**4. Binary Search**
```python
# Find insert position in sorted array
def searchInsert(nums, target):
    left, right = 0, len(nums) - 1
    
    while left <= right:
        mid = (left + right) // 2
        
        if nums[mid] == target:
            return mid
        elif nums[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    
    return left
```

---

## Advanced Coding Topics

> **Purpose**: Master complex algorithmic patterns that frequently appear in senior-level FAANG interviews. These topics separate mid-level from senior candidates.

### Why Advanced Topics Matter

- **Senior Roles**: L5+ positions expect mastery beyond basic DSA
- **Signal Strength**: Demonstrates deep CS fundamentals
- **Problem Solving**: Shows ability to tackle novel, complex problems
- **Trade-offs**: Understanding when to use sophisticated vs simple solutions

**When to Study**: After mastering 200+ LeetCode problems (Easy/Medium)

---

### 1. Bit Manipulation

**What**: Direct manipulation of bits using bitwise operators (`&`, `|`, `^`, `~`, `<<`, `>>`)

**Why Use**:
- **Performance**: 10-100x faster than arithmetic operations
- **Space**: Compact storage (32/64 values in single integer)
- **Interview Signal**: Shows low-level understanding

**Common Patterns**:

#### Pattern 1: Check/Set/Clear/Toggle Bit
```python
# Check if i-th bit is set
def is_bit_set(num, i):
    return (num & (1 << i)) != 0

# Set i-th bit
def set_bit(num, i):
    return num | (1 << i)

# Clear i-th bit
def clear_bit(num, i):
    return num & ~(1 << i)

# Toggle i-th bit
def toggle_bit(num, i):
    return num ^ (1 << i)

# Example: Permissions system
READ = 1 << 0   # 0001
WRITE = 1 << 1  # 0010
EXEC = 1 << 2   # 0100

perms = READ | WRITE  # Grant read + write
has_write = (perms & WRITE) != 0  # Check write permission
```

```go
// Go implementation
package main

func isBitSet(num, i int) bool {
    return (num & (1 << i)) != 0
}

func setBit(num, i int) int {
    return num | (1 << i)
}

func clearBit(num, i int) int {
    return num &^ (1 << i)  // Go's AND-NOT operator
}

// Permissions example
const (
    READ  = 1 << 0  // 1
    WRITE = 1 << 1  // 2
    EXEC  = 1 << 2  // 4
)

func main() {
    perms := READ | WRITE
    hasWrite := (perms & WRITE) != 0
}
```

#### Pattern 2: Count Set Bits (Hamming Weight)
```python
def count_bits(n):
    """
    Count number of 1s in binary representation.
    Time: O(log n) - number of bits
    
    Trick: n & (n-1) removes rightmost 1 bit
    """
    count = 0
    while n:
        n &= n - 1  # Remove rightmost 1
        count += 1
    return count

# Example: n = 13 (1101)
# n & (n-1) = 13 & 12 = 1101 & 1100 = 1100 (removed rightmost 1)
# n & (n-1) = 12 & 11 = 1100 & 1011 = 1000
# n & (n-1) = 8 & 7 = 1000 & 0111 = 0000
# Count = 3

# Built-in (Python)
bin(13).count('1')  # 3
```

#### Pattern 3: XOR Tricks
```python
# Find single number in array where every other appears twice
def single_number(nums):
    """
    XOR properties:
    - a ^ a = 0
    - a ^ 0 = a
    - XOR is commutative and associative
    
    [4,1,2,1,2] -> 4^1^2^1^2 = 4^(1^1)^(2^2) = 4^0^0 = 4
    """
    result = 0
    for num in nums:
        result ^= num
    return result

# Swap without temp variable
def swap(a, b):
    a ^= b
    b ^= a  # b = a ^ b ^ b = a
    a ^= b  # a = a ^ b ^ a = b
    return a, b

# Find missing number in [0,n]
def missing_number(nums):
    """
    [3,0,1] -> missing 2
    XOR all indices with all values
    """
    result = len(nums)  # Start with n
    for i, num in enumerate(nums):
        result ^= i ^ num
    return result
```

#### Pattern 4: Subset Generation
```python
def generate_subsets(nums):
    """
    Generate all 2^n subsets using bit manipulation.
    Each bit represents inclusion of nums[i].
    
    Time: O(n * 2^n)
    Space: O(2^n)
    """
    n = len(nums)
    result = []
    
    # Iterate through all bitmasks [0, 2^n - 1]
    for mask in range(1 << n):
        subset = []
        for i in range(n):
            if mask & (1 << i):  # If i-th bit is set
                subset.append(nums[i])
        result.append(subset)
    
    return result

# Example: nums = [1,2,3]
# mask=0 (000) -> []
# mask=1 (001) -> [1]
# mask=2 (010) -> [2]
# mask=3 (011) -> [1,2]
# mask=4 (100) -> [3]
# mask=5 (101) -> [1,3]
# mask=6 (110) -> [2,3]
# mask=7 (111) -> [1,2,3]
```

#### Interview Problem: Power of Two
```python
def is_power_of_two(n):
    """
    Power of 2 has exactly one bit set: 8 = 1000
    n & (n-1) removes that bit: 8 & 7 = 1000 & 0111 = 0
    
    Time: O(1)
    """
    return n > 0 and (n & (n-1)) == 0

# Test
assert is_power_of_two(8) == True
assert is_power_of_two(6) == False
```

**When to Use Bit Manipulation**:
- ✅ Encoding multiple booleans (feature flags, permissions)
- ✅ Fast integer operations (multiply/divide by powers of 2)
- ✅ Finding duplicates/missing numbers with XOR
- ✅ Subset generation
- ❌ When readability matters more than performance
- ❌ Floating-point operations

**Pros**:
- Extremely fast (single CPU instruction)
- Memory efficient
- Elegant solutions to specific problems

**Cons**:
- Hard to read/maintain
- Easy to introduce bugs
- Limited applicability

---

### 2. Advanced Graph Algorithms

#### A. Topological Sort (DAG Ordering)

**What**: Linear ordering of vertices where for every edge (u→v), u comes before v.

**When to Use**:
- Task scheduling with dependencies
- Build systems (compile order)
- Course prerequisites
- Detecting cycles in directed graphs

**Implementation (Kahn's Algorithm)**:
```python
from collections import defaultdict, deque

def topological_sort(n, edges):
    """
    Kahn's Algorithm using BFS.
    
    Args:
        n: Number of nodes (0 to n-1)
        edges: List of [from, to] directed edges
    
    Returns:
        List of nodes in topological order, or [] if cycle exists
    
    Time: O(V + E)
    Space: O(V + E)
    """
    # Build adjacency list and in-degree count
    graph = defaultdict(list)
    in_degree = [0] * n
    
    for u, v in edges:
        graph[u].append(v)
        in_degree[v] += 1
    
    # Start with nodes that have no dependencies
    queue = deque([i for i in range(n) if in_degree[i] == 0])
    result = []
    
    while queue:
        node = queue.popleft()
        result.append(node)
        
        # Remove this node from graph
        for neighbor in graph[node]:
            in_degree[neighbor] -= 1
            if in_degree[neighbor] == 0:
                queue.append(neighbor)
    
    # If result doesn't contain all nodes, there's a cycle
    return result if len(result) == n else []

# Example: Course Schedule
# courses = 4, prerequisites = [[1,0],[2,0],[3,1],[3,2]]
# Meaning: Take course 0 before 1, 0 before 2, 1 before 3, 2 before 3
# Valid order: [0, 1, 2, 3] or [0, 2, 1, 3]
```

```go
// Go implementation
package main

func topologicalSort(n int, edges [][]int) []int {
    graph := make([][]int, n)
    inDegree := make([]int, n)
    
    for _, edge := range edges {
        u, v := edge[0], edge[1]
        graph[u] = append(graph[u], v)
        inDegree[v]++
    }
    
    queue := []int{}
    for i := 0; i < n; i++ {
        if inDegree[i] == 0 {
            queue = append(queue, i)
        }
    }
    
    result := []int{}
    for len(queue) > 0 {
        node := queue[0]
        queue = queue[1:]
        result = append(result, node)
        
        for _, neighbor := range graph[node] {
            inDegree[neighbor]--
            if inDegree[neighbor] == 0 {
                queue = append(queue, neighbor)
            }
        }
    }
    
    if len(result) != n {
        return []int{}  // Cycle detected
    }
    return result
}
```

**DFS-based Topological Sort**:
```python
def topological_sort_dfs(n, edges):
    """
    DFS approach: Post-order traversal gives reverse topological order.
    
    Time: O(V + E)
    Space: O(V + E)
    """
    graph = defaultdict(list)
    for u, v in edges:
        graph[u].append(v)
    
    visited = [False] * n
    stack = []
    
    def dfs(node, visiting):
        if visiting[node]:  # Cycle detected
            return False
        if visited[node]:
            return True
        
        visiting[node] = True
        for neighbor in graph[node]:
            if not dfs(neighbor, visiting):
                return False
        visiting[node] = False
        
        visited[node] = True
        stack.append(node)
        return True
    
    visiting = [False] * n
    for i in range(n):
        if not visited[i]:
            if not dfs(i, visiting):
                return []  # Cycle
    
    return stack[::-1]  # Reverse for correct order
```

#### B. Dijkstra's Algorithm (Shortest Path)

**What**: Find shortest path from source to all nodes in weighted graph (non-negative weights).

**When to Use**:
- GPS navigation (shortest route)
- Network routing protocols
- Game pathfinding
- Flight booking (cheapest route)

**Implementation**:
```python
import heapq
from collections import defaultdict

def dijkstra(n, edges, src):
    """
    Dijkstra's shortest path algorithm.
    
    Args:
        n: Number of nodes (0 to n-1)
        edges: List of [u, v, weight]
        src: Source node
    
    Returns:
        Dictionary {node: shortest_distance}
    
    Time: O((V + E) log V) with binary heap
    Space: O(V + E)
    """
    graph = defaultdict(list)
    for u, v, w in edges:
        graph[u].append((v, w))
        # graph[v].append((u, w))  # Uncomment for undirected
    
    # Min heap: (distance, node)
    heap = [(0, src)]
    distances = {i: float('inf') for i in range(n)}
    distances[src] = 0
    visited = set()
    
    while heap:
        dist, node = heapq.heappop(heap)
        
        if node in visited:
            continue
        visited.add(node)
        
        for neighbor, weight in graph[node]:
            new_dist = dist + weight
            
            if new_dist < distances[neighbor]:
                distances[neighbor] = new_dist
                heapq.heappush(heap, (new_dist, neighbor))
    
    return distances

# Example: Find shortest path from node 0
# edges = [[0,1,4], [0,2,1], [2,1,2], [1,3,1], [2,3,5]]
# Result: {0: 0, 1: 3, 2: 1, 3: 4}
```

```go
// Go implementation with container/heap
package main

import "container/heap"

type Edge struct {
    to, weight int
}

type Item struct {
    node, dist int
}

type PriorityQueue []*Item

func (pq PriorityQueue) Len() int           { return len(pq) }
func (pq PriorityQueue) Less(i, j int) bool { return pq[i].dist < pq[j].dist }
func (pq PriorityQueue) Swap(i, j int)      { pq[i], pq[j] = pq[j], pq[i] }

func (pq *PriorityQueue) Push(x interface{}) {
    *pq = append(*pq, x.(*Item))
}

func (pq *PriorityQueue) Pop() interface{} {
    old := *pq
    n := len(old)
    item := old[n-1]
    *pq = old[0 : n-1]
    return item
}

func dijkstra(n int, edges [][]int, src int) map[int]int {
    graph := make([][]Edge, n)
    for _, e := range edges {
        u, v, w := e[0], e[1], e[2]
        graph[u] = append(graph[u], Edge{v, w})
    }
    
    distances := make(map[int]int)
    for i := 0; i < n; i++ {
        distances[i] = 1<<31 - 1  // Max int
    }
    distances[src] = 0
    
    pq := &PriorityQueue{}
    heap.Init(pq)
    heap.Push(pq, &Item{src, 0})
    
    visited := make(map[int]bool)
    
    for pq.Len() > 0 {
        item := heap.Pop(pq).(*Item)
        node, dist := item.node, item.dist
        
        if visited[node] {
            continue
        }
        visited[node] = true
        
        for _, edge := range graph[node] {
            newDist := dist + edge.weight
            if newDist < distances[edge.to] {
                distances[edge.to] = newDist
                heap.Push(pq, &Item{edge.to, newDist})
            }
        }
    }
    
    return distances
}
```

**Dijkstra with Path Reconstruction**:
```python
def dijkstra_with_path(n, edges, src, dest):
    """Return shortest distance AND path."""
    graph = defaultdict(list)
    for u, v, w in edges:
        graph[u].append((v, w))
    
    heap = [(0, src, [src])]  # (dist, node, path)
    visited = set()
    
    while heap:
        dist, node, path = heapq.heappop(heap)
        
        if node == dest:
            return dist, path
        
        if node in visited:
            continue
        visited.add(node)
        
        for neighbor, weight in graph[node]:
            if neighbor not in visited:
                heapq.heappush(heap, (
                    dist + weight,
                    neighbor,
                    path + [neighbor]
                ))
    
    return float('inf'), []

# Example
dist, path = dijkstra_with_path(4, [[0,1,4],[0,2,1],[2,1,2],[1,3,1]], 0, 3)
# Result: dist=4, path=[0,2,1,3]
```

#### C. Union-Find (Disjoint Set Union)

**What**: Data structure to track and merge disjoint sets efficiently.

**When to Use**:
- Detecting cycles in undirected graphs
- Kruskal's MST algorithm
- Network connectivity
- Image segmentation (connected components)

**Implementation with Path Compression + Union by Rank**:
```python
class UnionFind:
    """
    Union-Find with path compression and union by rank.
    
    Operations: O(α(n)) amortized, where α is inverse Ackermann function
    (effectively O(1) for practical purposes)
    """
    
    def __init__(self, n):
        self.parent = list(range(n))  # parent[i] = parent of i
        self.rank = [0] * n           # rank[i] = depth of tree rooted at i
        self.components = n           # Number of disjoint sets
    
    def find(self, x):
        """
        Find root of x with path compression.
        Path compression: Make every node point directly to root.
        """
        if self.parent[x] != x:
            self.parent[x] = self.find(self.parent[x])  # Recursively compress
        return self.parent[x]
    
    def union(self, x, y):
        """
        Union sets containing x and y.
        Union by rank: Attach smaller tree under larger tree.
        
        Returns True if x and y were in different sets.
        """
        root_x = self.find(x)
        root_y = self.find(y)
        
        if root_x == root_y:
            return False  # Already in same set
        
        # Union by rank
        if self.rank[root_x] < self.rank[root_y]:
            self.parent[root_x] = root_y
        elif self.rank[root_x] > self.rank[root_y]:
            self.parent[root_y] = root_x
        else:
            self.parent[root_y] = root_x
            self.rank[root_x] += 1
        
        self.components -= 1
        return True
    
    def connected(self, x, y):
        """Check if x and y are in same set."""
        return self.find(x) == self.find(y)
    
    def count_components(self):
        """Return number of disjoint sets."""
        return self.components

# Example: Detect cycle in undirected graph
def has_cycle(n, edges):
    """
    edges = [[0,1], [1,2], [2,0]] -> True (cycle)
    edges = [[0,1], [1,2], [2,3]] -> False (no cycle)
    """
    uf = UnionFind(n)
    
    for u, v in edges:
        if uf.connected(u, v):
            return True  # Edge between nodes in same set = cycle
        uf.union(u, v)
    
    return False

# Example: Number of connected components
def count_components(n, edges):
    uf = UnionFind(n)
    for u, v in edges:
        uf.union(u, v)
    return uf.count_components()
```

```go
// Go implementation
package main

type UnionFind struct {
    parent     []int
    rank       []int
    components int
}

func NewUnionFind(n int) *UnionFind {
    uf := &UnionFind{
        parent:     make([]int, n),
        rank:       make([]int, n),
        components: n,
    }
    for i := range uf.parent {
        uf.parent[i] = i
    }
    return uf
}

func (uf *UnionFind) Find(x int) int {
    if uf.parent[x] != x {
        uf.parent[x] = uf.Find(uf.parent[x])  // Path compression
    }
    return uf.parent[x]
}

func (uf *UnionFind) Union(x, y int) bool {
    rootX := uf.Find(x)
    rootY := uf.Find(y)
    
    if rootX == rootY {
        return false
    }
    
    if uf.rank[rootX] < uf.rank[rootY] {
        uf.parent[rootX] = rootY
    } else if uf.rank[rootX] > uf.rank[rootY] {
        uf.parent[rootY] = rootX
    } else {
        uf.parent[rootY] = rootX
        uf.rank[rootX]++
    }
    
    uf.components--
    return true
}

func (uf *UnionFind) Connected(x, y int) bool {
    return uf.Find(x) == uf.Find(y)
}
```

#### D. Tarjan's Algorithm (Strongly Connected Components)

**What**: Find all strongly connected components (SCCs) in directed graph.

**When to Use**:
- Identifying circular dependencies
- Analyzing social network clusters
- Optimizing code (dead code detection)

```python
def tarjan_scc(n, edges):
    """
    Tarjan's algorithm for finding SCCs.
    
    Time: O(V + E)
    Space: O(V)
    
    Returns: List of SCCs (each SCC is list of nodes)
    """
    graph = defaultdict(list)
    for u, v in edges:
        graph[u].append(v)
    
    index_counter = [0]
    stack = []
    lowlinks = {}
    index = {}
    on_stack = set()
    sccs = []
    
    def strongconnect(node):
        index[node] = index_counter[0]
        lowlinks[node] = index_counter[0]
        index_counter[0] += 1
        stack.append(node)
        on_stack.add(node)
        
        for neighbor in graph[node]:
            if neighbor not in index:
                strongconnect(neighbor)
                lowlinks[node] = min(lowlinks[node], lowlinks[neighbor])
            elif neighbor in on_stack:
                lowlinks[node] = min(lowlinks[node], index[neighbor])
        
        if lowlinks[node] == index[node]:
            scc = []
            while True:
                w = stack.pop()
                on_stack.remove(w)
                scc.append(w)
                if w == node:
                    break
            sccs.append(scc)
    
    for node in range(n):
        if node not in index:
            strongconnect(node)
    
    return sccs

# Example: edges = [[0,1], [1,2], [2,0], [1,3], [3,4], [4,3]]
# SCCs: [[0,1,2], [3,4]]
```

**When to Use Which Graph Algorithm**:

| Problem | Algorithm | Time | Use Case |
|---------|-----------|------|----------|
| Shortest path (unweighted) | BFS | O(V+E) | Social network distance |
| Shortest path (weighted, non-negative) | Dijkstra | O((V+E)logV) | GPS navigation |
| Shortest path (negative weights) | Bellman-Ford | O(VE) | Currency exchange |
| All-pairs shortest path | Floyd-Warshall | O(V³) | Small dense graphs |
| Minimum spanning tree | Kruskal/Prim | O(ElogE) | Network design |
| Topological sort | Kahn's/DFS | O(V+E) | Task scheduling |
| Strongly connected components | Tarjan/Kosaraju | O(V+E) | Dependency analysis |
| Cycle detection | DFS/Union-Find | O(V+E) | Deadlock detection |

---

### 3. Advanced String Algorithms

#### A. KMP (Knuth-Morris-Pratt) Pattern Matching

**What**: Efficient substring search without backtracking.

**Why**: O(n+m) instead of O(nm) brute force.

**When to Use**:
- Text search in large documents
- DNA sequence matching
- Plagiarism detection

**How It Works**:
1. Build LPS (Longest Prefix Suffix) array for pattern
2. Use LPS to skip characters we've already matched

```python
def kmp_search(text, pattern):
    """
    KMP pattern matching.
    
    Args:
        text: String to search in
        pattern: Pattern to find
    
    Returns:
        List of starting indices where pattern found
    
    Time: O(n + m) where n=len(text), m=len(pattern)
    Space: O(m)
    """
    if not pattern:
        return [0]
    
    # Build LPS (Longest Prefix Suffix) array
    def build_lps(pattern):
        m = len(pattern)
        lps = [0] * m
        length = 0  # Length of previous longest prefix suffix
        i = 1
        
        while i < m:
            if pattern[i] == pattern[length]:
                length += 1
                lps[i] = length
                i += 1
            else:
                if length != 0:
                    length = lps[length - 1]
                else:
                    lps[i] = 0
                    i += 1
        
        return lps
    
    lps = build_lps(pattern)
    result = []
    
    i = 0  # Index for text
    j = 0  # Index for pattern
    n, m = len(text), len(pattern)
    
    while i < n:
        if text[i] == pattern[j]:
            i += 1
            j += 1
        
        if j == m:
            result.append(i - j)
            j = lps[j - 1]
        elif i < n and text[i] != pattern[j]:
            if j != 0:
                j = lps[j - 1]  # Don't match lps[0..j-1], they will match anyway
            else:
                i += 1
    
    return result

# Example
text = "ABABDABACDABABCABAB"
pattern = "ABABCABAB"
print(kmp_search(text, pattern))  # [10] - pattern starts at index 10

# LPS example for pattern "ABABCABAB":
# Pattern: A B A B C A B A B
# LPS:     0 0 1 2 0 1 2 3 4
# 
# LPS[4]=0 because "ABABC" has no proper prefix = suffix
# LPS[8]=4 because "ABABCABAB" has "ABAB" as prefix and suffix
```

```go
// Go implementation
func kmpSearch(text, pattern string) []int {
    if len(pattern) == 0 {
        return []int{0}
    }
    
    // Build LPS array
    buildLPS := func(pattern string) []int {
        m := len(pattern)
        lps := make([]int, m)
        length := 0
        i := 1
        
        for i < m {
            if pattern[i] == pattern[length] {
                length++
                lps[i] = length
                i++
            } else {
                if length != 0 {
                    length = lps[length-1]
                } else {
                    lps[i] = 0
                    i++
                }
            }
        }
        return lps
    }
    
    lps := buildLPS(pattern)
    result := []int{}
    i, j := 0, 0
    n, m := len(text), len(pattern)
    
    for i < n {
        if text[i] == pattern[j] {
            i++
            j++
        }
        
        if j == m {
            result = append(result, i-j)
            j = lps[j-1]
        } else if i < n && text[i] != pattern[j] {
            if j != 0 {
                j = lps[j-1]
            } else {
                i++
            }
        }
    }
    
    return result
}
```

#### B. Trie (Prefix Tree)

**What**: Tree data structure for efficient string storage and retrieval.

**When to Use**:
- Autocomplete systems
- Spell checkers
- IP routing tables
- Word games (Boggle, Scrabble)

**Implementation**:
```python
class TrieNode:
    def __init__(self):
        self.children = {}  # char -> TrieNode
        self.is_end_of_word = False
        self.word = None  # Optional: store full word

class Trie:
    """
    Trie (Prefix Tree) implementation.
    
    Operations:
    - Insert: O(m) where m = word length
    - Search: O(m)
    - StartsWith: O(m)
    - Space: O(ALPHABET_SIZE * N * M) where N = number of words
    """
    
    def __init__(self):
        self.root = TrieNode()
    
    def insert(self, word: str) -> None:
        """Insert word into trie."""
        node = self.root
        for char in word:
            if char not in node.children:
                node.children[char] = TrieNode()
            node = node.children[char]
        node.is_end_of_word = True
        node.word = word
    
    def search(self, word: str) -> bool:
        """Return True if word exists in trie."""
        node = self.root
        for char in word:
            if char not in node.children:
                return False
            node = node.children[char]
        return node.is_end_of_word
    
    def starts_with(self, prefix: str) -> bool:
        """Return True if any word starts with prefix."""
        node = self.root
        for char in prefix:
            if char not in node.children:
                return False
            node = node.children[char]
        return True
    
    def get_all_words_with_prefix(self, prefix: str) -> list:
        """Return all words starting with prefix."""
        node = self.root
        for char in prefix:
            if char not in node.children:
                return []
            node = node.children[char]
        
        # DFS from this node to collect all words
        words = []
        def dfs(node):
            if node.is_end_of_word:
                words.append(node.word)
            for child in node.children.values():
                dfs(child)
        
        dfs(node)
        return words
    
    def delete(self, word: str) -> bool:
        """Delete word from trie. Return True if deleted."""
        def delete_helper(node, word, index):
            if index == len(word):
                if not node.is_end_of_word:
                    return False  # Word doesn't exist
                node.is_end_of_word = False
                return len(node.children) == 0  # Delete if no children
            
            char = word[index]
            if char not in node.children:
                return False
            
            child = node.children[char]
            should_delete_child = delete_helper(child, word, index + 1)
            
            if should_delete_child:
                del node.children[char]
                return len(node.children) == 0 and not node.is_end_of_word
            
            return False
        
        return delete_helper(self.root, word, 0)

# Example: Autocomplete system
trie = Trie()
words = ["apple", "app", "apricot", "banana", "band"]
for word in words:
    trie.insert(word)

print(trie.search("app"))  # True
print(trie.search("appl"))  # False
print(trie.starts_with("app"))  # True
print(trie.get_all_words_with_prefix("ap"))  # ['apple', 'app', 'apricot']
```

```go
// Go implementation
type TrieNode struct {
    children map[rune]*TrieNode
    isEnd    bool
    word     string
}

type Trie struct {
    root *TrieNode
}

func NewTrie() *Trie {
    return &Trie{
        root: &TrieNode{
            children: make(map[rune]*TrieNode),
        },
    }
}

func (t *Trie) Insert(word string) {
    node := t.root
    for _, char := range word {
        if _, exists := node.children[char]; !exists {
            node.children[char] = &TrieNode{
                children: make(map[rune]*TrieNode),
            }
        }
        node = node.children[char]
    }
    node.isEnd = true
    node.word = word
}

func (t *Trie) Search(word string) bool {
    node := t.root
    for _, char := range word {
        if _, exists := node.children[char]; !exists {
            return false
        }
        node = node.children[char]
    }
    return node.isEnd
}

func (t *Trie) StartsWith(prefix string) bool {
    node := t.root
    for _, char := range prefix {
        if _, exists := node.children[char]; !exists {
            return false
        }
        node = node.children[char]
    }
    return true
}
```

#### C. Suffix Array & LCP

**What**: Sorted array of all suffixes of a string.

**When to Use**:
- Finding longest repeated substring
- Pattern matching with wildcards
- Burrows-Wheeler Transform (compression)

```python
def build_suffix_array(s):
    """
    Build suffix array using simple sorting.
    
    Time: O(n² log n) - can be optimized to O(n log n)
    Space: O(n)
    """
    n = len(s)
    suffixes = [(s[i:], i) for i in range(n)]
    suffixes.sort()
    return [suffix[1] for suffix in suffixes]

def build_lcp_array(s, suffix_array):
    """
    Build Longest Common Prefix array.
    lcp[i] = length of longest common prefix of suffix[i] and suffix[i+1]
    
    Time: O(n)
    """
    n = len(s)
    rank = [0] * n
    for i, suffix_idx in enumerate(suffix_array):
        rank[suffix_idx] = i
    
    lcp = [0] * (n - 1)
    h = 0
    
    for i in range(n):
        if rank[i] > 0:
            j = suffix_array[rank[i] - 1]
            while i + h < n and j + h < n and s[i + h] == s[j + h]:
                h += 1
            lcp[rank[i] - 1] = h
            if h > 0:
                h -= 1
    
    return lcp

# Example: Find longest repeated substring
def longest_repeated_substring(s):
    """
    Use suffix array + LCP to find longest repeated substring.
    
    Time: O(n² log n)
    """
    if not s:
        return ""
    
    suffix_array = build_suffix_array(s)
    lcp = build_lcp_array(s, suffix_array)
    
    max_len = 0
    max_idx = 0
    
    for i, length in enumerate(lcp):
        if length > max_len:
            max_len = length
            max_idx = suffix_array[i]
    
    return s[max_idx:max_idx + max_len]

# Example
s = "banana"
print(longest_repeated_substring(s))  # "ana"
# Suffixes: a, ana, anana, banana, na, nana
# Suffix Array: [5, 3, 1, 0, 4, 2]
# LCP: [1, 3, 0, 0, 2] -> max=3 at index 1
```

---

### 4. Advanced Dynamic Programming Patterns

#### A. Bitmask DP

**What**: Use bitmask to represent state in DP.

**When to Use**:
- Subset problems where N ≤ 20
- Traveling Salesman Problem
- Assignment problems

```python
def traveling_salesman(dist):
    """
    TSP using bitmask DP.
    
    dist[i][j] = distance from city i to city j
    
    State: dp[mask][i] = minimum cost to visit cities in mask, ending at i
    
    Time: O(2^n * n²)
    Space: O(2^n * n)
    """
    n = len(dist)
    ALL_VISITED = (1 << n) - 1  # All bits set
    
    # dp[mask][i] = min cost to visit cities in mask, currently at city i
    dp = [[float('inf')] * n for _ in range(1 << n)]
    dp[1][0] = 0  # Start at city 0
    
    for mask in range(1 << n):
        for i in range(n):
            if not (mask & (1 << i)):  # City i not visited
                continue
            
            for j in range(n):
                if mask & (1 << j):  # City j already visited
                    continue
                
                new_mask = mask | (1 << j)
                dp[new_mask][j] = min(
                    dp[new_mask][j],
                    dp[mask][i] + dist[i][j]
                )
    
    # Return to starting city
    return min(dp[ALL_VISITED][i] + dist[i][0] for i in range(1, n))

# Example: 4 cities
dist = [
    [0, 10, 15, 20],
    [10, 0, 35, 25],
    [15, 35, 0, 30],
    [20, 25, 30, 0]
]
print(traveling_salesman(dist))  # 80
```

#### B. Digit DP

**What**: Count numbers satisfying constraints by processing digits.

**When to Use**:
- Count numbers in range with specific properties
- Sum of digits problems

```python
def count_numbers_with_digit_sum(n, target_sum):
    """
    Count numbers from 1 to n where digit sum equals target_sum.
    
    Example: n=20, target_sum=5
    Answer: 5, 14 -> count=2
    
    Time: O(log n * target_sum * 2)
    """
    s = str(n)
    memo = {}
    
    def dp(pos, sum_so_far, tight):
        """
        pos: current digit position
        sum_so_far: sum of digits selected so far
        tight: whether we're still bounded by n
        """
        if sum_so_far > target_sum:
            return 0
        
        if pos == len(s):
            return 1 if sum_so_far == target_sum else 0
        
        if (pos, sum_so_far, tight) in memo:
            return memo[(pos, sum_so_far, tight)]
        
        limit = int(s[pos]) if tight else 9
        result = 0
        
        for digit in range(0, limit + 1):
            new_tight = tight and (digit == limit)
            result += dp(pos + 1, sum_so_far + digit, new_tight)
        
        memo[(pos, sum_so_far, tight)] = result
        return result
    
    return dp(0, 0, True) - 1  # Subtract 1 for leading zeros (number 0)
```

#### C. DP on Trees

**What**: Apply DP on tree structure.

**When to Use**:
- Maximum independent set in tree
- Tree diameter
- Tree matching problems

```python
def max_independent_set_tree(edges, values):
    """
    Find maximum sum of node values where no two adjacent nodes selected.
    
    edges: List of [u, v] (undirected tree edges)
    values: values[i] = value of node i
    
    Time: O(n)
    Space: O(n)
    """
    from collections import defaultdict
    
    n = len(values)
    graph = defaultdict(list)
    for u, v in edges:
        graph[u].append(v)
        graph[v].append(u)
    
    # dp[node][0] = max sum if node NOT selected
    # dp[node][1] = max sum if node IS selected
    dp = [[0, 0] for _ in range(n)]
    visited = set()
    
    def dfs(node, parent):
        visited.add(node)
        
        # If node is selected, children cannot be selected
        dp[node][1] = values[node]
        
        for child in graph[node]:
            if child != parent and child not in visited:
                dfs(child, node)
                
                # If node not selected, children can be selected or not
                dp[node][0] += max(dp[child][0], dp[child][1])
                
                # If node selected, children must not be selected
                dp[node][1] += dp[child][0]
    
    dfs(0, -1)
    return max(dp[0][0], dp[0][1])

# Example
edges = [[0,1], [0,2], [1,3], [1,4]]
values = [3, 2, 1, 4, 5]
#      3(0)
#     / \
#   2(1) 1(2)
#   / \
# 4(3) 5(4)
# Max independent set: {0, 3, 4} or {1, 2} -> max sum = 12
print(max_independent_set_tree(edges, values))  # 12
```

---

### 5. Computational Geometry (Basics)

#### A. Convex Hull

**What**: Smallest convex polygon containing all points.

**When to Use**:
- Geographic information systems
- Image processing
- Collision detection

**Graham Scan Algorithm**:
```python
from functools import cmp_to_key

def convex_hull(points):
    """
    Graham Scan algorithm for convex hull.
    
    Time: O(n log n)
    Space: O(n)
    """
    def cross_product(o, a, b):
        """
        Cross product of vectors OA and OB.
        > 0: counter-clockwise turn
        < 0: clockwise turn
        = 0: collinear
        """
        return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
    
    # Sort points lexicographically (by x, then y)
    points = sorted(set(points))
    
    if len(points) <= 1:
        return points
    
    # Build lower hull
    lower = []
    for p in points:
        while len(lower) >= 2 and cross_product(lower[-2], lower[-1], p) <= 0:
            lower.pop()
        lower.append(p)
    
    # Build upper hull
    upper = []
    for p in reversed(points):
        while len(upper) >= 2 and cross_product(upper[-2], upper[-1], p) <= 0:
            upper.pop()
        upper.append(p)
    
    # Remove last point of each half (it's repeated)
    return lower[:-1] + upper[:-1]

# Example
points = [(0,0), (1,1), (2,2), (2,0), (0,2), (1,0.5)]
hull = convex_hull(points)
print(hull)  # [(0,0), (2,0), (2,2), (0,2)]
```

#### B. Line Intersection

```python
def line_intersection(p1, p2, p3, p4):
    """
    Check if line segment p1-p2 intersects with p3-p4.
    
    Returns: (intersects: bool, point: tuple or None)
    """
    def cross_product(o, a, b):
        return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
    
    def on_segment(p, q, r):
        """Check if q lies on segment pr."""
        return (min(p[0], r[0]) <= q[0] <= max(p[0], r[0]) and
                min(p[1], r[1]) <= q[1] <= max(p[1], r[1]))
    
    d1 = cross_product(p3, p4, p1)
    d2 = cross_product(p3, p4, p2)
    d3 = cross_product(p1, p2, p3)
    d4 = cross_product(p1, p2, p4)
    
    if ((d1 > 0 and d2 < 0) or (d1 < 0 and d2 > 0)) and \
       ((d3 > 0 and d4 < 0) or (d3 < 0 and d4 > 0)):
        # General intersection
        x1, y1 = p1
        x2, y2 = p2
        x3, y3 = p3
        x4, y4 = p4
        
        denom = (x1-x2)*(y3-y4) - (y1-y2)*(x3-x4)
        if abs(denom) < 1e-10:
            return False, None
        
        t = ((x1-x3)*(y3-y4) - (y1-y3)*(x3-x4)) / denom
        x = x1 + t*(x2-x1)
        y = y1 + t*(y2-y1)
        return True, (x, y)
    
    # Check special cases (endpoints touching)
    if d1 == 0 and on_segment(p3, p1, p4):
        return True, p1
    if d2 == 0 and on_segment(p3, p2, p4):
        return True, p2
    if d3 == 0 and on_segment(p1, p3, p2):
        return True, p3
    if d4 == 0 and on_segment(p1, p4, p2):
        return True, p4
    
    return False, None
```

**When to Study Computational Geometry**:
- ✅ Gaming/graphics roles
- ✅ Robotics/autonomous systems
- ✅ GIS/mapping companies
- ❌ Most backend roles (rarely asked)

---

### Advanced Coding Topics - Key Takeaways

**Interview Difficulty Mapping**:

| Topic | Frequency | Difficulty | Companies |
|-------|-----------|------------|-----------|
| Bit Manipulation | Medium | Medium | Microsoft, Amazon, Google |
| Topological Sort | High | Medium | Most FAANG |
| Dijkstra | Medium | Medium-Hard | Google, Uber, Lyft |
| Union-Find | High | Medium | Facebook, Amazon |
| KMP | Low | Hard | Rarely asked directly |
| Trie | High | Medium | Google, Amazon, Microsoft |
| Bitmask DP | Low | Hard | Google (senior roles) |
| Digit DP | Very Low | Hard | Competitive programming |
| Geometry | Very Low | Hard | Gaming/Graphics companies |

**Study Priority Order**:
1. **Must Know**: Topological Sort, Union-Find, Trie, Basic Bit Manipulation
2. **Should Know**: Dijkstra, Advanced DP patterns
3. **Nice to Have**: KMP, Geometry (role-specific)

**Practice Resources**:
- **Bit Manipulation**: LeetCode 191, 338, 461, 268
- **Graph Algorithms**: LeetCode 207, 210, 684, 743, 1135
- **String Algorithms**: LeetCode 208, 211, 28, 336
- **Advanced DP**: LeetCode 847, 464, 1349, 1000

---

## System Design Interview Framework

### Preparation

**Must-Know Systems**:
```
1. URL Shortener (entry-level)
2. Twitter/News Feed
3. WhatsApp/Chat System
4. YouTube/Video Streaming
5. Uber/Location Services
6. Distributed Cache (Redis)
7. Rate Limiter
8. Search Engine
```

**Key Concepts**:
```
- CAP Theorem
- Load Balancing
- Caching (Cache-Aside, Write-Through)
- Database Scaling (Replication, Sharding)
- Microservices vs Monolith
- Message Queues
- CDN
```

### Interview Framework (45-60 min)

**1. Clarify Requirements** (5-7 min)

**Functional**:
```
Interviewer: "Design Twitter"
You: "Let me clarify the scope:"
     - Post tweets (280 chars)?
     - Follow users?
     - Timeline (user feed)?
     - Search?
     - Notifications?
     - Direct messages?
     
Interviewer: "Focus on posting and timeline"
```

**Non-Functional**:
```
You: "Scale requirements?"
     - Users: 300M monthly active
     - Tweets: 500M per day
     - Read:Write ratio: 100:1 (read-heavy)
     
     "Performance requirements?"
     - Timeline load: < 500ms
     - High availability: 99.9%
```

**2. Capacity Estimation** (5 min)

```
Traffic:
- Daily active users: 100M
- Tweets per day: 500M
- Tweets per second: 500M / 86400 = ~6000 writes/sec
- Reads per second: 6000 × 100 = 600K reads/sec

Storage:
- Tweet size: 280 chars × 2 bytes = 560 bytes
  + metadata (user_id, timestamp, etc.) = ~1KB
- Daily: 500M × 1KB = 500GB/day
- 5 years: 500GB × 365 × 5 = ~900TB

Bandwidth:
- Ingress: 6000 tweets/sec × 1KB = 6 MB/sec
- Egress: 600K reads/sec × 1KB = 600 MB/sec

Cache:
- 80/20 rule: 20% tweets = 80% traffic
- Cache size: 900TB × 0.2 = 180TB (impractical)
- Cache hot data: Last 24 hours = 500GB
```

**3. High-Level Design** (10 min)

```
Draw on whiteboard:

┌─────────┐
│ Client  │
└────┬────┘
     │
     ▼
┌──────────────┐
│ Load Balancer│
└──────┬───────┘
       │
       ├────────────┬────────────┐
       ▼            ▼            ▼
┌──────────┐  ┌──────────┐  ┌──────────┐
│ Web      │  │ Web      │  │ Web      │
│ Server 1 │  │ Server 2 │  │ Server 3 │
└────┬─────┘  └────┬─────┘  └────┬─────┘
     │             │             │
     └─────────────┴─────────────┘
                   │
          ┌────────┼────────┐
          │        │        │
          ▼        ▼        ▼
    ┌─────────┬─────────┬─────────┐
    │ Redis   │Postgres │  CDN    │
    │ Cache   │Database │         │
    └─────────┴─────────┴─────────┘
```

**4. Deep Dive** (20-25 min)

**Interviewer**: "How do you generate the timeline?"

**You**: "Two approaches:

**Fan-out on Write (Push)**:
```
When user posts tweet:
1. Write to own timeline
2. Fan out to all followers' timelines

Pros: Fast reads (pre-computed)
Cons: Slow writes for celebrities (millions of followers)
```

**Fan-out on Read (Pull)**:
```
When user views timeline:
1. Fetch tweets from all followed users
2. Merge and sort

Pros: Fast writes
Cons: Slow reads
```

**Hybrid**:
```
Regular users: Fan-out on write
Celebrities: Fan-out on read

Timeline = Pre-computed + Real-time celebrity tweets
```

**Interviewer**: "How do you handle hotspots?"

**You**: "Strategies:
1. **Sharding**: Partition users by ID (user_id % 100)
2. **Read replicas**: Multiple DB replicas for reads
3. **Caching**: Cache hot tweets (last 24h)
4. **Rate limiting**: Limit requests per user
"

**5. Wrap Up** (5 min)

**Bottlenecks**:
```
You: "Potential bottlenecks:
     - Database (handle with sharding, replicas)
     - Single point of failure (load balancer)
     - Storage (use object storage like S3 for media)"
```

**Trade-offs**:
```
You: "Design choices:
     - Consistency vs Availability: Chose AP (eventual consistency)
     - Read vs Write optimization: Optimized for reads (read-heavy)
     - Cost vs Performance: Caching reduces DB load but increases cost"
```

---

## Domain-Specific Backend Questions

> **Purpose**: Backend roles require deep knowledge beyond algorithms. These questions test your understanding of production systems, distributed computing, databases, and real-world engineering challenges.

### Why Domain Knowledge Matters

- **Senior Roles**: L5+ expect expertise in distributed systems, databases, concurrency
- **System Design Link**: Coding and system design overlap in these areas
- **Day-to-Day Work**: These topics directly relate to backend engineering work
- **Differentiation**: Strong domain knowledge separates backend from general SWE

---

### 1. Concurrency & Multithreading

**What**: Managing multiple threads/goroutines executing simultaneously, sharing resources safely.

**Why Important**: Modern backends handle thousands of concurrent requests. Understanding concurrency is critical for performance and correctness.

#### A. Thread Safety & Synchronization

**Common Concurrency Problems**:

1. **Race Condition**: Multiple threads access shared data without synchronization
2. **Deadlock**: Threads wait for each other indefinitely
3. **Livelock**: Threads keep changing state without progress
4. **Starvation**: Thread never gets CPU time

**Python: Threading vs Asyncio**

```python
import threading
import time
from concurrent.futures import ThreadPoolExecutor
import asyncio

# Problem: Race condition
counter = 0

def increment_unsafe():
    global counter
    for _ in range(100000):
        counter += 1  # NOT atomic! Read-Modify-Write

# This will NOT give 200,000!
threads = [threading.Thread(target=increment_unsafe) for _ in range(2)]
for t in threads:
    t.start()
for t in threads:
    t.join()
print(f"Unsafe counter: {counter}")  # ~150,000 (varies)

# Solution 1: Lock
counter_safe = 0
lock = threading.Lock()

def increment_safe():
    global counter_safe
    for _ in range(100000):
        with lock:  # Acquire lock
            counter_safe += 1  # Critical section

threads = [threading.Thread(target=increment_safe) for _ in range(2)]
for t in threads:
    t.start()
for t in threads:
    t.join()
print(f"Safe counter: {counter_safe}")  # 200,000 ✓

# Solution 2: Atomic operations (using threading.local or queue)
from queue import Queue

def producer(queue, n):
    for i in range(n):
        queue.put(i)
        time.sleep(0.01)
    queue.put(None)  # Sentinel

def consumer(queue):
    while True:
        item = queue.get()
        if item is None:
            break
        print(f"Consumed: {item}")

q = Queue()
t1 = threading.Thread(target=producer, args=(q, 5))
t2 = threading.Thread(target=consumer, args=(q,))
t1.start()
t2.start()
t1.join()
t2.join()

# Python GIL (Global Interpreter Lock)
# - Only one thread executes Python bytecode at a time
# - CPU-bound tasks: Use multiprocessing, not threading
# - I/O-bound tasks: Threading or asyncio works fine

# AsyncIO for I/O-bound concurrency
async def fetch_data(url, delay):
    await asyncio.sleep(delay)  # Non-blocking sleep
    return f"Data from {url}"

async def main():
    # Run concurrently (not parallel - single thread!)
    results = await asyncio.gather(
        fetch_data("api1", 1),
        fetch_data("api2", 2),
        fetch_data("api3", 1.5)
    )
    print(results)

# asyncio.run(main())  # Total time: ~2s (not 4.5s)

# When to use what:
# - CPU-bound: multiprocessing
# - I/O-bound: asyncio (modern) or threading (legacy)
# - Mixing: ProcessPoolExecutor + ThreadPoolExecutor
```

**Go: Goroutines & Channels**

```go
package main

import (
    "fmt"
    "sync"
    "time"
)

// Race condition example
var counter int

func incrementUnsafe() {
    for i := 0; i < 100000; i++ {
        counter++  // NOT atomic!
    }
}

// Solution 1: Mutex
var (
    counterSafe int
    mu          sync.Mutex
)

func incrementSafe() {
    for i := 0; i < 100000; i++ {
        mu.Lock()
        counterSafe++
        mu.Unlock()
    }
}

// Solution 2: Channels (idiomatic Go)
func incrementChannel(ch chan int) {
    for i := 0; i < 100000; i++ {
        ch <- 1
    }
    close(ch)
}

func counterGoroutine(ch chan int, done chan bool) {
    count := 0
    for inc := range ch {
        count += inc
    }
    fmt.Printf("Final count: %d\n", count)
    done <- true
}

func main() {
    // Unsafe version
    counter = 0
    var wg sync.WaitGroup
    wg.Add(2)
    go func() {
        incrementUnsafe()
        wg.Done()
    }()
    go func() {
        incrementUnsafe()
        wg.Done()
    }()
    wg.Wait()
    fmt.Printf("Unsafe counter: %d\n", counter)  // ~150,000
    
    // Safe with mutex
    counterSafe = 0
    wg.Add(2)
    go func() {
        incrementSafe()
        wg.Done()
    }()
    go func() {
        incrementSafe()
        wg.Done()
    }()
    wg.Wait()
    fmt.Printf("Safe counter: %d\n", counterSafe)  // 200,000
    
    // Channels (idiomatic Go)
    ch := make(chan int, 100)  // Buffered channel
    done := make(chan bool)
    
    go counterGoroutine(ch, done)
    go incrementChannel(ch)
    go incrementChannel(ch)
    
    <-done  // Wait for completion
}

// Deadlock example
func deadlockExample() {
    ch := make(chan int)
    ch <- 1  // Blocks forever! No receiver
    // Solution: Use goroutine or buffered channel
}

// Select statement (multiplexing)
func selectExample() {
    ch1 := make(chan string)
    ch2 := make(chan string)
    
    go func() {
        time.Sleep(1 * time.Second)
        ch1 <- "from ch1"
    }()
    
    go func() {
        time.Sleep(2 * time.Second)
        ch2 <- "from ch2"
    }()
    
    // Wait for first response
    select {
    case msg1 := <-ch1:
        fmt.Println(msg1)
    case msg2 := <-ch2:
        fmt.Println(msg2)
    case <-time.After(3 * time.Second):
        fmt.Println("timeout")
    }
}
```

**Interview Questions on Concurrency**:

1. **Implement thread-safe LRU cache**
```python
from collections import OrderedDict
import threading

class LRUCache:
    def __init__(self, capacity):
        self.cache = OrderedDict()
        self.capacity = capacity
        self.lock = threading.Lock()
    
    def get(self, key):
        with self.lock:
            if key not in self.cache:
                return -1
            self.cache.move_to_end(key)  # Mark as recently used
            return self.cache[key]
    
    def put(self, key, value):
        with self.lock:
            if key in self.cache:
                self.cache.move_to_end(key)
            self.cache[key] = value
            if len(self.cache) > self.capacity:
                self.cache.popitem(last=False)  # Remove oldest
```

2. **Rate Limiter (Token Bucket)**
```go
package main

import (
    "sync"
    "time"
)

type RateLimiter struct {
    tokens     int
    maxTokens  int
    refillRate int  // tokens per second
    lastRefill time.Time
    mu         sync.Mutex
}

func NewRateLimiter(maxTokens, refillRate int) *RateLimiter {
    return &RateLimiter{
        tokens:     maxTokens,
        maxTokens:  maxTokens,
        refillRate: refillRate,
        lastRefill: time.Now(),
    }
}

func (rl *RateLimiter) Allow() bool {
    rl.mu.Lock()
    defer rl.mu.Unlock()
    
    // Refill tokens based on time elapsed
    now := time.Now()
    elapsed := now.Sub(rl.lastRefill).Seconds()
    tokensToAdd := int(elapsed * float64(rl.refillRate))
    
    rl.tokens = min(rl.maxTokens, rl.tokens+tokensToAdd)
    rl.lastRefill = now
    
    if rl.tokens > 0 {
        rl.tokens--
        return true
    }
    return false
}

func min(a, b int) int {
    if a < b {
        return a
    }
    return b
}
```

**When to Use**:
- ✅ High-traffic web servers
- ✅ Real-time systems (chat, gaming)
- ✅ Data processing pipelines
- ❌ Simple CRUD apps
- ❌ Scripts/batch jobs

---

### 2. Distributed Systems Fundamentals

**What**: Systems where components run on different machines, communicating over network.

**Key Challenges**:
- **Partial Failures**: Some nodes fail while others work
- **Network Delays**: Messages can be delayed or lost
- **No Global Clock**: Hard to order events across machines
- **Consistency vs Availability**: CAP theorem trade-offs

#### A. CAP Theorem

**What**: In distributed system, you can have at most 2 of 3:
- **C**onsistency: All nodes see same data
- **A**vailability: Every request gets response
- **P**artition Tolerance: System works despite network splits

**Real-World Examples**:

| System | Choice | Trade-off |
|--------|--------|-----------|
| PostgreSQL (single-node) | CA | No partition tolerance |
| Cassandra | AP | Eventual consistency |
| MongoDB | CP | May reject writes during partition |
| DynamoDB | AP (tunable) | Eventually consistent by default |

**Interview Problem: Implement Distributed Counter**

```python
# Naive approach (CP - Consistent but not Available during partition)
class DistributedCounter:
    def __init__(self, nodes):
        self.nodes = nodes  # List of node IPs
        self.value = 0
    
    def increment(self):
        # Two-phase commit
        # Phase 1: Prepare
        for node in self.nodes:
            response = self.send_prepare(node)
            if not response.ok:
                self.abort()
                raise Exception("Node failed")
        
        # Phase 2: Commit
        self.value += 1
        for node in self.nodes:
            self.send_commit(node, self.value)
        
        return self.value

# Better approach (AP - Available but Eventually Consistent)
class EventualCounter:
    """
    CRDT (Conflict-Free Replicated Data Type) - G-Counter
    Each node has own counter, sum gives total
    """
    def __init__(self, node_id, num_nodes):
        self.node_id = node_id
        self.counters = [0] * num_nodes  # counters[i] = count from node i
    
    def increment(self):
        self.counters[self.node_id] += 1
    
    def value(self):
        return sum(self.counters)
    
    def merge(self, other):
        """Merge state from another node."""
        for i in range(len(self.counters)):
            self.counters[i] = max(self.counters[i], other.counters[i])
    
    # Guarantees:
    # - No coordination needed for increments
    # - Commutative: merge(A, B) = merge(B, A)
    # - Idempotent: merge(A, A) = A
    # - Monotonic: Value only increases
```

#### B. Consensus Algorithms (Raft/Paxos)

**What**: Protocols for multiple nodes to agree on value despite failures.

**When to Use**:
- Distributed databases (etcd, Consul)
- Leader election
- Configuration management

**Simplified Raft Explanation**:

```python
from enum import Enum
from dataclasses import dataclass
from typing import List
import random
import time

class NodeState(Enum):
    FOLLOWER = 1
    CANDIDATE = 2
    LEADER = 3

@dataclass
class LogEntry:
    term: int
    command: str

class RaftNode:
    """
    Simplified Raft implementation (conceptual).
    
    Key ideas:
    1. Leader Election: Nodes elect one leader using voting
    2. Log Replication: Leader replicates log to followers
    3. Safety: Committed entries never lost
    """
    
    def __init__(self, node_id, peers):
        self.node_id = node_id
        self.peers = peers  # Other node IDs
        
        # Persistent state
        self.current_term = 0
        self.voted_for = None
        self.log = []  # List of LogEntry
        
        # Volatile state
        self.state = NodeState.FOLLOWER
        self.leader_id = None
        
        # Timing
        self.election_timeout = random.uniform(150, 300)  # ms
        self.last_heartbeat = time.time()
    
    def start_election(self):
        """Transition to candidate and request votes."""
        self.state = NodeState.CANDIDATE
        self.current_term += 1
        self.voted_for = self.node_id
        votes_received = 1
        
        for peer in self.peers:
            # Send RequestVote RPC
            response = self.request_vote(peer, self.current_term, len(self.log))
            if response.vote_granted:
                votes_received += 1
        
        # Majority?
        if votes_received > len(self.peers) / 2:
            self.become_leader()
    
    def become_leader(self):
        """Transition to leader and start sending heartbeats."""
        self.state = NodeState.LEADER
        self.leader_id = self.node_id
        
        # Send heartbeats to all followers
        for peer in self.peers:
            self.send_append_entries(peer)
    
    def append_entry(self, command):
        """Leader appends entry to log and replicates."""
        if self.state != NodeState.LEADER:
            raise Exception("Not leader")
        
        entry = LogEntry(self.current_term, command)
        self.log.append(entry)
        
        # Replicate to majority
        acks = 1
        for peer in self.peers:
            if self.replicate_entry(peer, entry):
                acks += 1
        
        if acks > len(self.peers) / 2:
            # Committed!
            return True
        return False
    
    def request_vote(self, peer, term, log_length):
        """RPC: Request vote from peer."""
        # In real impl, send over network
        pass
    
    def send_append_entries(self, peer):
        """RPC: Send log entries to peer (heartbeat if empty)."""
        pass
    
    def replicate_entry(self, peer, entry):
        """Replicate entry to peer."""
        pass

# Real-world usage:
# - etcd: Uses Raft for distributed key-value store (Kubernetes uses etcd)
# - Consul: Uses Raft for service discovery
# - CockroachDB: Uses Raft for replication
```

**Open Source Implementations**:
- **etcd**: Go-based Raft implementation
- **HashiCorp Raft**: Go library
- **PySyncObj**: Python Raft library

#### C. Distributed Transactions

**Problem**: How to commit transaction across multiple databases atomically?

**Two-Phase Commit (2PC)**:

```python
class TwoPhaseCommit:
    """
    Coordinator ensures atomic commit across multiple participants.
    
    Phase 1 (Prepare):
        Coordinator -> Participants: "Can you commit?"
        Participants -> Coordinator: "Yes" or "No"
    
    Phase 2 (Commit/Abort):
        If all "Yes": Coordinator -> Participants: "Commit"
        If any "No": Coordinator -> Participants: "Abort"
    
    Problems:
    - Blocking: If coordinator crashes after prepare, participants blocked
    - Not fault-tolerant
    """
    
    def __init__(self, participants):
        self.participants = participants  # List of DBs
    
    def execute_transaction(self, operations):
        # Phase 1: Prepare
        for db in self.participants:
            response = db.prepare(operations[db])
            if not response.can_commit:
                # Abort
                for db2 in self.participants:
                    db2.abort()
                return False
        
        # Phase 2: Commit
        for db in self.participants:
            db.commit()
        
        return True

# Modern alternative: Saga Pattern
class SagaPattern:
    """
    Instead of 2PC, use compensating transactions.
    
    Example: E-commerce order
    1. Reserve inventory
    2. Charge payment
    3. Create shipment
    
    If step 3 fails:
    - Compensate step 2: Refund payment
    - Compensate step 1: Release inventory
    """
    
    def __init__(self):
        self.steps = []
        self.compensations = []
    
    def add_step(self, action, compensation):
        self.steps.append(action)
        self.compensations.append(compensation)
    
    def execute(self):
        completed = []
        try:
            for step in self.steps:
                step()
                completed.append(step)
        except Exception as e:
            # Compensate in reverse order
            for i in range(len(completed) - 1, -1, -1):
                self.compensations[i]()
            raise e

# Usage
saga = SagaPattern()
saga.add_step(
    action=lambda: inventory_service.reserve(item_id, qty),
    compensation=lambda: inventory_service.release(item_id, qty)
)
saga.add_step(
    action=lambda: payment_service.charge(user_id, amount),
    compensation=lambda: payment_service.refund(user_id, amount)
)
saga.execute()
```

---

### 3. Database Internals

#### A. B-Tree vs LSM-Tree

**What**: Two fundamental data structures for databases.

**B-Tree** (used by PostgreSQL, MySQL InnoDB):
- Read-optimized
- In-place updates
- Better for random reads

**LSM-Tree** (Log-Structured Merge Tree - used by Cassandra, RocksDB, LevelDB):
- Write-optimized
- Append-only writes
- Better for write-heavy workloads

```python
# Simplified LSM-Tree concept
class LSMTree:
    """
    LSM-Tree maintains multiple levels of sorted files.
    
    Write path:
    1. Write to MemTable (in-memory sorted tree)
    2. When full, flush to L0 SSTable (sorted string table)
    3. Periodically compact SSTables
    
    Read path:
    1. Check MemTable
    2. Check SSTables from newest to oldest
    3. Merge results
    """
    
    def __init__(self, memtable_size=1000):
        self.memtable = {}  # In-memory writes
        self.sstables = []  # Sorted immutable files
        self.memtable_size = memtable_size
    
    def put(self, key, value):
        self.memtable[key] = value
        
        if len(self.memtable) >= self.memtable_size:
            self.flush_memtable()
    
    def flush_memtable(self):
        """Write memtable to disk as SSTable."""
        sstable = sorted(self.memtable.items())
        self.sstables.append(sstable)
        self.memtable = {}
        
        # Trigger compaction if needed
        if len(self.sstables) > 4:
            self.compact()
    
    def get(self, key):
        # Check memtable first
        if key in self.memtable:
            return self.memtable[key]
        
        # Check SSTables from newest to oldest
        for sstable in reversed(self.sstables):
            # Binary search in sorted SSTable
            idx = self.binary_search(sstable, key)
            if idx != -1:
                return sstable[idx][1]
        
        return None
    
    def compact(self):
        """Merge multiple SSTables into one."""
        # Merge sort all SSTables
        merged = {}
        for sstable in self.sstables:
            for key, value in sstable:
                merged[key] = value  # Newer values overwrite
        
        self.sstables = [sorted(merged.items())]
    
    def binary_search(self, sstable, key):
        left, right = 0, len(sstable) - 1
        while left <= right:
            mid = (left + right) // 2
            if sstable[mid][0] == key:
                return mid
            elif sstable[mid][0] < key:
                left = mid + 1
            else:
                right = mid - 1
        return -1

# Real implementations:
# - RocksDB (Facebook): C++ LSM-Tree library
# - LevelDB (Google): Original LSM-Tree implementation
# - Cassandra: Uses LSM-Tree internally
```

**When to Use**:
- **B-Tree**: Read-heavy, random access (PostgreSQL, MySQL)
- **LSM-Tree**: Write-heavy, sequential access (time-series, logs, analytics)

#### B. MVCC (Multi-Version Concurrency Control)

**What**: How databases handle concurrent transactions without locking.

**How It Works**:
- Each transaction sees snapshot of database at start time
- Writes create new versions (don't modify in-place)
- Old versions kept until no longer needed

```python
class MVCCDatabase:
    """
    Simplified MVCC implementation.
    
    Each row has multiple versions with timestamps.
    Transactions read version visible at their start time.
    """
    
    def __init__(self):
        self.data = {}  # key -> [(version, value, xmin, xmax)]
        self.current_version = 0
    
    def begin_transaction(self):
        self.current_version += 1
        return self.current_version
    
    def read(self, transaction_id, key):
        """Read version visible to transaction."""
        if key not in self.data:
            return None
        
        for version, value, xmin, xmax in reversed(self.data[key]):
            # Version visible if:
            # - Created before transaction (xmin <= transaction_id)
            # - Not deleted before transaction (xmax > transaction_id)
            if xmin <= transaction_id < xmax:
                return value
        
        return None
    
    def write(self, transaction_id, key, value):
        """Create new version."""
        if key not in self.data:
            self.data[key] = []
        
        # New version visible from this transaction onward
        self.data[key].append((
            transaction_id,  # version
            value,
            transaction_id,  # xmin (created by)
            float('inf')     # xmax (deleted by - not deleted yet)
        ))
    
    def commit(self, transaction_id):
        """Make changes visible."""
        pass  # Changes already visible via timestamps
    
    def vacuum(self):
        """Remove old versions no longer needed."""
        min_active_transaction = min(self.get_active_transactions())
        
        for key in self.data:
            self.data[key] = [
                v for v in self.data[key]
                if v[3] > min_active_transaction  # xmax > min active
            ]

# Example
db = MVCCDatabase()
tx1 = db.begin_transaction()  # version 1
db.write(tx1, 'x', 100)

tx2 = db.begin_transaction()  # version 2
print(db.read(tx2, 'x'))  # 100 (sees tx1's write)
db.write(tx2, 'x', 200)

tx3 = db.begin_transaction()  # version 3
print(db.read(tx3, 'x'))  # 200 (sees tx2's write)
print(db.read(tx1, 'x'))  # 100 (still sees snapshot)
```

**Real Implementations**:
- PostgreSQL: MVCC with VACUUM
- MySQL InnoDB: MVCC with rollback segments
- Oracle: MVCC with undo logs

---

### 4. Caching Strategies

**What**: Store frequently accessed data in fast storage (RAM) to reduce latency.

**Cache Levels**:
1. **Client-side**: Browser cache, mobile app cache
2. **CDN**: Geographic distribution (CloudFront, Cloudflare)
3. **Application**: In-process cache (local memory)
4. **Distributed**: Redis, Memcached
5. **Database**: Query result cache, page cache

#### Cache Invalidation Strategies

```python
from datetime import datetime, timedelta
import hashlib

class CacheStrategies:
    """Different cache invalidation strategies."""
    
    # 1. TTL (Time To Live)
    def ttl_cache(self, cache, key, ttl_seconds):
        """
        Pros: Simple, prevents stale data
        Cons: May evict hot data, clock synchronization issues
        """
        entry = cache.get(key)
        if entry:
            value, timestamp = entry
            if datetime.now() - timestamp < timedelta(seconds=ttl_seconds):
                return value
        
        # Cache miss - fetch from DB
        value = self.fetch_from_db(key)
        cache[key] = (value, datetime.now())
        return value
    
    # 2. Cache-Aside (Lazy Loading)
    def cache_aside(self, cache, key):
        """
        Application checks cache first, loads on miss.
        
        Pros: Only caches requested data
        Cons: Cache miss penalty, stampede risk
        """
        value = cache.get(key)
        if value is None:
            value = self.fetch_from_db(key)
            cache.set(key, value)
        return value
    
    # 3. Write-Through
    def write_through(self, cache, db, key, value):
        """
        Write to cache and DB synchronously.
        
        Pros: Cache always consistent
        Cons: Higher write latency
        """
        db.write(key, value)
        cache.set(key, value)
    
    # 4. Write-Behind (Write-Back)
    def write_behind(self, cache, queue, key, value):
        """
        Write to cache immediately, DB asynchronously.
        
        Pros: Fast writes
        Cons: Risk of data loss, complex
        """
        cache.set(key, value)
        queue.push({'key': key, 'value': value})
        # Background worker drains queue to DB
    
    # 5. Refresh-Ahead
    def refresh_ahead(self, cache, key, ttl_seconds):
        """
        Refresh cache before expiry if frequently accessed.
        
        Pros: Avoids cache miss penalty for hot data
        Cons: Wastes resources on cold data
        """
        entry = cache.get(key)
        if entry:
            value, timestamp, access_count = entry
            time_left = ttl_seconds - (datetime.now() - timestamp).seconds
            
            # If 25% TTL left and hot data, refresh
            if time_left < ttl_seconds * 0.25 and access_count > 10:
                value = self.fetch_from_db(key)
                cache[key] = (value, datetime.now(), 0)
            else:
                cache[key] = (value, timestamp, access_count + 1)
            
            return value
        
        value = self.fetch_from_db(key)
        cache[key] = (value, datetime.now(), 1)
        return value

# Cache Stampede Protection
import threading

class StampedeProtection:
    """
    Prevent thundering herd when cache expires.
    
    Problem: 1000 requests hit expired cache key simultaneously,
    all query DB -> DB overload
    
    Solution: First request gets lock, others wait
    """
    
    def __init__(self):
        self.locks = {}
        self.lock_for_locks = threading.Lock()
    
    def get_with_protection(self, cache, key):
        value = cache.get(key)
        if value is not None:
            return value
        
        # Get or create lock for this key
        with self.lock_for_locks:
            if key not in self.locks:
                self.locks[key] = threading.Lock()
            lock = self.locks[key]
        
        with lock:
            # Double-check cache (another thread may have filled it)
            value = cache.get(key)
            if value is not None:
                return value
            
            # Only this thread fetches from DB
            value = self.fetch_from_db(key)
            cache.set(key, value)
            return value
```

**Distributed Caching with Redis**:

```python
import redis
import json

class RedisCache:
    """Production-ready Redis caching patterns."""
    
    def __init__(self, host='localhost', port=6379):
        self.client = redis.Redis(host=host, port=port, decode_responses=True)
    
    def get_user(self, user_id):
        """Cache-aside pattern."""
        cache_key = f"user:{user_id}"
        
        # Try cache
        cached = self.client.get(cache_key)
        if cached:
            return json.loads(cached)
        
        # Cache miss - query DB
        user = self.db_get_user(user_id)
        
        # Store in cache with 1 hour TTL
        self.client.setex(
            cache_key,
            3600,  # TTL in seconds
            json.dumps(user)
        )
        
        return user
    
    def increment_view_count(self, post_id):
        """Atomic increment."""
        cache_key = f"post:{post_id}:views"
        return self.client.incr(cache_key)
    
    def get_leaderboard(self, limit=10):
        """Sorted sets for leaderboards."""
        # Add score: client.zadd("leaderboard", {"user1": 100, "user2": 200})
        # Get top N
        return self.client.zrevrange("leaderboard", 0, limit-1, withscores=True)
    
    def rate_limit(self, user_id, max_requests=100, window_seconds=60):
        """Sliding window rate limiting."""
        key = f"rate_limit:{user_id}"
        now = time.time()
        
        # Remove old entries outside window
        self.client.zremrangebyscore(key, 0, now - window_seconds)
        
        # Count requests in window
        count = self.client.zcard(key)
        
        if count < max_requests:
            # Add current request
            self.client.zadd(key, {str(now): now})
            self.client.expire(key, window_seconds)
            return True
        
        return False
    
    def distributed_lock(self, resource, timeout=10):
        """Distributed lock using SET NX EX."""
        lock_key = f"lock:{resource}"
        identifier = str(uuid.uuid4())
        
        # Acquire lock
        if self.client.set(lock_key, identifier, nx=True, ex=timeout):
            return identifier
        return None
    
    def release_lock(self, resource, identifier):
        """Release lock only if we own it."""
        lock_key = f"lock:{resource}"
        
        # Lua script for atomic check-and-delete
        script = """
        if redis.call("get", KEYS[1]) == ARGV[1] then
            return redis.call("del", KEYS[1])
        else
            return 0
        end
        """
        
        return self.client.eval(script, 1, lock_key, identifier)
```

---

### 5. Message Queues & Event-Driven Architecture

**What**: Asynchronous communication between services using messages.

**When to Use**:
- ✅ Decouple services
- ✅ Handle traffic spikes (buffer)
- ✅ Background processing
- ✅ Event sourcing

**Message Queue vs Pub/Sub**:

| Feature | Message Queue (SQS, RabbitMQ) | Pub/Sub (Kafka, SNS) |
|---------|-------------------------------|----------------------|
| Consumption | One consumer per message | Multiple subscribers |
| Ordering | FIFO (optional) | Partition-level ordering |
| Persistence | Until processed | Retained for time period |
| Use Case | Task distribution | Event broadcasting |

**Python with RabbitMQ**:

```python
import pika
import json

class RabbitMQProducer:
    def __init__(self, host='localhost'):
        self.connection = pika.BlockingConnection(
            pika.ConnectionParameters(host=host)
        )
        self.channel = self.connection.channel()
    
    def send_task(self, queue_name, task):
        """Send task to queue."""
        self.channel.queue_declare(queue=queue_name, durable=True)
        
        self.channel.basic_publish(
            exchange='',
            routing_key=queue_name,
            body=json.dumps(task),
            properties=pika.BasicProperties(
                delivery_mode=2,  # Make message persistent
            )
        )
    
    def close(self):
        self.connection.close()

class RabbitMQConsumer:
    def __init__(self, host='localhost'):
        self.connection = pika.BlockingConnection(
            pika.ConnectionParameters(host=host)
        )
        self.channel = self.connection.channel()
    
    def process_tasks(self, queue_name, callback):
        """Process tasks from queue."""
        self.channel.queue_declare(queue=queue_name, durable=True)
        self.channel.basic_qos(prefetch_count=1)  # Process one at a time
        
        def on_message(ch, method, properties, body):
            task = json.loads(body)
            print(f"Processing: {task}")
            
            try:
                callback(task)
                ch.basic_ack(delivery_tag=method.delivery_tag)  # ACK
            except Exception as e:
                print(f"Error: {e}")
                ch.basic_nack(delivery_tag=method.delivery_tag, requeue=True)
        
        self.channel.basic_consume(
            queue=queue_name,
            on_message_callback=on_message
        )
        
        print("Waiting for messages...")
        self.channel.start_consuming()

# Usage
producer = RabbitMQProducer()
producer.send_task('email_queue', {
    'to': 'user@example.com',
    'subject': 'Welcome',
    'body': 'Hello!'
})

consumer = RabbitMQConsumer()
consumer.process_tasks('email_queue', send_email)
```

**Go with Kafka**:

```go
package main

import (
    "context"
    "fmt"
    "github.com/segmentio/kafka-go"
)

// Producer
func produceMessages(topic string) {
    writer := kafka.NewWriter(kafka.WriterConfig{
        Brokers: []string{"localhost:9092"},
        Topic:   topic,
        Balancer: &kafka.LeastBytes{},
    })
    defer writer.Close()
    
    err := writer.WriteMessages(context.Background(),
        kafka.Message{
            Key:   []byte("order-123"),
            Value: []byte(`{"item": "laptop", "qty": 1}`),
        },
    )
    if err != nil {
        panic(err)
    }
}

// Consumer with consumer group
func consumeMessages(topic, groupID string) {
    reader := kafka.NewReader(kafka.ReaderConfig{
        Brokers: []string{"localhost:9092"},
        Topic:   topic,
        GroupID: groupID,  // Consumer group
        MinBytes: 10e3,  // 10KB
        MaxBytes: 10e6,  // 10MB
    })
    defer reader.Close()
    
    for {
        msg, err := reader.ReadMessage(context.Background())
        if err != nil {
            break
        }
        
        fmt.Printf("Message: %s = %s\n", msg.Key, msg.Value)
        
        // Kafka commits offset automatically
        // For manual commit: reader.CommitMessages(ctx, msg)
    }
}

// Exactly-once semantics with transactions
func exactlyOnceProducer(topic string) {
    writer := &kafka.Writer{
        Addr:     kafka.TCP("localhost:9092"),
        Topic:    topic,
        Balancer: &kafka.LeastBytes{},
        // Enable idempotent producer
        RequiredAcks: kafka.RequireAll,
        Idempotent:   true,
    }
    defer writer.Close()
    
    // Transaction
    txn := writer.BeginTransaction()
    txn.WriteMessages(
        kafka.Message{Value: []byte("message 1")},
        kafka.Message{Value: []byte("message 2")},
    )
    txn.Commit()  // Atomic commit
}
```

**Interview Questions**:

1. **How to ensure message delivery?**
   - At-most-once: Fire and forget
   - At-least-once: Retry with ACKs (may duplicate)
   - Exactly-once: Idempotent operations + deduplication

2. **How to handle message ordering?**
   - Single consumer
   - Partition by key (Kafka)
   - FIFO queues (SQS)

3. **How to handle poison messages?**
   - Dead letter queue (DLQ)
   - Retry with exponential backoff
   - Manual intervention

---

### Domain-Specific Backend Questions - Summary

**Interview Frequency by Topic**:

| Topic | Junior (L3-L4) | Senior (L5+) | Staff+ (L6+) |
|-------|----------------|--------------|--------------|
| Concurrency basics | Medium | High | High |
| Distributed systems | Low | High | Very High |
| Database internals | Low | Medium | High |
| Caching | High | High | Medium |
| Message queues | Medium | High | High |

**Study Resources**:
- **Books**: "Designing Data-Intensive Applications" (Kleppmann)
- **Courses**: MIT 6.824 Distributed Systems
- **Practice**: Build chat app, URL shortener, distributed cache

**Common Interview Patterns**:
1. "Design a rate limiter" → Concurrency + caching
2. "How does database handle concurrent updates?" → MVCC, locking
3. "Explain eventual consistency" → CAP theorem, distributed systems
4. "How to process 1M events/sec?" → Message queues, partitioning

---

## Behavioral Interview Preparation

### Amazon Leadership Principles

**Must-Know Principles**:
```
1. Customer Obsession
2. Ownership
3. Invent and Simplify
4. Are Right, A Lot
5. Learn and Be Curious
6. Hire and Develop the Best
7. Insist on the Highest Standards
8. Think Big
9. Bias for Action
10. Deliver Results
```

### STAR Method

**Format**:
```
Situation: Context, background
Task: Your responsibility
Action: What you did (detailed!)
Result: Outcome, metrics
```

**Example**:
```
Question: "Tell me about a time you had a conflict with a teammate"

Situation:
"In my previous role, I was leading the backend for a payment system.
My teammate wanted to use MongoDB, but I believed PostgreSQL was better
for our transaction-heavy workload."

Task:
"As tech lead, I needed to make the final decision while keeping the
team aligned."

Action:
"I organized a technical discussion where we each presented pros/cons.
I created a comparison doc: consistency, ACID, query performance.
We ran benchmarks - PostgreSQL handled 10K TPS vs MongoDB's 3K TPS.
I acknowledged MongoDB's strengths (schema flexibility) but our use
case needed strong consistency."

Result:
"Team agreed on PostgreSQL. System handled peak of 50K TPS with zero
data inconsistencies. Teammate appreciated the data-driven approach
and we maintained a strong working relationship."
```

### Common Behavioral Questions

**Leadership**:
```
- Tell me about a time you led a project
- Describe a situation where you had to convince someone
- Tell me about a time you disagreed with your manager
```

**Problem-Solving**:
```
- Describe your most challenging technical problem
- Tell me about a time you made a mistake
- How do you handle ambiguity?
```

**Teamwork**:
```
- Tell me about a time you helped a struggling teammate
- Describe a conflict with a coworker
- Tell me about a time you received critical feedback
```

---

## Object-Oriented Design (OOD)

> **Purpose**: Test your ability to model real-world systems using OOP principles. Common in senior/staff interviews at Amazon, Microsoft, Apple.

### Why OOD Matters

- **Real Work**: Backend services are object-oriented (classes, interfaces, inheritance)
- **Design Skills**: Shows ability to decompose complex problems
- **Communication**: Requires discussing trade-offs and design choices
- **Code Quality**: Tests understanding of SOLID, design patterns

**Interview Format** (45-60 min):
1. **Requirements** (5-10 min): Clarify scope, assumptions
2. **Core Objects** (10-15 min): Identify classes, relationships
3. **API Design** (10-15 min): Define interfaces, methods
4. **Deep Dive** (15-20 min): Implement key methods, discuss patterns
5. **Follow-ups** (5-10 min): Scale, edge cases, extensions

---

### SOLID Principles

**S - Single Responsibility Principle**
*Each class should have one reason to change.*

```python
# ❌ Bad: Class does too much
class User:
    def __init__(self, name, email):
        self.name = name
        self.email = email
    
    def save_to_db(self):
        # Database logic
        pass
    
    def send_email(self, message):
        # Email logic
        pass

# ✅ Good: Separate responsibilities
class User:
    def __init__(self, name, email):
        self.name = name
        self.email = email

class UserRepository:
    def save(self, user):
        # Database logic
        pass

class EmailService:
    def send(self, to, message):
        # Email logic
        pass
```

**O - Open/Closed Principle**
*Open for extension, closed for modification.*

```python
# ❌ Bad: Must modify class to add payment methods
class PaymentProcessor:
    def process(self, method, amount):
        if method == "credit_card":
            # Process credit card
            pass
        elif method == "paypal":
            # Process PayPal
            pass
        # Adding new method requires modifying this code!

# ✅ Good: Use polymorphism
from abc import ABC, abstractmethod

class PaymentMethod(ABC):
    @abstractmethod
    def process(self, amount):
        pass

class CreditCardPayment(PaymentMethod):
    def process(self, amount):
        # Process credit card
        pass

class PayPalPayment(PaymentMethod):
    def process(self, amount):
        # Process PayPal
        pass

class PaymentProcessor:
    def process(self, payment_method: PaymentMethod, amount):
        payment_method.process(amount)
```

**L - Liskov Substitution Principle**
*Subtypes must be substitutable for their base types.*

```python
# ❌ Bad: Square violates LSP
class Rectangle:
    def __init__(self, width, height):
        self.width = width
        self.height = height
    
    def set_width(self, width):
        self.width = width
    
    def set_height(self, height):
        self.height = height

class Square(Rectangle):
    def set_width(self, width):
        self.width = width
        self.height = width  # Violates LSP!

# Problem:
rect = Rectangle(2, 3)
rect.set_width(5)
assert rect.width * rect.height == 15  # Works

square = Square(2, 2)
square.set_width(5)
assert square.width * square.height == 25  # But 25 != expected behavior!

# ✅ Good: Use composition
class Shape(ABC):
    @abstractmethod
    def area(self):
        pass

class Rectangle(Shape):
    def __init__(self, width, height):
        self.width = width
        self.height = height
    
    def area(self):
        return self.width * self.height

class Square(Shape):
    def __init__(self, side):
        self.side = side
    
    def area(self):
        return self.side ** 2
```

**I - Interface Segregation Principle**
*Clients shouldn't depend on interfaces they don't use.*

```python
# ❌ Bad: Fat interface
class Worker(ABC):
    @abstractmethod
    def work(self):
        pass
    
    @abstractmethod
    def eat(self):
        pass

class Human(Worker):
    def work(self):
        print("Working")
    
    def eat(self):
        print("Eating")

class Robot(Worker):
    def work(self):
        print("Working")
    
    def eat(self):
        raise NotImplementedError("Robots don't eat!")  # Forced to implement!

# ✅ Good: Split interfaces
class Workable(ABC):
    @abstractmethod
    def work(self):
        pass

class Eatable(ABC):
    @abstractmethod
    def eat(self):
        pass

class Human(Workable, Eatable):
    def work(self):
        print("Working")
    
    def eat(self):
        print("Eating")

class Robot(Workable):
    def work(self):
        print("Working")
```

**D - Dependency Inversion Principle**
*Depend on abstractions, not concretions.*

```python
# ❌ Bad: High-level module depends on low-level
class MySQLDatabase:
    def save(self, data):
        # MySQL-specific code
        pass

class UserService:
    def __init__(self):
        self.db = MySQLDatabase()  # Tightly coupled!
    
    def create_user(self, user):
        self.db.save(user)

# ✅ Good: Depend on abstraction
class Database(ABC):
    @abstractmethod
    def save(self, data):
        pass

class MySQLDatabase(Database):
    def save(self, data):
        # MySQL implementation
        pass

class PostgreSQLDatabase(Database):
    def save(self, data):
        # PostgreSQL implementation
        pass

class UserService:
    def __init__(self, db: Database):
        self.db = db  # Loosely coupled!
    
    def create_user(self, user):
        self.db.save(user)

# Dependency injection
db = PostgreSQLDatabase()
service = UserService(db)
```

---

### Common Design Patterns

#### 1. Singleton (Creational)

**When**: Need exactly one instance (database connection, logger, config).

```python
class Singleton:
    _instance = None
    _lock = threading.Lock()
    
    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
        return cls._instance

# Thread-safe singleton
class Database(Singleton):
    def __init__(self):
        if not hasattr(self, 'initialized'):
            self.connection = self._create_connection()
            self.initialized = True

# Go implementation
package main

import "sync"

type Database struct {
    connection string
}

var (
    instance *Database
    once     sync.Once
)

func GetInstance() *Database {
    once.Do(func() {
        instance = &Database{connection: "connected"}
    })
    return instance
}
```

**Pros**: Single global access point, lazy initialization
**Cons**: Global state, hard to test, violates SRP

#### 2. Factory (Creational)

**When**: Object creation logic is complex or needs to be centralized.

```python
class Animal(ABC):
    @abstractmethod
    def speak(self):
        pass

class Dog(Animal):
    def speak(self):
        return "Woof!"

class Cat(Animal):
    def speak(self):
        return "Meow!"

class AnimalFactory:
    @staticmethod
    def create_animal(animal_type: str) -> Animal:
        if animal_type == "dog":
            return Dog()
        elif animal_type == "cat":
            return Cat()
        else:
            raise ValueError(f"Unknown animal: {animal_type}")

# Usage
factory = AnimalFactory()
pet = factory.create_animal("dog")
print(pet.speak())  # "Woof!"
```

#### 3. Observer (Behavioral)

**When**: One-to-many dependency (event-driven systems).

```python
from typing import List

class Observer(ABC):
    @abstractmethod
    def update(self, subject):
        pass

class Subject:
    def __init__(self):
        self._observers: List[Observer] = []
        self._state = None
    
    def attach(self, observer: Observer):
        self._observers.append(observer)
    
    def detach(self, observer: Observer):
        self._observers.remove(observer)
    
    def notify(self):
        for observer in self._observers:
            observer.update(self)
    
    def set_state(self, state):
        self._state = state
        self.notify()
    
    def get_state(self):
        return self._state

class ConcreteObserver(Observer):
    def update(self, subject):
        print(f"Observer notified! New state: {subject.get_state()}")

# Usage
subject = Subject()
observer1 = ConcreteObserver()
observer2 = ConcreteObserver()

subject.attach(observer1)
subject.attach(observer2)
subject.set_state("Active")  # Both observers notified
```

```go
// Go implementation
package main

type Observer interface {
    Update(subject *Subject)
}

type Subject struct {
    observers []Observer
    state     string
}

func (s *Subject) Attach(o Observer) {
    s.observers = append(s.observers, o)
}

func (s *Subject) Notify() {
    for _, observer := range s.observers {
        observer.Update(s)
    }
}

func (s *Subject) SetState(state string) {
    s.state = state
    s.Notify()
}
```

#### 4. Strategy (Behavioral)

**When**: Multiple algorithms for same operation (payment methods, sorting).

```python
class SortStrategy(ABC):
    @abstractmethod
    def sort(self, data: List[int]) -> List[int]:
        pass

class QuickSort(SortStrategy):
    def sort(self, data: List[int]) -> List[int]:
        # QuickSort implementation
        if len(data) <= 1:
            return data
        pivot = data[len(data) // 2]
        left = [x for x in data if x < pivot]
        middle = [x for x in data if x == pivot]
        right = [x for x in data if x > pivot]
        return self.sort(left) + middle + self.sort(right)

class MergeSort(SortStrategy):
    def sort(self, data: List[int]) -> List[int]:
        # MergeSort implementation
        if len(data) <= 1:
            return data
        mid = len(data) // 2
        left = self.sort(data[:mid])
        right = self.sort(data[mid:])
        return self._merge(left, right)
    
    def _merge(self, left, right):
        result = []
        i = j = 0
        while i < len(left) and j < len(right):
            if left[i] <= right[j]:
                result.append(left[i])
                i += 1
            else:
                result.append(right[j])
                j += 1
        result.extend(left[i:])
        result.extend(right[j:])
        return result

class Sorter:
    def __init__(self, strategy: SortStrategy):
        self.strategy = strategy
    
    def sort(self, data: List[int]) -> List[int]:
        return self.strategy.sort(data)

# Usage
data = [3, 1, 4, 1, 5, 9, 2, 6]
sorter = Sorter(QuickSort())
print(sorter.sort(data))

sorter = Sorter(MergeSort())
print(sorter.sort(data))
```

---

### Classic OOD Problems

#### Problem 1: Parking Lot System

**Requirements**:
- Multiple floors, spots per floor
- Different vehicle types (car, truck, motorcycle)
- Track availability, assign spots
- Calculate fees

```python
from enum import Enum
from datetime import datetime
from typing import Optional

class VehicleType(Enum):
    MOTORCYCLE = 1
    CAR = 2
    TRUCK = 3

class SpotType(Enum):
    SMALL = 1   # Motorcycle
    COMPACT = 2 # Car
    LARGE = 3   # Truck

class Vehicle:
    def __init__(self, vehicle_type: VehicleType, license_plate: str):
        self.vehicle_type = vehicle_type
        self.license_plate = license_plate

class ParkingSpot:
    def __init__(self, spot_id: int, spot_type: SpotType):
        self.spot_id = spot_id
        self.spot_type = spot_type
        self.vehicle: Optional[Vehicle] = None
        self.entry_time: Optional[datetime] = None
    
    def is_available(self) -> bool:
        return self.vehicle is None
    
    def can_fit(self, vehicle: Vehicle) -> bool:
        if self.vehicle_type == VehicleType.MOTORCYCLE:
            return self.spot_type in [SpotType.SMALL, SpotType.COMPACT, SpotType.LARGE]
        elif self.vehicle_type == VehicleType.CAR:
            return self.spot_type in [SpotType.COMPACT, SpotType.LARGE]
        elif self.vehicle_type == VehicleType.TRUCK:
            return self.spot_type == SpotType.LARGE
        return False
    
    def park(self, vehicle: Vehicle):
        self.vehicle = vehicle
        self.entry_time = datetime.now()
    
    def remove_vehicle(self):
        self.vehicle = None
        self.entry_time = None

class Floor:
    def __init__(self, floor_number: int):
        self.floor_number = floor_number
        self.spots: List[ParkingSpot] = []
    
    def add_spot(self, spot: ParkingSpot):
        self.spots.append(spot)
    
    def find_available_spot(self, vehicle: Vehicle) -> Optional[ParkingSpot]:
        for spot in self.spots:
            if spot.is_available() and spot.can_fit(vehicle):
                return spot
        return None

class ParkingLot:
    def __init__(self, name: str):
        self.name = name
        self.floors: List[Floor] = []
    
    def add_floor(self, floor: Floor):
        self.floors.append(floor)
    
    def park_vehicle(self, vehicle: Vehicle) -> Optional[ParkingSpot]:
        for floor in self.floors:
            spot = floor.find_available_spot(vehicle)
            if spot:
                spot.park(vehicle)
                print(f"Parked {vehicle.license_plate} at Floor {floor.floor_number}, Spot {spot.spot_id}")
                return spot
        print("No available spots")
        return None
    
    def remove_vehicle(self, spot: ParkingSpot) -> float:
        if not spot.vehicle:
            raise ValueError("Spot is empty")
        
        duration = (datetime.now() - spot.entry_time).seconds / 3600  # hours
        fee = self.calculate_fee(spot.vehicle, duration)
        spot.remove_vehicle()
        return fee
    
    def calculate_fee(self, vehicle: Vehicle, hours: float) -> float:
        rates = {
            VehicleType.MOTORCYCLE: 2.0,
            VehicleType.CAR: 5.0,
            VehicleType.TRUCK: 10.0
        }
        return rates[vehicle.vehicle_type] * hours

# Usage
parking_lot = ParkingLot("Mall Parking")

floor1 = Floor(1)
floor1.add_spot(ParkingSpot(1, SpotType.SMALL))
floor1.add_spot(ParkingSpot(2, SpotType.COMPACT))
floor1.add_spot(ParkingSpot(3, SpotType.LARGE))

parking_lot.add_floor(floor1)

car = Vehicle(VehicleType.CAR, "ABC123")
spot = parking_lot.park_vehicle(car)

# Later...
fee = parking_lot.remove_vehicle(spot)
print(f"Fee: ${fee:.2f}")
```

**Follow-up Questions**:
1. **How to handle concurrent requests?** → Add locks to spots
2. **How to reserve spots?** → Add reservation state
3. **How to optimize spot finding?** → Index by spot type
4. **How to handle hourly rates?** → Strategy pattern for pricing

---

#### Problem 2: Elevator System

**Requirements**:
- Multiple elevators, multiple floors
- Efficiently assign requests
- Handle up/down directions
- Emergency mode

```python
from enum import Enum
from typing import List, Set
import threading

class Direction(Enum):
    UP = 1
    DOWN = 2
    IDLE = 3

class Request:
    def __init__(self, floor: int, direction: Direction):
        self.floor = floor
        self.direction = direction

class Elevator:
    def __init__(self, elevator_id: int, max_floor: int):
        self.elevator_id = elevator_id
        self.current_floor = 0
        self.direction = Direction.IDLE
        self.stops: Set[int] = set()
        self.max_floor = max_floor
        self.lock = threading.Lock()
    
    def add_stop(self, floor: int):
        with self.lock:
            if 0 <= floor <= self.max_floor:
                self.stops.add(floor)
    
    def move(self):
        """Simulate one step of movement."""
        with self.lock:
            if not self.stops:
                self.direction = Direction.IDLE
                return
            
            if self.direction == Direction.UP:
                next_stops = [f for f in self.stops if f > self.current_floor]
                if next_stops:
                    self.current_floor += 1
                else:
                    # Change direction
                    self.direction = Direction.DOWN
            elif self.direction == Direction.DOWN:
                next_stops = [f for f in self.stops if f < self.current_floor]
                if next_stops:
                    self.current_floor -= 1
                else:
                    self.direction = Direction.UP
            else:
                # Start moving
                if self.stops:
                    target = min(self.stops)
                    self.direction = Direction.UP if target > self.current_floor else Direction.DOWN
            
            # Check if we arrived at a stop
            if self.current_floor in self.stops:
                self.stops.remove(self.current_floor)
                print(f"Elevator {self.elevator_id} arrived at floor {self.current_floor}")

class ElevatorSystem:
    def __init__(self, num_elevators: int, max_floor: int):
        self.elevators = [Elevator(i, max_floor) for i in range(num_elevators)]
        self.max_floor = max_floor
    
    def request_elevator(self, request: Request):
        """Assign best elevator to request."""
        best_elevator = self._find_best_elevator(request)
        best_elevator.add_stop(request.floor)
    
    def _find_best_elevator(self, request: Request) -> Elevator:
        """Find closest available elevator moving in same direction."""
        best = None
        min_distance = float('inf')
        
        for elevator in self.elevators:
            # Idle elevator
            if elevator.direction == Direction.IDLE:
                distance = abs(elevator.current_floor - request.floor)
                if distance < min_distance:
                    min_distance = distance
                    best = elevator
            
            # Moving in same direction and will pass request floor
            elif elevator.direction == request.direction:
                if request.direction == Direction.UP and elevator.current_floor <= request.floor:
                    distance = request.floor - elevator.current_floor
                    if distance < min_distance:
                        min_distance = distance
                        best = elevator
                elif request.direction == Direction.DOWN and elevator.current_floor >= request.floor:
                    distance = elevator.current_floor - request.floor
                    if distance < min_distance:
                        min_distance = distance
                        best = elevator
        
        # Default to first elevator if no better option
        return best if best else self.elevators[0]

# Usage
system = ElevatorSystem(num_elevators=3, max_floor=10)

# Person on floor 5 wants to go up
system.request_elevator(Request(5, Direction.UP))

# Simulate elevator movement
for _ in range(10):
    for elevator in system.elevators:
        elevator.move()
```

**Follow-up Questions**:
1. **Optimize for energy?** → Group requests, minimize movements
2. **Handle weight limits?** → Add max_weight property
3. **Emergency mode?** → Priority queue for emergency requests
4. **Distributed system?** → Central controller with heartbeats

---

#### Problem 3: Online Chat System (Like WhatsApp)

```go
package main

import (
    "sync"
    "time"
)

type MessageType int

const (
    TEXT MessageType = iota
    IMAGE
    VIDEO
)

type Message struct {
    ID        string
    From      *User
    Content   string
    Type      MessageType
    Timestamp time.Time
    Delivered bool
    Read      bool
}

type User struct {
    ID       string
    Name     string
    Status   string
    LastSeen time.Time
}

type Chat struct {
    ID           string
    Participants []*User
    Messages     []*Message
    mu           sync.RWMutex
}

func (c *Chat) SendMessage(from *User, content string, msgType MessageType) *Message {
    c.mu.Lock()
    defer c.mu.Unlock()
    
    msg := &Message{
        ID:        generateID(),
        From:      from,
        Content:   content,
        Type:      msgType,
        Timestamp: time.Now(),
        Delivered: false,
        Read:      false,
    }
    
    c.Messages = append(c.Messages, msg)
    
    // Notify other participants
    for _, user := range c.Participants {
        if user.ID != from.ID {
            notifyUser(user, msg)
        }
    }
    
    return msg
}

func (c *Chat) GetMessages(after time.Time) []*Message {
    c.mu.RLock()
    defer c.mu.RUnlock()
    
    var filtered []*Message
    for _, msg := range c.Messages {
        if msg.Timestamp.After(after) {
            filtered = append(filtered, msg)
        }
    }
    return filtered
}

func (c *Chat) MarkAsRead(user *User, messageID string) {
    c.mu.Lock()
    defer c.mu.Unlock()
    
    for _, msg := range c.Messages {
        if msg.ID == messageID && msg.From.ID != user.ID {
            msg.Read = true
        }
    }
}

type ChatService struct {
    chats map[string]*Chat
    users map[string]*User
    mu    sync.RWMutex
}

func NewChatService() *ChatService {
    return &ChatService{
        chats: make(map[string]*Chat),
        users: make(map[string]*User),
    }
}

func (cs *ChatService) CreateChat(participants []*User) *Chat {
    cs.mu.Lock()
    defer cs.mu.Unlock()
    
    chat := &Chat{
        ID:           generateID(),
        Participants: participants,
        Messages:     []*Message{},
    }
    
    cs.chats[chat.ID] = chat
    return chat
}

func (cs *ChatService) GetUserChats(userID string) []*Chat {
    cs.mu.RLock()
    defer cs.mu.RUnlock()
    
    var userChats []*Chat
    for _, chat := range cs.chats {
        for _, participant := range chat.Participants {
            if participant.ID == userID {
                userChats = append(userChats, chat)
                break
            }
        }
    }
    return userChats
}
```

**Discussion Points**:
1. **Scalability**: How to handle millions of users?
   - Shard by user ID
   - Message queue for async delivery
   - WebSocket for real-time
   - Read replicas for messages

2. **Reliability**: How to ensure messages delivered?
   - ACKs (sent, delivered, read)
   - Retry with exponential backoff
   - Local queue before sending

3. **Features**: Group chats, media, encryption
   - Group: Many-to-many relationship
   - Media: S3 storage, CDN delivery
   - Encryption: End-to-end (E2EE)

---

### OOD Interview Strategy

**Step 1: Clarify Requirements (5 min)**
```
Questions to ask:
- What are core features? (MVP vs nice-to-have)
- How many users/scale?
- Read-heavy or write-heavy?
- Any specific constraints?
```

**Step 2: Identify Objects (10 min)**
```
1. List nouns (User, Post, Comment → classes)
2. List verbs (create, delete, like → methods)
3. Find relationships (has-a, is-a)
4. Identify patterns (factory, observer, etc.)
```

**Step 3: Define Interfaces (10 min)**
```python
class User:
    def __init__(self, user_id, name): ...
    def create_post(self, content): ...
    def like_post(self, post_id): ...

class Post:
    def __init__(self, author, content): ...
    def add_comment(self, user, text): ...
    def get_likes_count(self): ...
```

**Step 4: Implementation (15 min)**
```
Focus on 1-2 core methods.
Discuss but don't implement everything.
```

**Step 5: Design Patterns & Trade-offs (10 min)**
```
- Which patterns used? Why?
- How to scale?
- Edge cases?
```

---

### OOD Practice Problems

**Priority Order**:
1. **Parking Lot** (Easy) - Classic, tests basics
2. **Elevator System** (Medium) - Algorithmic + OOD
3. **Chat System** (Medium-Hard) - Real-world, scalability
4. **Library Management** (Easy) - Good for juniors
5. **Deck of Cards** (Easy) - Enums, composition
6. **Chess Game** (Hard) - Complex rules, state
7. **Hotel Reservation** (Medium) - Concurrency, availability
8. **Ride-sharing (Uber)** (Hard) - Matching algorithm + OOD
9. **Vending Machine** (Easy) - State pattern
10. **Movie Ticket Booking** (Medium) - Seats, pricing

**Key Takeaways**:
- Start with requirements, not code
- Think in objects and relationships
- Use interfaces and abstractions
- Discuss trade-offs (memory vs speed, complexity vs maintainability)
- Practice common problems (parking lot is most asked)

---

## Production & Infrastructure Questions

> **Purpose**: Senior engineers must understand production systems, debugging, observability, and SRE practices.

### Why Production Knowledge Matters

- **Oncall**: You'll debug live issues
- **System Design**: Production concerns influence design
- **Seniority Signal**: Junior fixes bugs; senior prevents them
- **Real Impact**: Uptime, performance, cost

---

### 1. Debugging Production Issues

#### Common Production Problems

**1. Memory Leak**

**Scenario**: API servers slowly consuming more memory until OOM crash.

```python
# Debugging with Python
import tracemalloc
import gc

# Start tracking
tracemalloc.start()

# Suspect code
cache = {}

def add_to_cache(key, value):
    cache[key] = value  # Never removed!

# After running...
snapshot = tracemalloc.take_snapshot()
top_stats = snapshot.statistics('lineno')

for stat in top_stats[:10]:
    print(stat)

# Fix: Use LRU cache with size limit
from functools import lru_cache

@lru_cache(maxsize=1000)
def expensive_operation(key):
    return compute(key)
```

```go
// Go: Use pprof for memory profiling
package main

import (
    "net/http"
    _ "net/http/pprof"
    "runtime"
)

func main() {
    // Enable pprof endpoint
    go func() {
        http.ListenAndServe("localhost:6060", nil)
    }()
    
    // Check memory stats
    var m runtime.MemStats
    runtime.ReadMemStats(&m)
    fmt.Printf("Alloc = %v MB\n", m.Alloc / 1024 / 1024)
}

// Access: http://localhost:6060/debug/pprof/heap
// Analyze: go tool pprof http://localhost:6060/debug/pprof/heap
```

**2. High Latency (Slow API)**

**Investigation Steps**:
```
1. Check logs: Any errors? Slow queries?
2. Check metrics: CPU, memory, disk I/O
3. Check traces: Which service is slow?
4. Profile: CPU profiling, query explain plans
```

```python
# Add instrumentation
import time
from functools import wraps

def measure_time(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        start = time.time()
        result = func(*args, **kwargs)
        duration = time.time() - start
        if duration > 1.0:  # Log slow calls
            print(f"{func.__name__} took {duration:.2f}s")
        return result
    return wrapper

@measure_time
def slow_api():
    # Find culprit
    fetch_user()  # 0.05s
    fetch_posts()  # 2.5s  ← Problem!
    fetch_comments()  # 0.1s
```

**Solutions**:
- Add caching
- Optimize queries (add indexes, avoid N+1)
- Add pagination
- Use async/parallel fetching
- Add database read replicas

**3. Cascading Failures**

**Scenario**: One service dies, entire system goes down.

**Prevention**:
```python
# Circuit breaker pattern
from enum import Enum
import time

class CircuitState(Enum):
    CLOSED = 1  # Normal operation
    OPEN = 2    # Failing, reject requests
    HALF_OPEN = 3  # Testing if recovered

class CircuitBreaker:
    def __init__(self, failure_threshold=5, timeout=60):
        self.failure_threshold = failure_threshold
        self.timeout = timeout
        self.failures = 0
        self.last_failure_time = None
        self.state = CircuitState.CLOSED
    
    def call(self, func, *args, **kwargs):
        if self.state == CircuitState.OPEN:
            if time.time() - self.last_failure_time > self.timeout:
                self.state = CircuitState.HALF_OPEN
            else:
                raise Exception("Circuit breaker OPEN")
        
        try:
            result = func(*args, **kwargs)
            self.on_success()
            return result
        except Exception as e:
            self.on_failure()
            raise e
    
    def on_success(self):
        self.failures = 0
        self.state = CircuitState.CLOSED
    
    def on_failure(self):
        self.failures += 1
        self.last_failure_time = time.time()
        if self.failures >= self.failure_threshold:
            self.state = CircuitState.OPEN

# Usage
breaker = CircuitBreaker()

def call_external_service():
    response = breaker.call(requests.get, "http://external-api.com")
    return response
```

---

### 2. Incident Response

**Typical Incident Flow**:

```
1. Alert fires (PagerDuty, Opsgenie)
2. Acknowledge (5 min SLA)
3. Triage: What's broken? How severe?
4. Mitigate: Stop the bleeding (rollback, scale up, disable feature)
5. Communicate: Status page, stakeholders
6. Resolve: Root cause fix
7. Postmortem: What happened? How to prevent?
```

**Interview Question**: *"Service is down, what do you do?"*

**Answer**:
```
1. Verify: Is it really down? Check monitoring, try to access
2. Impact: How many users affected? What functionality broken?
3. Recent changes: Any recent deploys? Config changes?
4. Logs: Check error logs, metrics dashboards
5. Quick fix: Can we rollback? Restart? Scale?
6. Communicate: Update status page, notify team
7. Deep dive: After service restored, find root cause
```

**Postmortem Template**:
```markdown
# Incident: API Outage on 2024-02-01

## Summary
- Duration: 14:23 - 14:45 UTC (22 minutes)
- Impact: 100% of API requests failed (500 errors)
- Root cause: Database connection pool exhausted

## Timeline
- 14:23: Alert fired (error rate > 50%)
- 14:25: Oncall engineer paged
- 14:27: Identified DB connection pool at limit
- 14:30: Increased pool size from 10 → 50
- 14:32: Service recovering
- 14:45: Fully recovered

## Root Cause
- Traffic spike (3x normal)
- DB connection pool too small (10 connections)
- Connections not released (bug in error handling)

## Resolution
- Immediate: Increased pool size
- Short-term: Fixed connection leak bug
- Long-term: Add auto-scaling, connection monitoring

## Action Items
- [ ] Add alert for DB connection count
- [ ] Review all DB queries for connection leaks
- [ ] Load test with 5x traffic
- [ ] Document DB connection best practices

## Lessons Learned
- Need better load testing
- Connection pool size should scale with traffic
- Always release connections in finally block
```

---

### 3. Observability (Logs, Metrics, Traces)

**Three Pillars**:

1. **Logs**: What happened?
2. **Metrics**: How much/many?
3. **Traces**: Where is time spent?

```python
# Structured logging
import logging
import json

class JSONFormatter(logging.Formatter):
    def format(self, record):
        log_data = {
            'timestamp': self.formatTime(record),
            'level': record.levelname,
            'message': record.getMessage(),
            'function': record.funcName,
            'line': record.lineno,
        }
        if hasattr(record, 'user_id'):
            log_data['user_id'] = record.user_id
        if hasattr(record, 'request_id'):
            log_data['request_id'] = record.request_id
        return json.dumps(log_data)

logger = logging.getLogger(__name__)
handler = logging.StreamHandler()
handler.setFormatter(JSONFormatter())
logger.addHandler(handler)
logger.setLevel(logging.INFO)

# Usage
logger.info("User logged in", extra={'user_id': 123, 'request_id': 'abc'})
# Output: {"timestamp": "2024-02-01 10:00:00", "level": "INFO", ...}
```

**Metrics with Prometheus**:
```python
from prometheus_client import Counter, Histogram, Gauge
import time

# Define metrics
request_count = Counter('http_requests_total', 'Total HTTP requests', ['method', 'endpoint'])
request_duration = Histogram('http_request_duration_seconds', 'HTTP request duration')
active_users = Gauge('active_users', 'Number of active users')

# Instrument code
@request_duration.time()
def handle_request(method, endpoint):
    request_count.labels(method=method, endpoint=endpoint).inc()
    # Handle request
    time.sleep(0.1)
    return "OK"

# Update gauge
active_users.set(1234)
```

**Distributed Tracing (OpenTelemetry)**:
```python
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor, ConsoleSpanExporter

trace.set_tracer_provider(TracerProvider())
tracer = trace.get_tracer(__name__)

span_processor = BatchSpanProcessor(ConsoleSpanExporter())
trace.get_tracer_provider().add_span_processor(span_processor)

def fetch_user(user_id):
    with tracer.start_as_current_span("fetch_user") as span:
        span.set_attribute("user.id", user_id)
        # DB query
        time.sleep(0.05)
        return {"id": user_id, "name": "Alice"}

def fetch_posts(user_id):
    with tracer.start_as_current_span("fetch_posts") as span:
        span.set_attribute("user.id", user_id)
        time.sleep(0.2)
        return []

def get_user_profile(user_id):
    with tracer.start_as_current_span("get_user_profile") as span:
        user = fetch_user(user_id)  # Child span
        posts = fetch_posts(user_id)  # Child span
        return {"user": user, "posts": posts}

# This creates trace showing:
# get_user_profile (250ms)
#   ├─ fetch_user (50ms)
#   └─ fetch_posts (200ms)
```

---

### 4. Capacity Planning

**Interview Question**: *"How to determine if we need to scale?"*

**Answer Framework**:

1. **Define SLOs** (Service Level Objectives)
   - Latency: p99 < 200ms
   - Availability: 99.9% uptime
   - Throughput: Handle 10K req/s

2. **Measure Current Capacity**
   - Load test: Max RPS before degradation
   - Resource limits: CPU, memory, DB connections

3. **Project Growth**
   - Expected traffic increase
   - Seasonal patterns (Black Friday, etc.)

4. **Calculate Headroom**
   - Current: 5K RPS
   - Max capacity: 8K RPS
   - Headroom: 60%
   - **Action**: Need to scale when headroom < 30%

**Example Calculation**:
```python
# Current state
current_rps = 5000
current_cpu = 70  # percent
max_cpu = 80  # threshold

# Capacity
max_rps_at_current_cpu = current_rps / (current_cpu / 100)  # 7142 RPS
headroom = (max_rps_at_current_cpu - current_rps) / max_rps_at_current_cpu * 100  # 30%

# Growth projection
monthly_growth_rate = 0.10  # 10% per month
months_until_capacity = 0

rps = current_rps
while rps < max_rps_at_current_cpu * 0.8:  # 80% of max
    rps *= (1 + monthly_growth_rate)
    months_until_capacity += 1

print(f"Need to scale in {months_until_capacity} months")

# Auto-scaling policy
target_cpu = 70
current_instances = 10
required_instances = (current_cpu / target_cpu) * current_instances
print(f"Need {int(required_instances)} instances")
```

---

### Common Interview Questions & Answers

**Q: How do you debug high memory usage?**
A:
1. Check metrics: Memory trend over time
2. Heap dump: Analyze what objects consuming memory
3. Look for leaks: Caches without eviction, unclosed connections
4. Profile: Use pprof (Go) or memory_profiler (Python)
5. Fix: Add limits, fix leaks, tune GC

**Q: Service is slow, how to diagnose?**
A:
1. Check dashboards: CPU, memory, latency, error rate
2. Check traces: Which service/function is slow?
3. Check logs: Any errors or slow queries?
4. Database: Slow query log, missing indexes
5. Network: Latency between services
6. Code: Profile hot paths

**Q: How to prevent downtime during deploy?**
A:
- Blue/green deployment
- Rolling updates (Kubernetes)
- Feature flags
- Database migrations: Backward-compatible
- Health checks: Don't route to unhealthy instances

**Q: How do you monitor a service?**
A:
- **Logs**: Structured, centralized (ELK, Splunk)
- **Metrics**: RED (Rate, Errors, Duration) or USE (Utilization, Saturation, Errors)
- **Traces**: Distributed tracing (Jaeger, Zipkin)
- **Alerts**: Based on SLOs (error rate, latency)
- **Dashboards**: Real-time visibility (Grafana)

---

## Company-Specific Tips

### Google

**Focus**:
- **Algorithms**: Strong CS fundamentals
- **System Design**: Scalability, distributed systems
- **Coding**: Clean, efficient code

**Interview Style**:
- Collaborative, expect hints
- Emphasis on problem-solving approach
- Follow-up questions to probe depth

**Behavioral**:
- "Googleyness" - humility, collaboration
- Growth mindset

### Facebook (Meta)

**Focus**:
- **Coding**: Fast problem-solving
- **System Design**: Scale (billions of users)
- **Product Sense**: Sometimes asked for backend

**Interview Style**:
- Fast-paced, multiple problems
- Expect to code in real IDE (not whiteboard)
- System design very important for senior roles

**Behavioral**:
- Culture fit, impact-driven

### Amazon

**Focus**:
- **Leadership Principles**: Heavy weight
- **Coding**: Standard algorithms
- **System Design**: Practical, AWS-based

**Interview Style**:
- Bar raiser round (extra hard)
- Expect detailed STAR responses
- Scenario-based questions

**Behavioral**:
- 14 Leadership Principles
- Customer obsession paramount

### Apple

**Focus**:
- **Low-level**: Systems programming, memory
- **Design**: Elegant, efficient solutions
- **Domain-specific**: Often role-specific (e.g., ML)

**Interview Style**:
- Deep technical knowledge
- Multiple rounds with same team
- Product-focused

---

### Microsoft

**Focus**:
- **Algorithms**: Strong CS fundamentals (similar to Google)
- **System Design**: Azure cloud, scalability
- **Behavioral**: Growth mindset, collaboration

**Interview Format** (4-5 rounds):
1. **Phone Screen**: 1 coding problem (Medium)
2. **Onsite**:
   - Coding (2 rounds): LeetCode Medium
   - System Design (1 round): Design distributed system
   - Behavioral (1 round): Situational questions

**Tips**:
- Ask clarifying questions (they value communication)
- Discuss trade-offs explicitly
- Mention Azure services if relevant
- Show growth mindset: "I learned X from failure Y"

**Compensation** (L60-L65 Senior):
- Base: $150K-$190K
- Bonus: 10-20%
- Stock: $120K-$200K/4yr
- Total: $180K-$280K

**Culture**:
- Work-life balance: Better than Meta/Amazon
- Bureaucracy: More process than startups
- Growth: Slower promotions than Google
- Remote: Hybrid (3 days office)

---

### Netflix

**Focus**:
- **Independence**: Self-directed, high ownership
- **Impact**: Immediate production work
- **Excellence**: Very high bar (hardest interviews)

**Interview Format** (Unique):
1. **Phone Screen**: Architecture discussion (30-45 min)
2. **Onsite** (Half-day or full-day):
   - Deep technical discussion: Past projects, design decisions
   - System design: Netflix-scale problems
   - Code review: Review Netflix code, suggest improvements
   - Behavioral: Culture fit (freedom & responsibility)

**Key Differences**:
- No leetcode! Focus on real-world systems
- Expect to discuss: Scalability, reliability, monitoring
- Code review: Readable, maintainable, performant
- Bar: Very high - many FAANG seniors fail

**Tips**:
- Prepare deep dives on past projects
- Know distributed systems cold
- Show you can work independently
- Discuss failures and learnings

**Compensation** (Senior):
- All cash (no equity!)
- Base: $400K-$600K
- Top of market
- Annual salary reviews (large adjustments possible)

**Culture**:
- Freedom: No vacation policy, no approval needed
- Responsibility: Deliver or leave
- Firing: Generous severance but low tolerance
- Remote: Flexible

---

### Uber

**Focus**:
- **Real-world systems**: Geo-spatial, routing, matching
- **Scale**: Billions of trips, global operations
- **Execution**: Move fast, high throughput

**Interview Format** (4-5 rounds):
1. **Phone Screen**: 2 coding problems (Medium)
2. **Onsite**:
   - Coding (2 rounds): Algorithms + data structures
   - System Design: Design Uber-like system
   - Behavioral: Past experiences
   - Domain-specific: Geo, routing (for relevant roles)

**Common Problems**:
- Design Uber: Matching riders/drivers, ETA calculation
- Geo-spatial queries: Find nearby drivers
- Surge pricing algorithm
- Route optimization

**Tips**:
- Understand geo-hashing, quad-trees
- Discuss distributed systems (sharding, replication)
- Know graph algorithms (Dijkstra for routing)
- Ask about real-time vs batch processing

**Compensation** (L5 Senior):
- Base: $160K-$200K
- Bonus: 10-15%
- RSUs: $100K-$200K/4yr
- Total: $200K-$300K

**Culture**:
- Fast-paced: Quick decisions, rapid iteration
- Oncall: Expect production responsibilities
- Growth: Good learning opportunities
- Remote: Return to office mandate

---

### Airbnb

**Focus**:
- **Product thinking**: User-centric design
- **System design**: Marketplace, search, pricing
- **Behavioral**: Core values (belong anywhere, champion mission)

**Interview Format** (6-7 rounds):
1. **Phone Screen**: Coding + behavioral
2. **Onsite**:
   - Coding (2 rounds): LeetCode Medium-Hard
   - System Design (2 rounds): Architecture + component design
   - Cross-functional: Work with PM/Design
   - Core values: Behavioral fit

**Unique Aspects**:
- Values fit is CRITICAL (can veto technical hire)
- Expect product discussions
- "Think like a founder" mentality
- Long interview process (6-8 weeks)

**Common System Design**:
- Design Airbnb search
- Design booking system
- Design pricing algorithm
- Design availability calendar

**Tips**:
- Research Airbnb's values deeply
- Prepare stories showing user empathy
- Discuss trade-offs (hosts vs guests)
- Show product sense

**Compensation** (L4 Senior):
- Base: $170K-$200K
- Bonus: 10-15%
- RSUs: $150K-$250K/4yr
- Total: $220K-$320K

**Culture**:
- Mission-driven: True believers in "belong anywhere"
- Tight-knit: Smaller than other FAANG
- Remote: Flexible (live anywhere policy)
- Benefits: Travel credits, Airbnb stays

---

### LinkedIn

**Focus**:
- **Data**: A/B testing, metrics, analytics
- **Professional network**: Graph algorithms, recommendations
- **Career growth**: Mentorship, learning culture

**Interview Format** (4-5 rounds):
1. **Phone Screen**: 1-2 coding problems
2. **Onsite**:
   - Coding (2 rounds): Algorithms, data structures
   - System Design: LinkedIn-specific (feed, search)
   - Behavioral: Leadership, teamwork

**Common Problems**:
- Design LinkedIn feed
- Design connections/network graph
- Design recommendation system
- Design messaging

**Tips**:
- Know graph algorithms (BFS, DFS, shortest path)
- Discuss A/B testing, metrics
- Understand SQL (data-heavy interviews)
- Show collaboration skills

**Compensation** (Mid-Senior):
- Part of Microsoft (since 2016)
- Slightly lower than core Microsoft
- Base: $140K-$180K
- RSUs: $80K-$150K/4yr
- Total: $180K-$260K

**Culture**:
- Work-life balance: Good
- Learning: Strong L&D programs
- Stable: Less volatility than startups
- Remote: Hybrid

---

### Stripe

**Focus**:
- **Payments infrastructure**: Distributed transactions, consistency
- **API design**: Developer experience, RESTful
- **Reliability**: Financial systems, zero downtime

**Interview Format** (5-6 rounds):
1. **Phone Screen**: Coding + debugging
2. **Onsite**:
   - Coding (2 rounds): Algorithms, implementation
   - System Design: Payment systems, APIs
   - Bug Squash: Debug real Stripe code
   - Integration: Build API integration

**Unique "Bug Squash" Round**:
- Given buggy code (Ruby/Python/Go)
- Find and fix bugs in 45 minutes
- Tests debugging skills, code reading

**Common System Design**:
- Design payment processing system
- Design idempotent API
- Handle distributed transactions
- Design webhook system

**Tips**:
- Understand ACID, distributed transactions
- Know idempotency patterns
- Discuss API design principles
- Show attention to edge cases (money is critical!)

**Compensation** (L3-L4 Senior):
- Base: $180K-$220K
- Bonus: 10-15%
- RSUs: $200K-$400K/4yr (grows with valuation)
- Total: $250K-$400K
- Note: IPO pending (equity could be lucrative)

**Culture**:
- Developer-focused: Clean code, good docs
- Remote-first: Work from anywhere
- Async: Heavy documentation, Slack
- High ownership: Small teams, big scope

---

### Coinbase

**Focus**:
- **Crypto/blockchain**: Distributed ledgers, wallets
- **Security**: Cryptography, secure systems
- **Compliance**: Regulatory requirements

**Interview Format** (4-5 rounds):
1. **Phone Screen**: Coding + crypto knowledge (optional)
2. **Onsite**:
   - Coding (2 rounds): Algorithms
   - System Design: Crypto exchange, wallet
   - Domain-specific: Blockchain knowledge (for relevant roles)
   - Behavioral: Mission alignment

**Common System Design**:
- Design cryptocurrency exchange
- Design wallet system
- Handle blockchain forks
- Design transaction verification

**Tips**:
- Basic blockchain knowledge helpful (not required for all roles)
- Understand distributed systems, consensus
- Discuss security (private keys, 2FA, cold storage)
- Show interest in crypto mission

**Compensation** (L4-L5 Senior):
- Base: $160K-$200K
- Bonus: 10-15%
- RSUs: $100K-$250K/4yr
- Total: $200K-$330K
- Note: Stock volatility (follows crypto market)

**Culture**:
- Mission-driven: Crypto believers
- Volatility: Follows market (layoffs in bear markets)
- Remote-first: Distributed team
- Fast-paced: Startup energy despite size

---

### Startup Strategy (Series A-D)

**Pros**:
- Higher equity % (0.1%-1%+ vs 0.01% at FAANG)
- Faster growth, promotions
- More impact, ownership
- Learning opportunities
- Direct access to executives

**Cons**:
- Lower base salary ($120K-$180K)
- Risky equity (90% fail)
- Longer hours
- Less structure
- Unstable (layoffs in downturns)

**When to Join**:
- ✅ Series A-B: High risk, high reward (0.5%-2% equity)
- ✅ Series C-D: Lower risk, still good equity (0.1%-0.5%)
- ❌ Pre-seed: Too risky unless founding team
- ❌ Series E+: Diluted, might as well join FAANG

**Questions to Ask**:
1. What's latest valuation? Runway (cash)?
2. How much equity? (% and shares)
3. Latest 409A (strike price)?
4. Preference stack? (liquidation preferences)
5. Growth metrics? (revenue, users)
6. Funding plan? (next round timeline)

**Equity Valuation Reality Check**:
```
Offer: $140K base + 0.25% equity
Company: Series B, $200M valuation

Your equity:
- 0.25% of $200M = $500K on paper
- 4-year vesting: $125K/yr
- BUT:
  - Need exit (IPO/acquisition)
  - Dilution in future rounds (50%+)
  - Preference stack may wipe out
  - 90% chance of $0

Risk-adjusted value: $10K-$30K/yr

Compare to Google: $180K base + $70K RSUs/yr = $250K
Startup: $140K + $10K equity = $150K

Only join if:
- You believe in mission
- You're willing to bet on upside
- You want to learn/grow fast
```

---

## Language-Specific Tips

> **Purpose**: Deep knowledge of Python and Go shows you're production-ready. Interviewers test language-specific idioms, standard library, and performance considerations.

### Python Interview Tips

#### 1. Common Gotchas

**Mutable Default Arguments**:
```python
# ❌ Wrong: Default list shared across calls
def append_to_list(item, lst=[]):
    lst.append(item)
    return lst

print(append_to_list(1))  # [1]
print(append_to_list(2))  # [1, 2] ← Unexpected!

# ✅ Correct
def append_to_list(item, lst=None):
    if lst is None:
        lst = []
    lst.append(item)
    return lst
```

**Late Binding Closures**:
```python
# ❌ Wrong
funcs = [lambda: i for i in range(3)]
print([f() for f in funcs])  # [2, 2, 2] ← All return 2!

# ✅ Correct: Use default argument
funcs = [lambda i=i: i for i in range(3)]
print([f() for f in funcs])  # [0, 1, 2]
```

**GIL (Global Interpreter Lock)**:
```python
# CPU-bound: Use multiprocessing
from multiprocessing import Pool

def cpu_task(n):
    return sum(i*i for i in range(n))

with Pool(4) as p:
    results = p.map(cpu_task, [10**7] * 4)

# I/O-bound: Use asyncio or threading
import asyncio

async def io_task(url):
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as resp:
            return await resp.text()

asyncio.run(asyncio.gather(*[io_task(url) for url in urls]))
```

#### 2. Essential Standard Library

**collections**:
```python
from collections import defaultdict, Counter, deque, namedtuple

# defaultdict: Never KeyError
word_count = defaultdict(int)
word_count["hello"] += 1  # Works even if key doesn't exist

# Counter: Count occurrences
words = ["apple", "banana", "apple"]
Counter(words)  # {'apple': 2, 'banana': 1}

# deque: O(1) append/pop from both ends
queue = deque([1, 2, 3])
queue.appendleft(0)  # [0, 1, 2, 3]
queue.pop()  # 3

# namedtuple: Lightweight class
Point = namedtuple('Point', ['x', 'y'])
p = Point(1, 2)
print(p.x, p.y)  # 1 2
```

**itertools**:
```python
from itertools import combinations, permutations, product, groupby

# All 2-element combinations
list(combinations([1,2,3], 2))  # [(1,2), (1,3), (2,3)]

# All permutations
list(permutations([1,2,3]))  # [(1,2,3), (1,3,2), (2,1,3), ...]

# Cartesian product
list(product([1,2], ['a','b']))  # [(1,'a'), (1,'b'), (2,'a'), (2,'b')]

# Group consecutive elements
data = [('a',1), ('a',2), ('b',3), ('b',4)]
for key, group in groupby(data, key=lambda x: x[0]):
    print(key, list(group))
# a [('a',1), ('a',2)]
# b [('b',3), ('b',4)]
```

**functools**:
```python
from functools import lru_cache, partial, reduce

# Memoization
@lru_cache(maxsize=128)
def fib(n):
    if n < 2:
        return n
    return fib(n-1) + fib(n-2)

# Partial application
from operator import mul
double = partial(mul, 2)
double(5)  # 10

# Reduce
reduce(lambda x, y: x + y, [1,2,3,4])  # 10
```

#### 3. Pythonic Idioms

**List Comprehensions**:
```python
# ✅ Pythonic
squares = [x**2 for x in range(10) if x % 2 == 0]

# ❌ Not Pythonic
squares = []
for x in range(10):
    if x % 2 == 0:
        squares.append(x**2)

# Dict comprehension
{k: v**2 for k, v in enumerate(range(5))}  # {0: 0, 1: 1, 2: 4, 3: 9, 4: 16}

# Set comprehension
{x % 3 for x in range(10)}  # {0, 1, 2}
```

**Context Managers**:
```python
# ✅ Always use with for files
with open('file.txt') as f:
    data = f.read()
# File automatically closed

# Custom context manager
from contextlib import contextmanager

@contextmanager
def timer():
    start = time.time()
    yield
    print(f"Took {time.time() - start}s")

with timer():
    time.sleep(1)  # Took 1.0s
```

**Unpacking**:
```python
# Multiple assignment
a, b = 1, 2
a, b = b, a  # Swap

# Extended unpacking
first, *middle, last = [1, 2, 3, 4, 5]
# first=1, middle=[2,3,4], last=5

# Function arguments
def func(a, b, c):
    return a + b + c

args = [1, 2, 3]
func(*args)  # 6

kwargs = {'a': 1, 'b': 2, 'c': 3}
func(**kwargs)  # 6
```

#### 4. Performance Tips

**Use Built-ins (Written in C)**:
```python
# ✅ Fast
max([1, 2, 3, 4, 5])

# ❌ Slow
def my_max(items):
    result = items[0]
    for item in items[1:]:
        if item > result:
            result = item
    return result
```

**String Concatenation**:
```python
# ❌ Slow: O(n²) due to immutability
s = ""
for i in range(1000):
    s += str(i)

# ✅ Fast: O(n)
s = "".join(str(i) for i in range(1000))
```

**Set Membership**:
```python
items = list(range(10000))

# ❌ Slow: O(n)
if 9999 in items:
    pass

# ✅ Fast: O(1)
items_set = set(items)
if 9999 in items_set:
    pass
```

---

### Go Interview Tips

#### 1. Common Gotchas

**Range Loop Variable**:
```go
// ❌ Wrong: All goroutines print same value
for i := 0; i < 3; i++ {
    go func() {
        fmt.Println(i)  // Prints 3, 3, 3
    }()
}

// ✅ Correct: Pass variable
for i := 0; i < 3; i++ {
    go func(i int) {
        fmt.Println(i)  // Prints 0, 1, 2
    }(i)
}
```

**Slice Gotcha**:
```go
// Slices share underlying array
a := []int{1, 2, 3, 4, 5}
b := a[0:2]  // [1, 2]
b[0] = 999
fmt.Println(a)  // [999, 2, 3, 4, 5] ← a is modified!

// Copy to avoid
b := make([]int, 2)
copy(b, a[0:2])
b[0] = 999
fmt.Println(a)  // [1, 2, 3, 4, 5] ← a unchanged
```

**Nil Interface**:
```go
var p *int = nil
var i interface{} = p
fmt.Println(i == nil)  // false! (has type)

// Check both
if i == nil || reflect.ValueOf(i).IsNil() {
    fmt.Println("Really nil")
}
```

#### 2. Essential Patterns

**Error Handling**:
```go
// ✅ Always check errors
file, err := os.Open("file.txt")
if err != nil {
    return fmt.Errorf("failed to open file: %w", err)
}
defer file.Close()

// Custom errors
type ValidationError struct {
    Field string
    Value interface{}
}

func (e *ValidationError) Error() string {
    return fmt.Sprintf("invalid %s: %v", e.Field, e.Value)
}

// Error wrapping (Go 1.13+)
if err != nil {
    return fmt.Errorf("database query failed: %w", err)
}

// Unwrap errors
if errors.Is(err, sql.ErrNoRows) {
    // Handle specific error
}

var validationErr *ValidationError
if errors.As(err, &validationErr) {
    // Handle validation error
}
```

**Defer, Panic, Recover**:
```go
func divide(a, b int) (result int) {
    defer func() {
        if r := recover(); r != nil {
            fmt.Println("Recovered from panic:", r)
            result = 0
        }
    }()
    
    if b == 0 {
        panic("division by zero")
    }
    return a / b
}

fmt.Println(divide(10, 0))  // Prints recovery message, returns 0
```

**Context for Cancellation**:
```go
func doWork(ctx context.Context) error {
    for {
        select {
        case <-ctx.Done():
            return ctx.Err()  // Cancelled or timeout
        default:
            // Do work
            time.Sleep(100 * time.Millisecond)
        }
    }
}

// Usage with timeout
ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
defer cancel()

if err := doWork(ctx); err != nil {
    fmt.Println("Work cancelled:", err)
}
```

#### 3. Concurrency Patterns

**Worker Pool**:
```go
func workerPool(tasks <-chan int, results chan<- int, wg *sync.WaitGroup) {
    defer wg.Done()
    for task := range tasks {
        // Process task
        results <- task * 2
    }
}

func main() {
    tasks := make(chan int, 100)
    results := make(chan int, 100)
    
    var wg sync.WaitGroup
    
    // Start 10 workers
    for i := 0; i < 10; i++ {
        wg.Add(1)
        go workerPool(tasks, results, &wg)
    }
    
    // Send tasks
    go func() {
        for i := 0; i < 100; i++ {
            tasks <- i
        }
        close(tasks)
    }()
    
    // Wait and close results
    go func() {
        wg.Wait()
        close(results)
    }()
    
    // Collect results
    for result := range results {
        fmt.Println(result)
    }
}
```

**Fan-Out, Fan-In**:
```go
func fanOut(input <-chan int, n int) []<-chan int {
    channels := make([]<-chan int, n)
    for i := 0; i < n; i++ {
        ch := make(chan int)
        channels[i] = ch
        go func() {
            defer close(ch)
            for val := range input {
                ch <- val * 2
            }
        }()
    }
    return channels
}

func fanIn(channels ...<-chan int) <-chan int {
    out := make(chan int)
    var wg sync.WaitGroup
    
    for _, ch := range channels {
        wg.Add(1)
        go func(c <-chan int) {
            defer wg.Done()
            for val := range c {
                out <- val
            }
        }(ch)
    }
    
    go func() {
        wg.Wait()
        close(out)
    }()
    
    return out
}
```

#### 4. Performance Tips

**Avoid Allocations**:
```go
// ❌ Allocates new slice
func badAppend() []int {
    var result []int
    for i := 0; i < 1000; i++ {
        result = append(result, i)  // May reallocate many times
    }
    return result
}

// ✅ Pre-allocate
func goodAppend() []int {
    result := make([]int, 0, 1000)  // Capacity 1000
    for i := 0; i < 1000; i++ {
        result = append(result, i)  // No reallocation
    }
    return result
}
```

**String Builder**:
```go
// ❌ Slow
var s string
for i := 0; i < 1000; i++ {
    s += fmt.Sprintf("%d", i)
}

// ✅ Fast
var builder strings.Builder
for i := 0; i < 1000; i++ {
    fmt.Fprintf(&builder, "%d", i)
}
s := builder.String()
```

**Benchmark**:
```go
func BenchmarkAppend(b *testing.B) {
    for i := 0; i < b.N; i++ {
        goodAppend()
    }
}

// Run: go test -bench=. -benchmem
```

---

### Language Interview Questions

**Python**:
1. **Explain GIL**: Global Interpreter Lock prevents parallel CPU execution. Use multiprocessing for CPU-bound tasks.
2. **Generator vs List**: Generators are lazy (yield), memory-efficient. Lists are eager, store all.
3. **\*args vs \*\*kwargs**: *args = positional, **kwargs = keyword arguments.
4. **Decorator**: Function that wraps another function to extend behavior.
5. **`__init__` vs `__new__`**: `__new__` creates instance, `__init__` initializes it.

**Go**:
1. **Goroutine vs Thread**: Goroutines are lightweight (2KB stack), multiplexed onto threads.
2. **Channel vs Mutex**: Channels = communication, Mutexes = shared memory protection.
3. **Interface**: Implicit contract - type satisfies interface if it has the methods.
4. **Pointer receiver vs Value receiver**: Pointer = can modify, Value = read-only copy.
5. **Defer execution order**: LIFO (last-in, first-out).

---

## Negotiation & Offer Stage

> **Purpose**: Many candidates lose $50K-$200K by not negotiating properly. This section teaches you how to maximize your offer.

### Why Negotiation Matters

- **One-Time Impact**: 10% higher salary = $300K+ over 4 years (with RSUs)
- **Low Risk**: 99% of offers don't get rescinded for negotiating
- **Expected**: Companies budget for negotiation
- **Precedent**: Starting salary affects future raises

**Golden Rule**: **Always negotiate. Politely.**

---

### Understanding Total Compensation

**Components** (FAANG typical):

```
Total Comp = Base + Bonus + Equity + Benefits

Example: L5 at Google (Senior SWE)
- Base: $180K
- Bonus: $36K (20% target)
- RSUs: $280K/4yr = $70K/yr
- Total: $286K/yr

BUT equity vests over 4 years:
Year 1: $180K + $36K + $70K = $286K
Year 2: $180K + $36K + $70K = $286K
Year 3: $180K + $36K + $70K = $286K
Year 4: $180K + $36K + $70K = $286K
Total 4-year: $1,144K
```

**Equity Vesting Schedules**:

| Company | Vesting Schedule | Cliff |
|---------|------------------|-------|
| Google | 25% yearly | None (monthly) |
| Meta | 25% yearly | None (quarterly) |
| Amazon | 5/15/40/40% | 1 year |
| Apple | 25% yearly | 1 year |
| Microsoft | 25% yearly | None (quarterly) |

**Amazon's Vesting is Backloaded**:
```
Year 1: $175K base + $35K bonus + $25K RSU = $235K
Year 2: $175K base + $35K bonus + $75K RSU = $285K
Year 3: $175K base + $35K bonus + $200K RSU = $410K
Year 4: $175K base + $35K bonus + $200K RSU = $410K

Average: $335K/yr
But Year 1 is only $235K! (Sign-on bonuses help)
```

---

### Negotiation Strategy

#### Phase 1: Information Gathering (Before Offer)

**Never Give First Number**:
```
Recruiter: "What's your expected salary?"
You: "I'm looking for a competitive offer based on market rates for 
      this role and level. What's the budget for this position?"

Or: "I'm currently focused on finding the right fit. I'm sure we can 
     come to an agreement on compensation if this is the right role."
```

**Research Market Rates**:
- **levels.fyi**: Real compensation data
- **Blind**: Salary discussions
- **H1B Database**: Publicly disclosed salaries
- **Teammates**: Ask people at the company

**Understand Your Value**:
- Current total comp
- Competing offers
- Rare skills (distributed systems, ML)
- Location (SF/NYC = higher)

#### Phase 2: Receiving the Offer

**Get Everything in Writing**:
```
Email from recruiter:
"Congratulations! We'd like to extend an offer:
- Level: L5 (Senior SWE)
- Base: $180,000
- Bonus: 20% target ($36K)
- RSUs: $280,000 / 4 years
- Sign-on: $50,000 (Year 1)
- Start date: March 1, 2024

Please let us know by Friday."
```

**Buy Time**:
```
You: "Thank you! I'm excited about this opportunity. I need a few 
     days to review the details and discuss with my family. Can I 
     get back to you by [+3-5 days]?"

Recruiter: "Yes, take your time."
```

**Never Accept Immediately** (even if you love it - you lose leverage).

#### Phase 3: Negotiation

**Step 1: Show Enthusiasm + Concerns**:
```
You: "I'm very excited about joining [Company] and working on [Team]. 
     The offer is competitive, but I was hoping we could discuss the 
     compensation. Based on my research and competing offers, I was 
     expecting a total comp closer to $350K."
```

**Step 2: Provide Data Points**:
```
You: "I have another offer from [Company] at [Level] with:
     - Base: $200K
     - RSUs: $320K/4yr
     - Total: $320K
     
     I prefer [YourCompany] because of [specific reasons], but the 
     comp gap is significant. Can we close this gap?"
```

**Step 3: Ask for Specific Increases**:
```
You: "Specifically, can we:
     1. Increase base to $200K (+$20K)
     2. Increase RSUs to $320K (+$40K)
     3. Increase sign-on to $75K (+$25K)
     
     This would bring Year 1 comp to $315K, which aligns with my 
     other offers."
```

**Step 4: Be Prepared to Walk** (if you have alternatives):
```
Recruiter: "I can do $190K base, $300K RSUs, $60K sign-on."

You: "I appreciate that. Let me think it over and compare with 
     my other options. I'll get back to you tomorrow."
```

---

### Negotiation Tactics

**1. Leverage Competing Offers**:
```
"I have an offer from [Company] at $320K total comp. I prefer your 
company because [reasons], but I need the compensation to be 
comparable. Can you match this?"
```

**2. Negotiate Multiple Components**:
- Can't increase base? → Ask for more equity or sign-on
- Backloaded vesting? → Ask for front-loaded or higher sign-on
- Lower equity? → Ask for performance bonus

**3. Use Ranges, Not Exact Numbers**:
```
❌ "I want exactly $200K base"
✅ "I was hoping for a base in the $195K-$210K range"
```

**4. Be Polite But Firm**:
```
"I really want to work here, but I can't accept an offer that's 
$50K below my current total comp. Can we find a middle ground?"
```

**5. Ask "Is This Your Best Offer?"**:
```
Recruiter: "We can do $190K base, $300K RSUs."
You: "I appreciate that. Is this your best offer? I want to make 
     sure we've explored all options before I make a decision."
```

Often unlocks hidden budget.

---

### What to Negotiate

**Priority Order**:

1. **Equity** (Biggest lever)
   - Google L5: +$40K equity = $10K/yr for 4 years
   - Usually easier to increase than base

2. **Base Salary** (Impacts future raises)
   - 5% annual raise on $180K = $9K
   - 5% annual raise on $200K = $10K
   - Compounds over time

3. **Sign-On Bonus** (One-time)
   - Helps offset low Year 1 (Amazon's backloading)
   - Ask for $50K-$100K

4. **Level** (Long-term impact)
   - L4 → L5 = +$50K-$100K immediately
   - Faster promotion path
   - More scope/impact

5. **Benefits**
   - Remote work
   - Relocation assistance
   - Extra vacation days
   - Education budget

---

### Common Objections & Responses

**"This is our standard offer for this level"**:
```
You: "I understand, but my situation is unique because [competing 
     offers / rare skills / strong performance]. Can we make an 
     exception?"
```

**"We can't increase base, it's policy"**:
```
You: "I understand the base is fixed. Can we increase the equity 
     or sign-on bonus to reach my target comp?"
```

**"The offer expires Friday"**:
```
You: "I appreciate the offer, but I need more time to make such 
     an important decision. Can we extend the deadline to [+3 days]?"
```

(99% of deadlines are artificial.)

**"We can't match that other offer"**:
```
You: "I don't expect you to match exactly, but can we get closer? 
     I really want to join your team, but the gap is too large 
     to justify."
```

---

### Negotiation Email Template

```
Subject: Re: Offer - [Your Name]

Hi [Recruiter],

Thank you so much for the offer! I'm genuinely excited about the 
opportunity to join [Team] at [Company] and work on [Project].

After reviewing the offer and comparing with my current compensation 
and other opportunities, I was hoping we could discuss the package. 
Based on my research and conversations with industry peers, I was 
expecting total compensation in the range of $330K-$350K for a 
senior role at [Company].

Specifically, I was hoping we could adjust:
- Base salary: $200K (vs. $180K offered)
- RSUs: $320K over 4 years (vs. $280K offered)
- Sign-on bonus: $75K (vs. $50K offered)

This would bring Year 1 compensation to ~$315K, which aligns with 
my other offers while reflecting my [X years experience / expertise 
in distributed systems / etc.].

I'm very motivated to join [Company] and confident I can deliver 
significant impact on [Team]. I hope we can find a package that 
works for both sides.

Happy to discuss further. Thanks again for this opportunity!

Best,
[Your Name]
```

---

### Salary & Compensation Data (2024)

**FAANG Total Compensation by Level**:

| Level | Google | Meta | Amazon | Apple | Microsoft | Netflix |
|-------|--------|------|---------|-------|-----------|---------|
| L3/E3 (Junior) | $180K | $180K | $160K | $150K | $150K | $200K |
| L4/E4 (Mid) | $240K | $250K | $200K | $200K | $190K | $300K |
| L5/E5 (Senior) | $350K | $380K | $300K | $300K | $280K | $450K |
| L6/E6 (Staff) | $500K | $550K | $450K | $450K | $420K | $600K |
| L7/E7 (Senior Staff) | $700K | $800K | $650K | $650K | $600K | $800K+ |

**Note**: Netflix pays top of market but all cash (no equity).

**By Location** (Multipliers):

| Location | Multiplier | Example (L5) |
|----------|------------|--------------|
| San Francisco / Bay Area | 1.0x | $350K |
| Seattle | 0.95x | $330K |
| New York | 0.95x | $330K |
| Los Angeles | 0.90x | $315K |
| Austin | 0.85x | $300K |
| Denver | 0.80x | $280K |
| Remote | 0.75-0.90x | $260K-$315K |

**Startup Equity Valuation**:

```
Startup offer: $150K base + 0.1% equity

Questions to ask:
1. What's the latest valuation? ($500M)
2. How many shares outstanding? (100M shares)
3. What's the preference stack? (1x non-participating)
4. What's my strike price? ($5/share)

Your equity:
- 0.1% of 100M shares = 100,000 shares
- Current value: 100K × ($500M/100M) = $500K
- But 4-year vesting: $125K/yr on paper
- Exit scenarios:
  - $1B exit: $1M (10x)
  - $500M exit: $500K (same)
  - $250M exit: $0 (below preference)
  
Risk-adjusted value: $25K-$50K/yr (vs FAANG's $70K RSUs)
```

**When to Join Startups**:
- ✅ Series A-B with strong traction
- ✅ Equity ≥ 0.5% for early employees
- ✅ Passionate about problem
- ❌ Pre-seed (too risky unless founder)
- ❌ Series C+ (diluted, might as well join FAANG)

---

## Post-Interview Actions

### 1. Follow-Up After Interview

**Send Within 24 Hours**:

```
Subject: Thank you - [Position] Interview

Hi [Interviewer],

Thank you for taking the time to speak with me about the [Position] 
role at [Company] today. I really enjoyed our conversation about 
[specific topic discussed], and I'm even more excited about the 
opportunity to contribute to [Team/Project].

Our discussion about [technical challenge] was particularly 
interesting. After the interview, I thought more about the problem 
we discussed and [additional insight / better approach].

I'm very interested in this role and would love to join the team. 
Please let me know if you need any additional information from me.

Looking forward to hearing from you!

Best regards,
[Your Name]
```

**When to Send**:
- ✅ After each interview round
- ✅ After onsite
- ❌ After every single interviewer (too much)

### 2. Timeline Expectations

**Typical Flow**:
```
Phone Screen → 1-2 weeks → Onsite scheduled
Onsite → 3-7 days → Decision
Offer → 3-7 days → Your decision
Accept → 2-4 weeks → Start date
```

**If Taking Too Long**:
```
Email after 1 week:
"Hi [Recruiter], I wanted to check in on the status of my application. 
I remain very interested in the role and would love to know if there's 
any update. Thanks!"
```

### 3. Handling Rejections

**Ask for Feedback**:
```
"Thank you for letting me know. I'm disappointed, but I appreciate 
your time. Would you be able to share any feedback on areas where 
I could improve for future opportunities?"
```

(Most won't give detailed feedback due to legal concerns, but worth asking.)

**Request Future Opportunities**:
```
"I'm still very interested in [Company]. Would it be possible to 
reapply in 6-12 months after addressing the feedback?"
```

**Learn and Move On**:
- Review interview performance
- Practice weak areas
- Apply to more companies (10-20 applications)

### 4. Leveraging Multiple Offers

**Extend Deadlines**:
```
"I have another final round interview scheduled for [Date]. Would 
it be possible to extend my decision deadline to [+1 week after that]?"
```

**Create Competition**:
```
To Company A: "I have another offer from [Company B] that I need 
to respond to by Friday. I'm very interested in [Company A], but 
I need to make a decision soon. Is there any update on your end?"
```

(Polite urgency often speeds up processes.)

**Compare Offers**:
```
Factor                  Google          Meta
Base                    $180K           $190K
Equity (4yr)            $280K ($70K/yr) $320K ($80K/yr)
Bonus                   $36K (20%)      $38K (20%)
Sign-on                 $50K            $60K
Year 1 Total            $336K           $368K
Team                    Google Cloud    Instagram
Growth                  Large team      Faster promo
Work-life               Better          Intense
```

---

## Mental Preparation & Interview Anxiety

### 1. Mindset Shifts

**Reframe Rejection**:
```
❌ "I failed the interview"
✅ "I got data on what to improve"

❌ "I'm not good enough"
✅ "I need more practice on system design"
```

**Interview is Two-Way**:
```
You're evaluating the company as much as they're evaluating you.
- Do I want to work here?
- Is the team strong?
- Will I grow?
```

**Confidence Building**:
```
Before interview, list your achievements:
- "Built service handling 10M req/day"
- "Reduced latency by 50%"
- "Mentored 3 junior engineers"
- "Led migration to microservices"

You ARE qualified. Prove it.
```

### 2. Managing Interview Anxiety

**Day Before**:
- ✅ Review key concepts (don't cram)
- ✅ Prepare outfit, documents
- ✅ Get 8 hours sleep
- ❌ Stay up late studying (fatigue hurts more)

**Morning Of**:
- ✅ Eat light breakfast
- ✅ Arrive 15 min early
- ✅ Deep breathing exercises
- ❌ Caffeine overload

**During Interview**:
- **Pause if needed**: "Give me a moment to think"
- **Think out loud**: Shows problem-solving process
- **Ask questions**: Clarify requirements
- **Stay calm**: One bad answer doesn't doom you

**Breathing Exercise** (2 minutes before):
```
1. Inhale for 4 seconds
2. Hold for 4 seconds
3. Exhale for 4 seconds
4. Hold for 4 seconds
5. Repeat 5 times
```

Reduces cortisol, improves focus.

### 3. Impostor Syndrome

**70% of people experience it. You're not alone.**

**Reality Check**:
```
"Everyone else seems smarter"
→ You're comparing your behind-the-scenes to their highlight reel

"I don't deserve this"
→ They wouldn't interview you if you weren't qualified

"I'll be exposed as a fraud"
→ Nobody knows everything. Seniors ask questions too.
```

**Combat Strategies**:
- Keep "wins" document (compliments, achievements)
- Remember: Interviews test performance, not worth
- Talk to others (most feel the same)

### 4. Dealing with Failure

**Failed Google interview?**
- ✅ Learn what went wrong
- ✅ Practice 2-3 months
- ✅ Apply again (6-12 month cooldown)
- ❌ Give up

**Multiple rejections?**
- ✅ Widen scope (more companies)
- ✅ Get mock interviews (feedback)
- ✅ Consider interview prep courses
- ❌ Take it personally

**Success Rate Reality**:
```
Applications: 50
Phone screens: 15 (30%)
Onsites: 5 (33% of screens)
Offers: 2 (40% of onsites)

This is NORMAL. Keep applying.
```

---

## Practice Resources

**LeetCode**:
```
Patterns to Master (100 problems):
- Top Interview Questions
- Blind 75
- Grind 75
```

**System Design**:
```
Books:
- "Designing Data-Intensive Applications" (Martin Kleppmann)
- "System Design Interview" (Alex Xu)

Videos:
- Gaurav Sen (YouTube)
- System Design Primer (GitHub)
```

**Mock Interviews**:
```
Platforms:
- Pramp (free peer-to-peer)
- Interviewing.io (paid, real engineers)
- LeetCode Mock Interview
```

---

## Timeline & Study Plan

**3-Month Plan**:

**Month 1: Foundations**
```
Week 1-2: Data Structures (Arrays, Linked Lists, Trees)
Week 3-4: Algorithms (Sorting, Searching, Recursion)
Target: 60 Easy problems
```

**Month 2: Intermediate**
```
Week 5-6: Advanced DS (Graphs, Heaps, Tries)
Week 7-8: Dynamic Programming, Greedy
Target: 60 Medium problems
System Design: Read "System Design Interview"
```

**Month 3: Advanced + Mock**
```
Week 9-10: Hard problems, System Design practice
Week 11-12: Mock interviews, company-specific prep
Target: 20 Hard problems, 10 system design problems
```

**Daily Schedule** (3-4 hours/day):
```
- 1-2 hours: Coding (2 problems)
- 1 hour: System design (1 problem/week)
- 30 min: Behavioral (write STAR stories)
- 30 min: Review mistakes
```

---

This complete interview guide covers coding strategies, system design framework, behavioral preparation, and company-specific tips for FAANG success!
