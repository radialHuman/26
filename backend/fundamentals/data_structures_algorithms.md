# Data Structures & Algorithms: Complete Guide

## Table of Contents
1. [Introduction & History](#introduction--history)
2. [Why Data Structures & Algorithms Matter](#why-data-structures--algorithms-matter)
3. [Core Data Structures](#core-data-structures)
4. [Algorithm Paradigms](#algorithm-paradigms)
5. [Complexity Analysis](#complexity-analysis)
6. [Implementation in Go](#implementation-in-go)
7. [Implementation in Python](#implementation-in-python)
8. [Practice Strategies](#practice-strategies)
9. [Production Applications](#production-applications)
10. [Interview Preparation](#interview-preparation)

---

## Introduction & History

### The Evolution of Data Structures

**1940s-1950s: The Beginning**
- **Problem**: Early computers had limited memory (kilobytes). Programmers needed efficient ways to organize data.
- **Solution**: Arrays and linked lists emerged as fundamental structures.
- **Why**: Arrays provided O(1) access time; linked lists allowed dynamic memory allocation.

**1960s: Tree Structures**
- **Problem**: Binary search in arrays required sorted data and couldn't handle dynamic insertions efficiently.
- **Solution**: Binary Search Trees (BST) were invented by P.F. Windley, Andrew Donald Booth, and others.
- **Impact**: Databases began using B-Trees (1972, Rudolf Bayer) for efficient disk-based storage.

**1970s: Hash Tables & Advanced Trees**
- **Problem**: Looking up data in large datasets was too slow with trees alone.
- **Solution**: Hash tables provided O(1) average-case lookup.
- **Advancement**: AVL trees (1962, Adelson-Velsky & Landis) and Red-Black trees (1972) solved BST balancing issues.

**1980s-1990s: Graph Algorithms & Dynamic Programming**
- **Problem**: Real-world problems (routing, optimization) needed graph representations.
- **Solution**: Dijkstra's algorithm (1956, published widely in 1970s), Floyd-Warshall, and others became standard.
- **Why**: The rise of networking and databases demanded efficient pathfinding and optimization.

**2000s-Present: Specialized Structures**
- **Problem**: Big data, distributed systems, and real-time processing.
- **Solution**: Skip lists, tries, bloom filters, and probabilistic data structures.
- **Modern Use**: Google's BigTable uses bloom filters; Redis uses skip lists for sorted sets.

---

## Why Data Structures & Algorithms Matter

### The What: Core Purpose

Data structures are ways to organize and store data so that it can be accessed and modified efficiently. Algorithms are step-by-step procedures to solve problems or perform tasks.

### The Why: Real-World Impact

1. **Performance**: The difference between O(n²) and O(n log n) can mean seconds vs. hours for large datasets.
   - Example: Sorting 1 million records with bubble sort (O(n²)) takes ~1 trillion operations. Merge sort (O(n log n)) takes ~20 million operations.

2. **Scalability**: Proper data structures enable systems to handle growth.
   - Example: Facebook's social graph uses adjacency lists to represent billions of connections.

3. **Resource Optimization**: Memory and CPU are finite resources.
   - Example: Google's search index uses compressed tries to store billions of URLs in memory.

4. **Problem-Solving**: Many real-world problems map to classic algorithms.
   - Example: Uber's route optimization uses variants of Dijkstra's algorithm.

### The How: Choosing the Right Structure

| Use Case | Data Structure | Why |
|----------|---------------|-----|
| Fast lookup by key | Hash Table | O(1) average access |
| Ordered data with fast insertion | Balanced BST | O(log n) operations |
| Range queries | Segment Tree | O(log n) queries |
| Autocomplete | Trie | O(k) where k = word length |
| Recent items | Queue/Circular Buffer | O(1) push/pop |
| Undo functionality | Stack | LIFO property |
| Priority scheduling | Heap | O(log n) extract-min |
| Social network | Graph (Adjacency List) | Space efficient for sparse graphs |

---

## Core Data Structures

### 1. Arrays and Strings

#### Theory & Concepts

**What**: Contiguous memory blocks storing elements of the same type.

**Why Invented**: Direct hardware mapping; CPUs can access array elements via pointer arithmetic.

**When to Use**:
- Fixed-size collections
- Fast random access needed
- Cache locality important

**Trade-offs**:
- ✅ O(1) access time
- ✅ Memory efficient (no overhead)
- ✅ Cache-friendly (contiguous memory)
- ❌ Fixed size (in static arrays)
- ❌ O(n) insertion/deletion in middle
- ❌ Expensive resizing (dynamic arrays)

#### Deep Dive: Dynamic Arrays

**Problem Solved**: Static arrays can't grow.

**Solution**: Over-allocate and resize when full.

**How It Works**:
1. Allocate array of size `capacity` (e.g., 10)
2. When full, allocate new array of size `2 * capacity`
3. Copy all elements to new array
4. Free old array

**Amortized Analysis**: 
- Individual insert might be O(n) during resize
- Amortized over many inserts: O(1)
- Proof: If we insert n elements, total copies = n + n/2 + n/4 + ... ≈ 2n = O(n), so O(1) per operation.

#### Implementation in Go

```go
package main

import "fmt"

// DynamicArray implements a growable array
type DynamicArray struct {
    data     []int
    size     int // current number of elements
    capacity int // allocated space
}

// NewDynamicArray creates a new dynamic array
func NewDynamicArray() *DynamicArray {
    return &DynamicArray{
        data:     make([]int, 0, 10),
        size:     0,
        capacity: 10,
    }
}

// Append adds element to end
func (da *DynamicArray) Append(val int) {
    if da.size == da.capacity {
        da.resize()
    }
    da.data = append(da.data, val)
    da.size++
}

// resize doubles the capacity
func (da *DynamicArray) resize() {
    da.capacity *= 2
    newData := make([]int, da.size, da.capacity)
    copy(newData, da.data)
    da.data = newData
}

// Get retrieves element at index
func (da *DynamicArray) Get(index int) (int, error) {
    if index < 0 || index >= da.size {
        return 0, fmt.Errorf("index out of bounds")
    }
    return da.data[index], nil
}

// Common Array Algorithms

// TwoSum finds two numbers that add up to target
// Time: O(n), Space: O(n)
func TwoSum(nums []int, target int) []int {
    seen := make(map[int]int)
    for i, num := range nums {
        complement := target - num
        if j, ok := seen[complement]; ok {
            return []int{j, i}
        }
        seen[num] = i
    }
    return nil
}

// SlidingWindowMax finds maximum in each window of size k
// Time: O(n), Space: O(k)
func SlidingWindowMax(nums []int, k int) []int {
    if len(nums) == 0 || k == 0 {
        return []int{}
    }
    
    result := make([]int, 0, len(nums)-k+1)
    deque := make([]int, 0, k) // stores indices
    
    for i := 0; i < len(nums); i++ {
        // Remove elements outside window
        if len(deque) > 0 && deque[0] < i-k+1 {
            deque = deque[1:]
        }
        
        // Remove smaller elements (they'll never be max)
        for len(deque) > 0 && nums[deque[len(deque)-1]] < nums[i] {
            deque = deque[:len(deque)-1]
        }
        
        deque = append(deque, i)
        
        if i >= k-1 {
            result = append(result, nums[deque[0]])
        }
    }
    
    return result
}

// KadaneAlgorithm finds maximum subarray sum
// Time: O(n), Space: O(1)
func KadaneAlgorithm(nums []int) int {
    if len(nums) == 0 {
        return 0
    }
    
    maxSoFar := nums[0]
    maxEndingHere := nums[0]
    
    for i := 1; i < len(nums); i++ {
        maxEndingHere = max(nums[i], maxEndingHere+nums[i])
        maxSoFar = max(maxSoFar, maxEndingHere)
    }
    
    return maxSoFar
}

func max(a, b int) int {
    if a > b {
        return a
    }
    return b
}

func main() {
    // Dynamic array usage
    da := NewDynamicArray()
    for i := 0; i < 15; i++ {
        da.Append(i)
    }
    fmt.Printf("Size: %d, Capacity: %d\n", da.size, da.capacity)
    
    // TwoSum example
    nums := []int{2, 7, 11, 15}
    fmt.Println("TwoSum:", TwoSum(nums, 9)) // [0, 1]
    
    // Sliding window max
    fmt.Println("Sliding Window Max:", SlidingWindowMax([]int{1, 3, -1, -3, 5, 3, 6, 7}, 3))
    
    // Maximum subarray
    fmt.Println("Max Subarray Sum:", KadaneAlgorithm([]int{-2, 1, -3, 4, -1, 2, 1, -5, 4}))
}
```

#### Implementation in Python

```python
from typing import List, Optional
from collections import deque

class DynamicArray:
    """
    Dynamic array implementation with automatic resizing.
    
    Time Complexity:
    - append: O(1) amortized
    - get: O(1)
    - resize: O(n)
    """
    
    def __init__(self):
        self._data = [None] * 10
        self._size = 0
        self._capacity = 10
    
    def append(self, val: int) -> None:
        """Add element to end of array."""
        if self._size == self._capacity:
            self._resize()
        self._data[self._size] = val
        self._size += 1
    
    def _resize(self) -> None:
        """Double the capacity."""
        self._capacity *= 2
        new_data = [None] * self._capacity
        for i in range(self._size):
            new_data[i] = self._data[i]
        self._data = new_data
    
    def get(self, index: int) -> int:
        """Retrieve element at index."""
        if index < 0 or index >= self._size:
            raise IndexError("Index out of bounds")
        return self._data[index]
    
    def __len__(self) -> int:
        return self._size
    
    def __repr__(self) -> str:
        return f"DynamicArray(size={self._size}, capacity={self._capacity})"


# Common Array Algorithms

def two_sum(nums: List[int], target: int) -> Optional[List[int]]:
    """
    Find two numbers that add up to target.
    
    Time: O(n), Space: O(n)
    
    Example:
        >>> two_sum([2, 7, 11, 15], 9)
        [0, 1]
    """
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return None


def sliding_window_max(nums: List[int], k: int) -> List[int]:
    """
    Find maximum in each window of size k.
    
    Time: O(n), Space: O(k)
    Uses monotonic decreasing deque.
    
    Example:
        >>> sliding_window_max([1, 3, -1, -3, 5, 3, 6, 7], 3)
        [3, 3, 5, 5, 6, 7]
    """
    if not nums or k == 0:
        return []
    
    result = []
    dq = deque()  # stores indices
    
    for i, num in enumerate(nums):
        # Remove elements outside window
        if dq and dq[0] < i - k + 1:
            dq.popleft()
        
        # Remove smaller elements (never be max)
        while dq and nums[dq[-1]] < num:
            dq.pop()
        
        dq.append(i)
        
        if i >= k - 1:
            result.append(nums[dq[0]])
    
    return result


def kadane_algorithm(nums: List[int]) -> int:
    """
    Find maximum subarray sum.
    
    Time: O(n), Space: O(1)
    
    Kadane's Algorithm Explanation:
    - At each position, decide: extend previous subarray or start new one
    - Keep track of global maximum
    
    Example:
        >>> kadane_algorithm([-2, 1, -3, 4, -1, 2, 1, -5, 4])
        6  # subarray [4, -1, 2, 1]
    """
    if not nums:
        return 0
    
    max_so_far = max_ending_here = nums[0]
    
    for num in nums[1:]:
        max_ending_here = max(num, max_ending_here + num)
        max_so_far = max(max_so_far, max_ending_here)
    
    return max_so_far


def product_except_self(nums: List[int]) -> List[int]:
    """
    Return array where result[i] = product of all elements except nums[i].
    Without using division and in O(n).
    
    Time: O(n), Space: O(1) (excluding output)
    
    Approach: Use left and right products.
    
    Example:
        >>> product_except_self([1, 2, 3, 4])
        [24, 12, 8, 6]
    """
    n = len(nums)
    result = [1] * n
    
    # Left pass: result[i] = product of all elements to the left
    left_product = 1
    for i in range(n):
        result[i] = left_product
        left_product *= nums[i]
    
    # Right pass: multiply by product of all elements to the right
    right_product = 1
    for i in range(n - 1, -1, -1):
        result[i] *= right_product
        right_product *= nums[i]
    
    return result


# String Algorithms

def longest_substring_without_repeating(s: str) -> int:
    """
    Find length of longest substring without repeating characters.
    
    Time: O(n), Space: O(min(n, m)) where m = charset size
    Uses sliding window technique.
    
    Example:
        >>> longest_substring_without_repeating("abcabcbb")
        3  # "abc"
    """
    char_index = {}
    max_length = 0
    start = 0
    
    for end, char in enumerate(s):
        if char in char_index and char_index[char] >= start:
            start = char_index[char] + 1
        char_index[char] = end
        max_length = max(max_length, end - start + 1)
    
    return max_length


def group_anagrams(strs: List[str]) -> List[List[str]]:
    """
    Group strings that are anagrams of each other.
    
    Time: O(n * k log k) where n = number of strings, k = max string length
    Space: O(n * k)
    
    Example:
        >>> group_anagrams(["eat", "tea", "tan", "ate", "nat", "bat"])
        [['eat', 'tea', 'ate'], ['tan', 'nat'], ['bat']]
    """
    from collections import defaultdict
    
    groups = defaultdict(list)
    
    for s in strs:
        # Use sorted string as key
        key = ''.join(sorted(s))
        groups[key].append(s)
    
    return list(groups.values())


if __name__ == "__main__":
    # Test dynamic array
    da = DynamicArray()
    for i in range(15):
        da.append(i)
    print(da)
    
    # Test algorithms
    print("Two Sum:", two_sum([2, 7, 11, 15], 9))
    print("Sliding Window Max:", sliding_window_max([1, 3, -1, -3, 5, 3, 6, 7], 3))
    print("Max Subarray:", kadane_algorithm([-2, 1, -3, 4, -1, 2, 1, -5, 4]))
    print("Product Except Self:", product_except_self([1, 2, 3, 4]))
    print("Longest Substring:", longest_substring_without_repeating("abcabcbb"))
    print("Group Anagrams:", group_anagrams(["eat", "tea", "tan", "ate", "nat", "bat"]))
```

#### Hands-On Practice on Linux

**1. Profiling Array Performance**

```bash
# Install performance tools
sudo apt-get install linux-tools-common linux-tools-generic

# Create test program
cat > array_perf.py << 'EOF'
import time
import random

# Test different array operations
def test_append():
    arr = []
    start = time.time()
    for i in range(1000000):
        arr.append(i)
    return time.time() - start

def test_insert_front():
    arr = []
    start = time.time()
    for i in range(10000):  # Smaller due to O(n) complexity
        arr.insert(0, i)
    return time.time() - start

def test_access():
    arr = list(range(1000000))
    start = time.time()
    for i in range(1000000):
        _ = arr[random.randint(0, 999999)]
    return time.time() - start

print(f"Append: {test_append():.4f}s")
print(f"Insert at front: {test_insert_front():.4f}s")
print(f"Random access: {test_access():.4f}s")
EOF

python3 array_perf.py
```

**2. Memory Profiling**

```bash
# Install memory profiler
pip3 install memory_profiler

# Create memory test
cat > mem_test.py << 'EOF'
from memory_profiler import profile

@profile
def test_array_memory():
    # Static vs dynamic allocation
    arr1 = [0] * 1000000  # Pre-allocated
    arr2 = []
    for i in range(1000000):  # Dynamic growth
        arr2.append(i)

if __name__ == "__main__":
    test_array_memory()
EOF

python3 -m memory_profiler mem_test.py
```

**3. Cache Performance Analysis**

```bash
# Install perf tools
# Run cache analysis
perf stat -e cache-references,cache-misses,cycles,instructions python3 array_perf.py
```

---

### 2. Linked Lists

#### Theory & Concepts

**What**: A sequence of nodes where each node contains data and a reference to the next node.

**History & Why Invented** (1955-1956):
- **Problem**: Arrays require contiguous memory; in early computers with fragmented memory, large arrays failed to allocate.
- **Inventor**: Allen Newell, Cliff Shaw, and Herbert A. Simon while developing IPL (Information Processing Language) for AI research.
- **Breakthrough**: Could insert/delete in O(1) time if you had the position.

**Types**:
1. **Singly Linked List**: Each node points to next
2. **Doubly Linked List**: Each node points to next and previous
3. **Circular Linked List**: Last node points to first

**When to Use**:
- Frequent insertions/deletions
- Unknown size
- No random access needed

**Trade-offs**:
- ✅ O(1) insertion/deletion (if position known)
- ✅ Dynamic size
- ✅ Easy to split/merge
- ❌ O(n) access time
- ❌ Extra memory for pointers
- ❌ Poor cache locality
- ❌ Can't binary search

#### Implementation in Go

```go
package main

import "fmt"

// ListNode represents a node in singly linked list
type ListNode struct {
    Val  int
    Next *ListNode
}

// DoublyListNode for doubly linked list
type DoublyListNode struct {
    Val  int
    Next *DoublyListNode
    Prev *DoublyListNode
}

// LinkedList provides list operations
type LinkedList struct {
    Head *ListNode
    Size int
}

// NewLinkedList creates a new linked list
func NewLinkedList() *LinkedList {
    return &LinkedList{Head: nil, Size: 0}
}

// InsertAtHead adds node at beginning
// Time: O(1), Space: O(1)
func (ll *LinkedList) InsertAtHead(val int) {
    newNode := &ListNode{Val: val, Next: ll.Head}
    ll.Head = newNode
    ll.Size++
}

// InsertAtTail adds node at end
// Time: O(n), Space: O(1)
func (ll *LinkedList) InsertAtTail(val int) {
    newNode := &ListNode{Val: val, Next: nil}
    if ll.Head == nil {
        ll.Head = newNode
        ll.Size++
        return
    }
    
    current := ll.Head
    for current.Next != nil {
        current = current.Next
    }
    current.Next = newNode
    ll.Size++
}

// Delete removes first occurrence of value
// Time: O(n), Space: O(1)
func (ll *LinkedList) Delete(val int) bool {
    if ll.Head == nil {
        return false
    }
    
    // Handle head deletion
    if ll.Head.Val == val {
        ll.Head = ll.Head.Next
        ll.Size--
        return true
    }
    
    current := ll.Head
    for current.Next != nil {
        if current.Next.Val == val {
            current.Next = current.Next.Next
            ll.Size--
            return true
        }
        current = current.Next
    }
    return false
}

// Print displays the list
func (ll *LinkedList) Print() {
    current := ll.Head
    for current != nil {
        fmt.Printf("%d -> ", current.Val)
        current = current.Next
    }
    fmt.Println("nil")
}

// Classic Linked List Problems

// ReverseList reverses a linked list
// Time: O(n), Space: O(1)
func ReverseList(head *ListNode) *ListNode {
    var prev *ListNode
    current := head
    
    for current != nil {
        next := current.Next
        current.Next = prev
        prev = current
        current = next
    }
    
    return prev
}

// DetectCycle detects if list has a cycle
// Floyd's Cycle Detection (Tortoise and Hare)
// Time: O(n), Space: O(1)
func DetectCycle(head *ListNode) bool {
    if head == nil || head.Next == nil {
        return false
    }
    
    slow, fast := head, head
    
    for fast != nil && fast.Next != nil {
        slow = slow.Next
        fast = fast.Next.Next
        
        if slow == fast {
            return true
        }
    }
    
    return false
}

// FindCycleStart finds where cycle begins
// Time: O(n), Space: O(1)
func FindCycleStart(head *ListNode) *ListNode {
    if head == nil || head.Next == nil {
        return nil
    }
    
    slow, fast := head, head
    hasCycle := false
    
    // Detect cycle
    for fast != nil && fast.Next != nil {
        slow = slow.Next
        fast = fast.Next.Next
        if slow == fast {
            hasCycle = true
            break
        }
    }
    
    if !hasCycle {
        return nil
    }
    
    // Find start of cycle
    slow = head
    for slow != fast {
        slow = slow.Next
        fast = fast.Next
    }
    
    return slow
}

// MergeTwoSortedLists merges two sorted lists
// Time: O(m + n), Space: O(1)
func MergeTwoSortedLists(l1, l2 *ListNode) *ListNode {
    dummy := &ListNode{}
    current := dummy
    
    for l1 != nil && l2 != nil {
        if l1.Val < l2.Val {
            current.Next = l1
            l1 = l1.Next
        } else {
            current.Next = l2
            l2 = l2.Next
        }
        current = current.Next
    }
    
    if l1 != nil {
        current.Next = l1
    }
    if l2 != nil {
        current.Next = l2
    }
    
    return dummy.Next
}

// RemoveNthFromEnd removes nth node from end
// Two-pointer technique
// Time: O(n), Space: O(1)
func RemoveNthFromEnd(head *ListNode, n int) *ListNode {
    dummy := &ListNode{Next: head}
    fast, slow := dummy, dummy
    
    // Move fast n+1 steps ahead
    for i := 0; i <= n; i++ {
        fast = fast.Next
    }
    
    // Move both until fast reaches end
    for fast != nil {
        fast = fast.Next
        slow = slow.Next
    }
    
    // Remove nth node
    slow.Next = slow.Next.Next
    
    return dummy.Next
}

// IsPalindrome checks if list is palindrome
// Time: O(n), Space: O(1)
func IsPalindrome(head *ListNode) bool {
    if head == nil || head.Next == nil {
        return true
    }
    
    // Find middle
    slow, fast := head, head
    for fast != nil && fast.Next != nil {
        slow = slow.Next
        fast = fast.Next.Next
    }
    
    // Reverse second half
    var prev *ListNode
    for slow != nil {
        next := slow.Next
        slow.Next = prev
        prev = slow
        slow = next
    }
    
    // Compare first and second half
    left, right := head, prev
    for right != nil {
        if left.Val != right.Val {
            return false
        }
        left = left.Next
        right = right.Next
    }
    
    return true
}

func main() {
    ll := NewLinkedList()
    ll.InsertAtHead(3)
    ll.InsertAtHead(2)
    ll.InsertAtHead(1)
    ll.InsertAtTail(4)
    ll.Print() // 1 -> 2 -> 3 -> 4 -> nil
    
    ll.Delete(2)
    ll.Print() // 1 -> 3 -> 4 -> nil
    
    // Reverse
    ll.Head = ReverseList(ll.Head)
    ll.Print() // 4 -> 3 -> 1 -> nil
}
```

#### Implementation in Python

```python
from typing import Optional

class ListNode:
    """Node in a singly linked list."""
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next


class DoublyListNode:
    """Node in a doubly linked list."""
    def __init__(self, val=0, next=None, prev=None):
        self.val = val
        self.next = next
        self.prev = prev


class LinkedList:
    """Singly linked list implementation."""
    
    def __init__(self):
        self.head = None
        self.size = 0
    
    def insert_at_head(self, val: int) -> None:
        """Insert node at beginning. Time: O(1)"""
        new_node = ListNode(val, self.head)
        self.head = new_node
        self.size += 1
    
    def insert_at_tail(self, val: int) -> None:
        """Insert node at end. Time: O(n)"""
        new_node = ListNode(val)
        if not self.head:
            self.head = new_node
            self.size += 1
            return
        
        current = self.head
        while current.next:
            current = current.next
        current.next = new_node
        self.size += 1
    
    def delete(self, val: int) -> bool:
        """Delete first occurrence. Time: O(n)"""
        if not self.head:
            return False
        
        if self.head.val == val:
            self.head = self.head.next
            self.size -= 1
            return True
        
        current = self.head
        while current.next:
            if current.next.val == val:
                current.next = current.next.next
                self.size -= 1
                return True
            current = current.next
        
        return False
    
    def print_list(self) -> None:
        """Display the list."""
        values = []
        current = self.head
        while current:
            values.append(str(current.val))
            current = current.next
        print(" -> ".join(values) + " -> None")


# Classic Linked List Problems

def reverse_list(head: Optional[ListNode]) -> Optional[ListNode]:
    """
    Reverse a linked list iteratively.
    
    Time: O(n), Space: O(1)
    
    Example:
        1 -> 2 -> 3 -> None
        becomes
        3 -> 2 -> 1 -> None
    """
    prev = None
    current = head
    
    while current:
        next_node = current.next
        current.next = prev
        prev = current
        current = next_node
    
    return prev


def reverse_list_recursive(head: Optional[ListNode]) -> Optional[ListNode]:
    """
    Reverse a linked list recursively.
    
    Time: O(n), Space: O(n) due to recursion stack
    """
    if not head or not head.next:
        return head
    
    new_head = reverse_list_recursive(head.next)
    head.next.next = head
    head.next = None
    
    return new_head


def detect_cycle(head: Optional[ListNode]) -> bool:
    """
    Detect if linked list has a cycle.
    Floyd's Cycle Detection Algorithm (Tortoise and Hare).
    
    Time: O(n), Space: O(1)
    
    Why it works:
    - If there's a cycle, fast will eventually catch up to slow
    - Fast moves 2 steps, slow moves 1 step
    - Relative speed: 1 step/iteration
    """
    if not head or not head.next:
        return False
    
    slow = fast = head
    
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
        
        if slow == fast:
            return True
    
    return False


def find_cycle_start(head: Optional[ListNode]) -> Optional[ListNode]:
    """
    Find where cycle begins.
    
    Time: O(n), Space: O(1)
    
    Mathematical proof:
    - Let distance to cycle start = F
    - Let cycle length = C
    - When slow and fast meet, slow traveled F + a (a < C)
    - Fast traveled F + nC + a (n >= 1)
    - Since fast = 2 * slow: F + nC + a = 2(F + a)
    - Simplify: F = nC - a = (n-1)C + (C - a)
    - So F steps from head = C-a steps from meeting point
    """
    if not head or not head.next:
        return None
    
    slow = fast = head
    
    # Find if cycle exists
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
        if slow == fast:
            break
    else:
        return None  # No cycle
    
    # Find cycle start
    slow = head
    while slow != fast:
        slow = slow.next
        fast = fast.next
    
    return slow


def merge_two_sorted_lists(l1: Optional[ListNode], 
                          l2: Optional[ListNode]) -> Optional[ListNode]:
    """
    Merge two sorted linked lists.
    
    Time: O(m + n), Space: O(1)
    
    Example:
        1 -> 3 -> 5 and 2 -> 4 -> 6
        becomes
        1 -> 2 -> 3 -> 4 -> 5 -> 6
    """
    dummy = ListNode()
    current = dummy
    
    while l1 and l2:
        if l1.val < l2.val:
            current.next = l1
            l1 = l1.next
        else:
            current.next = l2
            l2 = l2.next
        current = current.next
    
    current.next = l1 if l1 else l2
    
    return dummy.next


def remove_nth_from_end(head: Optional[ListNode], n: int) -> Optional[ListNode]:
    """
    Remove nth node from end of list.
    
    Time: O(L) where L = length, Space: O(1)
    
    Two-pointer technique:
    - Move fast pointer n+1 steps ahead
    - Move both pointers until fast reaches end
    - slow will be at node before the one to delete
    """
    dummy = ListNode(0, head)
    fast = slow = dummy
    
    # Move fast n+1 steps ahead
    for _ in range(n + 1):
        fast = fast.next
    
    # Move both until fast reaches end
    while fast:
        fast = fast.next
        slow = slow.next
    
    # Remove nth node
    slow.next = slow.next.next
    
    return dummy.next


def is_palindrome(head: Optional[ListNode]) -> bool:
    """
    Check if linked list is a palindrome.
    
    Time: O(n), Space: O(1)
    
    Approach:
    1. Find middle using slow/fast pointers
    2. Reverse second half
    3. Compare first and second half
    """
    if not head or not head.next:
        return True
    
    # Find middle
    slow = fast = head
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
    
    # Reverse second half
    prev = None
    while slow:
        next_node = slow.next
        slow.next = prev
        prev = slow
        slow = next_node
    
    # Compare
    left, right = head, prev
    while right:  # right half might be shorter
        if left.val != right.val:
            return False
        left = left.next
        right = right.next
    
    return True


def reorder_list(head: Optional[ListNode]) -> None:
    """
    Reorder list from L0→L1→…→Ln-1→Ln to L0→Ln→L1→Ln-1→L2→Ln-2→…
    
    Time: O(n), Space: O(1)
    
    Example:
        1 -> 2 -> 3 -> 4 -> 5
        becomes
        1 -> 5 -> 2 -> 4 -> 3
    
    Approach:
    1. Find middle
    2. Reverse second half
    3. Merge two halves
    """
    if not head or not head.next:
        return
    
    # Find middle
    slow = fast = head
    while fast.next and fast.next.next:
        slow = slow.next
        fast = fast.next.next
    
    # Reverse second half
    second = slow.next
    slow.next = None
    prev = None
    while second:
        next_node = second.next
        second.next = prev
        prev = second
        second = next_node
    
    # Merge two halves
    first, second = head, prev
    while second:
        tmp1, tmp2 = first.next, second.next
        first.next = second
        second.next = tmp1
        first, second = tmp1, tmp2


def copy_random_list(head: Optional['Node']) -> Optional['Node']:
    """
    Deep copy a linked list with random pointers.
    
    Time: O(n), Space: O(n)
    
    Node definition:
    class Node:
        def __init__(self, val, next=None, random=None):
            self.val = val
            self.next = next
            self.random = random
    """
    if not head:
        return None
    
    # Create mapping: old -> new
    old_to_new = {}
    
    # First pass: create all nodes
    current = head
    while current:
        old_to_new[current] = Node(current.val)
        current = current.next
    
    # Second pass: set next and random pointers
    current = head
    while current:
        if current.next:
            old_to_new[current].next = old_to_new[current.next]
        if current.random:
            old_to_new[current].random = old_to_new[current.random]
        current = current.next
    
    return old_to_new[head]


if __name__ == "__main__":
    # Test linked list
    ll = LinkedList()
    ll.insert_at_head(3)
    ll.insert_at_head(2)
    ll.insert_at_head(1)
    ll.insert_at_tail(4)
    ll.print_list()  # 1 -> 2 -> 3 -> 4 -> None
    
    ll.delete(2)
    ll.print_list()  # 1 -> 3 -> 4 -> None
    
    # Reverse
    ll.head = reverse_list(ll.head)
    ll.print_list()  # 4 -> 3 -> 1 -> None
```

#### Hands-On Practice on Linux

**1. Memory Layout Analysis**

```bash
# Create test to understand pointer overhead
cat > list_memory.py << 'EOF'
import sys

class Node:
    def __init__(self, val):
        self.val = val
        self.next = None

# Compare memory usage
import array
arr = array.array('i', range(1000))
print(f"Array memory: {sys.getsizeof(arr)} bytes")

# Linked list
head = Node(0)
current = head
for i in range(1, 1000):
    current.next = Node(i)
    current = current.next

# Estimate: each Node object + val + next pointer
node_size = sys.getsizeof(Node(0))
print(f"Per node overhead: ~{node_size} bytes")
print(f"Estimated list memory: ~{node_size * 1000} bytes")
EOF

python3 list_memory.py
```

**2. Cache Performance Comparison**

```bash
# Array vs Linked List cache performance
cat > cache_test.c << 'EOF'
#include <stdio.h>
#include <stdlib.h>
#include <time.h>

struct Node {
    int val;
    struct Node* next;
};

int main() {
    int n = 1000000;
    
    // Array access
    int* arr = malloc(n * sizeof(int));
    for (int i = 0; i < n; i++) arr[i] = i;
    
    clock_t start = clock();
    long sum = 0;
    for (int i = 0; i < n; i++) {
        sum += arr[i];
    }
    clock_t end = clock();
    printf("Array time: %f seconds\n", (double)(end - start) / CLOCKS_PER_SEC);
    
    // Linked list access
    struct Node* head = malloc(sizeof(struct Node));
    head->val = 0;
    struct Node* current = head;
    for (int i = 1; i < n; i++) {
        current->next = malloc(sizeof(struct Node));
        current = current->next;
        current->val = i;
        current->next = NULL;
    }
    
    start = clock();
    sum = 0;
    current = head;
    while (current) {
        sum += current->val;
        current = current->next;
    }
    end = clock();
    printf("Linked list time: %f seconds\n", (double)(end - start) / CLOCKS_PER_SEC);
    
    return 0;
}
EOF

gcc -O2 cache_test.c -o cache_test
./cache_test
```

**3. Debugging with GDB**

```bash
# Compile with debug symbols
cat > debug_list.c << 'EOF'
#include <stdio.h>
#include <stdlib.h>

struct Node {
    int val;
    struct Node* next;
};

struct Node* create_list(int n) {
    struct Node* head = malloc(sizeof(struct Node));
    head->val = 1;
    struct Node* current = head;
    
    for (int i = 2; i <= n; i++) {
        current->next = malloc(sizeof(struct Node));
        current = current->next;
        current->val = i;
    }
    current->next = NULL;
    
    return head;
}

void print_list(struct Node* head) {
    while (head) {
        printf("%d -> ", head->val);
        head = head->next;
    }
    printf("NULL\n");
}

int main() {
    struct Node* list = create_list(5);
    print_list(list);
    return 0;
}
EOF

gcc -g debug_list.c -o debug_list

# Use GDB
gdb ./debug_list
# In GDB:
# break main
# run
# print list
# print list->next
# next (step through)
```

---

### 3. Stacks and Queues

#### Theory & Concepts

**Stack (LIFO - Last In, First Out)**

**What**: A linear data structure where elements are added and removed from the same end (top).

**History** (1946):
- **Problem**: Evaluating arithmetic expressions and function call management in early computers.
- **Context**: ENIAC and early von Neumann architectures needed to manage subroutine calls.
- **Solution**: Stack-based memory management for function call frames.
- **Impact**: Modern call stacks, recursion, expression evaluation.

**When to Use**:
- Function call management (call stack)
- Expression evaluation
- Undo/redo functionality
- Backtracking algorithms
- Balanced parentheses checking
- Browser history (back button)

**Queue (FIFO - First In, First Out)**

**What**: A linear data structure where elements are added at one end (rear) and removed from the other (front).

**History** (1950s):
- **Problem**: Managing tasks in operating systems (process scheduling).
- **Context**: Time-sharing systems needed fair task distribution.
- **Solution**: Queue-based scheduling ensures tasks are processed in order.
- **Impact**: OS schedulers, print spoolers, message queues.

**When to Use**:
- Task scheduling
- Breadth-First Search (BFS)
- Request handling (web servers)
- Print queue
- Message queues

**Variants**:
1. **Deque (Double-Ended Queue)**: Add/remove from both ends
2. **Priority Queue**: Elements have priorities; highest priority comes out first
3. **Circular Queue**: Last position connects back to first

**Trade-offs**:

| Operation | Stack | Queue | Deque |
|-----------|-------|-------|-------|
| Push/Enqueue | O(1) | O(1) | O(1) |
| Pop/Dequeue | O(1) | O(1) | O(1) |
| Peek | O(1) | O(1) | O(1) |
| Space | O(n) | O(n) | O(n) |

#### Implementation in Go

```go
package main

import (
    "container/list"
    "errors"
    "fmt"
)

// Stack Implementation using slice
type Stack struct {
    items []int
}

func NewStack() *Stack {
    return &Stack{items: make([]int, 0)}
}

func (s *Stack) Push(val int) {
    s.items = append(s.items, val)
}

func (s *Stack) Pop() (int, error) {
    if s.IsEmpty() {
        return 0, errors.New("stack is empty")
    }
    index := len(s.items) - 1
    val := s.items[index]
    s.items = s.items[:index]
    return val, nil
}

func (s *Stack) Peek() (int, error) {
    if s.IsEmpty() {
        return 0, errors.New("stack is empty")
    }
    return s.items[len(s.items)-1], nil
}

func (s *Stack) IsEmpty() bool {
    return len(s.items) == 0
}

func (s *Stack) Size() int {
    return len(s.items)
}

// Queue Implementation using slice
type Queue struct {
    items []int
}

func NewQueue() *Queue {
    return &Queue{items: make([]int, 0)}
}

func (q *Queue) Enqueue(val int) {
    q.items = append(q.items, val)
}

func (q *Queue) Dequeue() (int, error) {
    if q.IsEmpty() {
        return 0, errors.New("queue is empty")
    }
    val := q.items[0]
    q.items = q.items[1:]
    return val, nil
}

func (q *Queue) Front() (int, error) {
    if q.IsEmpty() {
        return 0, errors.New("queue is empty")
    }
    return q.items[0], nil
}

func (q *Queue) IsEmpty() bool {
    return len(q.items) == 0
}

func (q *Queue) Size() int {
    return len(q.items)
}

// Efficient Queue using circular buffer
type CircularQueue struct {
    items    []int
    front    int
    rear     int
    size     int
    capacity int
}

func NewCircularQueue(capacity int) *CircularQueue {
    return &CircularQueue{
        items:    make([]int, capacity),
        front:    0,
        rear:     -1,
        size:     0,
        capacity: capacity,
    }
}

func (cq *CircularQueue) Enqueue(val int) error {
    if cq.IsFull() {
        return errors.New("queue is full")
    }
    cq.rear = (cq.rear + 1) % cq.capacity
    cq.items[cq.rear] = val
    cq.size++
    return nil
}

func (cq *CircularQueue) Dequeue() (int, error) {
    if cq.IsEmpty() {
        return 0, errors.New("queue is empty")
    }
    val := cq.items[cq.front]
    cq.front = (cq.front + 1) % cq.capacity
    cq.size--
    return val, nil
}

func (cq *CircularQueue) IsFull() bool {
    return cq.size == cq.capacity
}

func (cq *CircularQueue) IsEmpty() bool {
    return cq.size == 0
}

// Classic Stack Problems

// ValidParentheses checks if parentheses are balanced
// Time: O(n), Space: O(n)
func ValidParentheses(s string) bool {
    stack := NewStack()
    pairs := map[rune]rune{
        ')': '(',
        '}': '{',
        ']': '[',
    }
    
    for _, char := range s {
        if char == '(' || char == '{' || char == '[' {
            stack.Push(int(char))
        } else {
            if stack.IsEmpty() {
                return false
            }
            top, _ := stack.Pop()
            if rune(top) != pairs[char] {
                return false
            }
        }
    }
    
    return stack.IsEmpty()
}

// EvaluateRPN evaluates Reverse Polish Notation
// Time: O(n), Space: O(n)
// Example: ["2", "1", "+", "3", "*"] = ((2 + 1) * 3) = 9
func EvaluateRPN(tokens []string) int {
    stack := NewStack()
    
    for _, token := range tokens {
        switch token {
        case "+":
            b, _ := stack.Pop()
            a, _ := stack.Pop()
            stack.Push(a + b)
        case "-":
            b, _ := stack.Pop()
            a, _ := stack.Pop()
            stack.Push(a - b)
        case "*":
            b, _ := stack.Pop()
            a, _ := stack.Pop()
            stack.Push(a * b)
        case "/":
            b, _ := stack.Pop()
            a, _ := stack.Pop()
            stack.Push(a / b)
        default:
            var num int
            fmt.Sscanf(token, "%d", &num)
            stack.Push(num)
        }
    }
    
    result, _ := stack.Pop()
    return result
}

// DailyTemperatures finds next warmer temperature
// Time: O(n), Space: O(n)
// Uses monotonic stack
func DailyTemperatures(temperatures []int) []int {
    n := len(temperatures)
    result := make([]int, n)
    stack := NewStack()
    
    for i := 0; i < n; i++ {
        for !stack.IsEmpty() {
            topIdx, _ := stack.Peek()
            if temperatures[topIdx] < temperatures[i] {
                stack.Pop()
                result[topIdx] = i - topIdx
            } else {
                break
            }
        }
        stack.Push(i)
    }
    
    return result
}

// LargestRectangleArea finds largest rectangle in histogram
// Time: O(n), Space: O(n)
// Uses monotonic stack
func LargestRectangleArea(heights []int) int {
    stack := NewStack()
    maxArea := 0
    
    for i, h := range heights {
        for !stack.IsEmpty() {
            topIdx, _ := stack.Peek()
            if heights[topIdx] > h {
                stack.Pop()
                width := i
                if !stack.IsEmpty() {
                    prevIdx, _ := stack.Peek()
                    width = i - prevIdx - 1
                }
                area := heights[topIdx] * width
                if area > maxArea {
                    maxArea = area
                }
            } else {
                break
            }
        }
        stack.Push(i)
    }
    
    for !stack.IsEmpty() {
        topIdx, _ := stack.Pop()
        width := len(heights)
        if !stack.IsEmpty() {
            prevIdx, _ := stack.Peek()
            width = len(heights) - prevIdx - 1
        }
        area := heights[topIdx] * width
        if area > maxArea {
            maxArea = area
        }
    }
    
    return maxArea
}

// MinStack supports push, pop, top, and retrieving minimum in O(1)
type MinStack struct {
    stack    *Stack
    minStack *Stack
}

func NewMinStack() *MinStack {
    return &MinStack{
        stack:    NewStack(),
        minStack: NewStack(),
    }
}

func (ms *MinStack) Push(val int) {
    ms.stack.Push(val)
    if ms.minStack.IsEmpty() {
        ms.minStack.Push(val)
    } else {
        min, _ := ms.minStack.Peek()
        if val <= min {
            ms.minStack.Push(val)
        } else {
            ms.minStack.Push(min)
        }
    }
}

func (ms *MinStack) Pop() {
    ms.stack.Pop()
    ms.minStack.Pop()
}

func (ms *MinStack) Top() (int, error) {
    return ms.stack.Peek()
}

func (ms *MinStack) GetMin() (int, error) {
    return ms.minStack.Peek()
}

func main() {
    // Stack example
    stack := NewStack()
    stack.Push(1)
    stack.Push(2)
    stack.Push(3)
    fmt.Println("Stack size:", stack.Size())
    val, _ := stack.Pop()
    fmt.Println("Popped:", val)
    
    // Queue example
    queue := NewQueue()
    queue.Enqueue(1)
    queue.Enqueue(2)
    queue.Enqueue(3)
    val, _ = queue.Dequeue()
    fmt.Println("Dequeued:", val)
    
    // Valid parentheses
    fmt.Println("Valid:", ValidParentheses("()[]{}"))   // true
    fmt.Println("Valid:", ValidParentheses("([)]"))     // false
    
    // RPN
    fmt.Println("RPN:", EvaluateRPN([]string{"2", "1", "+", "3", "*"})) // 9
    
    // Daily temperatures
    temps := []int{73, 74, 75, 71, 69, 72, 76, 73}
    fmt.Println("Daily temps:", DailyTemperatures(temps))
}
```

(Due to length constraints, I'll continue with a few more essential topics. The pattern will be: Theory → History → Implementation in Go/Python → Hands-on practice. Would you like me to continue with the remaining topics in subsequent files?)

---

## Practice Strategies

### 1. Problem-Solving Framework

**The 4-Step Approach**:

1. **Understand**: Clarify the problem
   - What are the inputs/outputs?
   - What are the constraints?
   - What are edge cases?
   
2. **Plan**: Choose approach
   - What data structure fits?
   - What algorithm pattern applies?
   - What's the time/space complexity?
   
3. **Implement**: Write code
   - Start with brute force
   - Optimize iteratively
   - Handle edge cases
   
4. **Test**: Verify correctness
   - Test with examples
   - Test edge cases
   - Analyze complexity

### 2. Pattern Recognition

Learn to identify these patterns:

| Pattern | When to Use | Example Problems |
|---------|-------------|------------------|
| Two Pointers | Sorted array, palindrome | Two sum, container with most water |
| Sliding Window | Subarray/substring | Longest substring without repeating |
| Fast & Slow Pointers | Cycle detection | Linked list cycle |
| Merge Intervals | Overlapping intervals | Merge intervals, meeting rooms |
| Cyclic Sort | Missing numbers in range | Find missing number |
| In-place Reversal | Reverse linked list | Reverse nodes in k-group |
| BFS | Level-order traversal | Binary tree level order |
| DFS | Path finding | Number of islands |
| Two Heaps | Median finding | Find median from data stream |
| Subset | Combinations | Subsets, permutations |
| Binary Search | Sorted data | Search in rotated array |
| Topological Sort | DAG ordering | Course schedule |
| DP | Overlapping subproblems | Coin change, LIS |

### 3. Daily Practice Schedule

**Beginner (0-2 months)**:
- Week 1-2: Arrays, strings (20 problems)
- Week 3-4: Linked lists, stacks, queues (20 problems)
- Week 5-6: Hash tables, sets (15 problems)
- Week 7-8: Trees, basic recursion (20 problems)

**Intermediate (2-4 months)**:
- Week 1-2: Binary search variations (15 problems)
- Week 3-4: Two pointers, sliding window (20 problems)
- Week 5-6: DFS, BFS (25 problems)
- Week 7-8: Dynamic programming basics (20 problems)

**Advanced (4-6 months)**:
- Week 1-2: Advanced DP (15 problems)
- Week 3-4: Graph algorithms (20 problems)
- Week 5-6: Hard problems (15 problems)
- Week 7-8: System design practice

### 4. Hands-On Projects on Linux

```bash
# Set up practice environment
mkdir -p ~/dsa-practice/{go,python,tests}
cd ~/dsa-practice

# Initialize Go module
cd go
go mod init github.com/yourname/dsa
cd ..

# Create Python virtual environment
cd python
python3 -m venv venv
source venv/bin/activate
pip install pytest
cd ..
```

---

## Production Applications

### Where DSA is Used in Real Systems

1. **Hash Tables**:
   - Redis: In-memory key-value store
   - Database indexes
   - Caching layers
   
2. **Trees**:
   - File systems (B-trees)
   - Databases (B+ trees for indexes)
   - Compilers (AST - Abstract Syntax Trees)
   
3. **Graphs**:
   - Social networks (friend recommendations)
   - Maps/GPS (shortest path)
   - Network routing
   
4. **Tries**:
   - Autocomplete systems
   - IP routing tables
   - Spell checkers
   
5. **Heaps**:
   - Priority queues in OS schedulers
   - Dijkstra's algorithm
   - Top-K problems (trending topics)

---

## Interview Preparation

### Common Mistakes to Avoid

1. **Jumping to code** without understanding the problem
2. **Not considering edge cases** (empty input, single element, duplicates)
3. **Poor time management** (spending too long on one approach)
4. **Not communicating** thought process
5. **Forgetting to analyze complexity**

### Interview Tips

1. **Think out loud**: Explain your reasoning
2. **Ask clarifying questions**: Don't assume
3. **Start simple**: Brute force, then optimize
4. **Test your code**: Walk through with examples
5. **Discuss trade-offs**: Time vs. space

---

This is a comprehensive start. I'll now create similar detailed content for the remaining topics. Would you like me to continue with the next topics?
