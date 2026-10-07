import type { Flashcard } from "../types";

export const codingCards: readonly Flashcard[] = [
  { q: "Two Sum", a: `Use a hash map to remember each value's index. For every new value, check if its complement (target - value) was already seen.

~~~
def twoSum(nums, target):
    seen = {}
    for i, n in enumerate(nums):
        d = target - n
        if d in seen:
            return [seen[d], i]
        seen[n] = i
~~~
Time O(n) | Space O(n)` },

  { q: "Three Sum", a: `Sort, then for each i, use two pointers to find pairs (l, r) with sum = -nums[i]. Skip duplicates.

~~~
def threeSum(nums):
    nums.sort()
    res = []
    n = len(nums)
    for i in range(n - 2):
        if i > 0 and nums[i] == nums[i-1]:
            continue
        l, r = i + 1, n - 1
        while l < r:
            s = nums[i] + nums[l] + nums[r]
            if s < 0: l += 1
            elif s > 0: r -= 1
            else:
                res.append([nums[i], nums[l], nums[r]])
                while l < r and nums[l] == nums[l+1]: l += 1
                while l < r and nums[r] == nums[r-1]: r -= 1
                l += 1; r -= 1
    return res
~~~
Time O(n²) | Space O(1) extra` },

  { q: "Four Sum", a: `Sort and fix two indices i and j, then two-pointer on the remaining range. Skip duplicates at every level.

~~~
def fourSum(nums, target):
    nums.sort()
    n = len(nums)
    res = []
    for i in range(n - 3):
        if i > 0 and nums[i] == nums[i-1]: continue
        for j in range(i + 1, n - 2):
            if j > i + 1 and nums[j] == nums[j-1]: continue
            l, r = j + 1, n - 1
            while l < r:
                s = nums[i] + nums[j] + nums[l] + nums[r]
                if s < target: l += 1
                elif s > target: r -= 1
                else:
                    res.append([nums[i], nums[j], nums[l], nums[r]])
                    while l < r and nums[l] == nums[l+1]: l += 1
                    while l < r and nums[r] == nums[r-1]: r -= 1
                    l += 1; r -= 1
    return res
~~~
Time O(n³) | Space O(1) extra` },

  { q: "Two Sum II – Input Array Is Sorted", a: `Sorted array means we can use two pointers — move l up when sum is too small, r down when too big.

~~~
def twoSum(nums, target):
    l, r = 0, len(nums) - 1
    while l < r:
        s = nums[l] + nums[r]
        if s == target:
            return [l + 1, r + 1]
        if s < target: l += 1
        else: r -= 1
~~~
Time O(n) | Space O(1)` },

  { q: "Contains Duplicate", a: `If converting to a set drops elements, there were duplicates.

~~~
def containsDuplicate(nums):
    return len(set(nums)) != len(nums)
~~~
Time O(n) | Space O(n)` },

  { q: "Valid Anagram", a: `Two strings are anagrams iff their character counts are equal.

~~~
from collections import Counter

def isAnagram(s, t):
    return Counter(s) == Counter(t)
~~~
Time O(n) | Space O(1) — at most 26 keys` },

  { q: "Group Anagrams", a: `Use sorted string (or character-count tuple) as the bucket key.

~~~
from collections import defaultdict

def groupAnagrams(strs):
    groups = defaultdict(list)
    for s in strs:
        groups[''.join(sorted(s))].append(s)
    return list(groups.values())
~~~
Time O(n · k log k) | Space O(n · k) — k = avg string length` },

  { q: "Top K Frequent Elements", a: `Bucket sort by frequency: index = freq, value = list of numbers with that freq. Walk from highest to lowest.

~~~
from collections import Counter

def topKFrequent(nums, k):
    count = Counter(nums)
    buckets = [[] for _ in range(len(nums) + 1)]
    for num, freq in count.items():
        buckets[freq].append(num)
    res = []
    for i in range(len(buckets) - 1, -1, -1):
        res.extend(buckets[i])
        if len(res) >= k:
            return res[:k]
~~~
Time O(n) | Space O(n)` },

  { q: "Product of Array Except Self", a: `Two passes: first build prefix products, then multiply in suffix products on the way back.

~~~
def productExceptSelf(nums):
    n = len(nums)
    res = [1] * n
    left = 1
    for i in range(n):
        res[i] = left
        left *= nums[i]
    right = 1
    for i in range(n - 1, -1, -1):
        res[i] *= right
        right *= nums[i]
    return res
~~~
Time O(n) | Space O(1) extra (output excluded)` },

  { q: "Maximum Subarray (Kadane)", a: `Track best ending here = max(num, prev_best + num); update global max.

~~~
def maxSubArray(nums):
    cur = best = nums[0]
    for n in nums[1:]:
        cur = max(n, cur + n)
        best = max(best, cur)
    return best
~~~
Time O(n) | Space O(1)` },

  { q: "Maximum Product Subarray", a: `Track both running max and min because a negative * negative can flip min into max.

~~~
def maxProduct(nums):
    res = mx = mn = nums[0]
    for n in nums[1:]:
        cands = (n, n * mx, n * mn)
        mx, mn = max(cands), min(cands)
        res = max(res, mx)
    return res
~~~
Time O(n) | Space O(1)` },

  { q: "Best Time to Buy and Sell Stock", a: `Track the running minimum price; profit = price - min.

~~~
def maxProfit(prices):
    lo = float('inf')
    profit = 0
    for p in prices:
        lo = min(lo, p)
        profit = max(profit, p - lo)
    return profit
~~~
Time O(n) | Space O(1)` },

  { q: "Best Time to Buy and Sell Stock II", a: `Capture every positive day-to-day delta — equivalent to buying before each up-day.

~~~
def maxProfit(prices):
    return sum(max(0, prices[i] - prices[i-1])
               for i in range(1, len(prices)))
~~~
Time O(n) | Space O(1)` },

  { q: "Merge Intervals", a: `Sort by start; either extend the last result or append a new interval.

~~~
def merge(intervals):
    intervals.sort()
    res = [intervals[0]]
    for s, e in intervals[1:]:
        if s <= res[-1][1]:
            res[-1][1] = max(res[-1][1], e)
        else:
            res.append([s, e])
    return res
~~~
Time O(n log n) | Space O(n)` },

  { q: "Insert Interval", a: `Three phases: copy intervals before, merge overlapping, copy intervals after.

~~~
def insert(intervals, newInterval):
    res = []
    i, n = 0, len(intervals)
    while i < n and intervals[i][1] < newInterval[0]:
        res.append(intervals[i]); i += 1
    while i < n and intervals[i][0] <= newInterval[1]:
        newInterval[0] = min(newInterval[0], intervals[i][0])
        newInterval[1] = max(newInterval[1], intervals[i][1])
        i += 1
    res.append(newInterval)
    res.extend(intervals[i:])
    return res
~~~
Time O(n) | Space O(n)` },

  { q: "Non-overlapping Intervals", a: `Greedy: sort by END time; keep the interval that ends earliest, remove the rest.

~~~
def eraseOverlapIntervals(intervals):
    intervals.sort(key=lambda x: x[1])
    count, end = 0, float('-inf')
    for s, e in intervals:
        if s >= end:
            end = e
        else:
            count += 1
    return count
~~~
Time O(n log n) | Space O(1)` },

  { q: "Meeting Rooms", a: `Sort by start; any overlap means we can't attend all.

~~~
def canAttendMeetings(intervals):
    intervals.sort()
    for i in range(1, len(intervals)):
        if intervals[i][0] < intervals[i-1][1]:
            return False
    return True
~~~
Time O(n log n) | Space O(1)` },

  { q: "Meeting Rooms II", a: `Min-heap of end times. For each meeting, free a room if one ended; push its end. Heap size = rooms needed.

~~~
import heapq

def minMeetingRooms(intervals):
    intervals.sort()
    heap = []
    for s, e in intervals:
        if heap and heap[0] <= s:
            heapq.heappop(heap)
        heapq.heappush(heap, e)
    return len(heap)
~~~
Time O(n log n) | Space O(n)` },

  { q: "Rotate Array", a: `Reverse the whole array, then reverse the first k and last n-k.

~~~
def rotate(nums, k):
    n = len(nums)
    k %= n
    def reverse(l, r):
        while l < r:
            nums[l], nums[r] = nums[r], nums[l]
            l += 1; r -= 1
    reverse(0, n - 1)
    reverse(0, k - 1)
    reverse(k, n - 1)
~~~
Time O(n) | Space O(1)` },

  { q: "Move Zeroes", a: `Two pointers — write index w only advances when current is non-zero. Swap to push zeros to the end.

~~~
def moveZeroes(nums):
    w = 0
    for i in range(len(nums)):
        if nums[i] != 0:
            nums[w], nums[i] = nums[i], nums[w]
            w += 1
~~~
Time O(n) | Space O(1)` },

  { q: "Sort Colors (Dutch flag)", a: `Three pointers: l (next 0 slot), r (next 2 slot), m (scanner). Swap 0s left, 2s right.

~~~
def sortColors(nums):
    l, m, r = 0, 0, len(nums) - 1
    while m <= r:
        if nums[m] == 0:
            nums[l], nums[m] = nums[m], nums[l]
            l += 1; m += 1
        elif nums[m] == 2:
            nums[m], nums[r] = nums[r], nums[m]
            r -= 1
        else:
            m += 1
~~~
Time O(n) | Space O(1)` },

  { q: "Container With Most Water", a: `Two pointers from both ends; always move the shorter side inward.

~~~
def maxArea(height):
    l, r, best = 0, len(height) - 1, 0
    while l < r:
        best = max(best, (r - l) * min(height[l], height[r]))
        if height[l] < height[r]: l += 1
        else: r -= 1
    return best
~~~
Time O(n) | Space O(1)` },

  { q: "Trapping Rain Water", a: `Two pointers tracking left max and right max. Water at a side = max - height at that side.

~~~
def trap(height):
    l, r = 0, len(height) - 1
    lmax = rmax = res = 0
    while l < r:
        if height[l] < height[r]:
            lmax = max(lmax, height[l])
            res += lmax - height[l]
            l += 1
        else:
            rmax = max(rmax, height[r])
            res += rmax - height[r]
            r -= 1
    return res
~~~
Time O(n) | Space O(1)` },

  { q: "Longest Consecutive Sequence", a: `Use a set. Only start counting from a number whose predecessor isn't in the set — avoids redundant walks.

~~~
def longestConsecutive(nums):
    nums = set(nums)
    best = 0
    for n in nums:
        if n - 1 not in nums:
            cur, length = n, 1
            while cur + 1 in nums:
                cur += 1; length += 1
            best = max(best, length)
    return best
~~~
Time O(n) | Space O(n)` },

  { q: "Subarray Sum Equals K", a: `Prefix sums + hash map: count[prefix - k] gives how many subarrays ending here sum to k.

~~~
from collections import defaultdict

def subarraySum(nums, k):
    counts = defaultdict(int)
    counts[0] = 1
    total = res = 0
    for n in nums:
        total += n
        res += counts[total - k]
        counts[total] += 1
    return res
~~~
Time O(n) | Space O(n)` },

  { q: "Continuous Subarray Sum (multiple of k)", a: `Track (prefix sum % k) -> first index. Same remainder appearing later with gap ≥ 2 means subarray sum is divisible by k.

~~~
def checkSubarraySum(nums, k):
    seen = {0: -1}
    total = 0
    for i, n in enumerate(nums):
        total += n
        r = total % k
        if r in seen:
            if i - seen[r] >= 2:
                return True
        else:
            seen[r] = i
    return False
~~~
Time O(n) | Space O(min(n, k))` },

  { q: "Longest Substring Without Repeating Characters", a: `Sliding window. Move left to (last index of dup) + 1 when we hit a repeat.

~~~
def lengthOfLongestSubstring(s):
    seen = {}
    l = best = 0
    for r, c in enumerate(s):
        if c in seen and seen[c] >= l:
            l = seen[c] + 1
        seen[c] = r
        best = max(best, r - l + 1)
    return best
~~~
Time O(n) | Space O(min(n, alphabet))` },

  { q: "Longest Repeating Character Replacement", a: `Sliding window. If (window size - most-frequent char count) > k, shrink left.

~~~
from collections import defaultdict

def characterReplacement(s, k):
    count = defaultdict(int)
    l = max_freq = best = 0
    for r in range(len(s)):
        count[s[r]] += 1
        max_freq = max(max_freq, count[s[r]])
        if (r - l + 1) - max_freq > k:
            count[s[l]] -= 1
            l += 1
        best = max(best, r - l + 1)
    return best
~~~
Time O(n) | Space O(26)` },

  { q: "Minimum Window Substring", a: `Sliding window with a "missing" counter. Expand right until valid, then contract left to shrink the window.

~~~
from collections import Counter

def minWindow(s, t):
    if not t or not s: return ""
    need = Counter(t)
    missing = len(t)
    l = start = end = 0
    for r, c in enumerate(s, 1):
        if need[c] > 0: missing -= 1
        need[c] -= 1
        if missing == 0:
            while l < r and need[s[l]] < 0:
                need[s[l]] += 1
                l += 1
            if end == 0 or r - l < end - start:
                start, end = l, r
            need[s[l]] += 1
            missing += 1
            l += 1
    return s[start:end]
~~~
Time O(|s| + |t|) | Space O(|t|)` },

  { q: "Find All Anagrams in a String", a: `Sliding window of size len(p) over s; compare counters as we slide.

~~~
from collections import Counter

def findAnagrams(s, p):
    if len(s) < len(p): return []
    pc = Counter(p)
    sc = Counter(s[:len(p)])
    res = []
    for i in range(len(s) - len(p) + 1):
        if sc == pc:
            res.append(i)
        if i + len(p) < len(s):
            sc[s[i + len(p)]] += 1
            sc[s[i]] -= 1
            if sc[s[i]] == 0:
                del sc[s[i]]
    return res
~~~
Time O(n) | Space O(1)` },

  { q: "Permutation in String", a: `A permutation of s1 inside s2 is a window in s2 whose char counts match s1's.

~~~
from collections import Counter

def checkInclusion(s1, s2):
    if len(s1) > len(s2): return False
    need = Counter(s1)
    window = Counter(s2[:len(s1)])
    if need == window: return True
    for i in range(len(s1), len(s2)):
        window[s2[i]] += 1
        out = s2[i - len(s1)]
        window[out] -= 1
        if window[out] == 0: del window[out]
        if window == need: return True
    return False
~~~
Time O(n) | Space O(1)` },

  { q: "Valid Palindrome", a: `Two pointers, skip non-alphanumerics, compare lowercased.

~~~
def isPalindrome(s):
    l, r = 0, len(s) - 1
    while l < r:
        while l < r and not s[l].isalnum(): l += 1
        while l < r and not s[r].isalnum(): r -= 1
        if s[l].lower() != s[r].lower():
            return False
        l += 1; r -= 1
    return True
~~~
Time O(n) | Space O(1)` },

  { q: "Valid Palindrome II (allow one deletion)", a: `On a mismatch, try skipping one side OR the other and re-check.

~~~
def validPalindrome(s):
    def check(l, r):
        while l < r:
            if s[l] != s[r]: return False
            l += 1; r -= 1
        return True
    l, r = 0, len(s) - 1
    while l < r:
        if s[l] != s[r]:
            return check(l + 1, r) or check(l, r - 1)
        l += 1; r -= 1
    return True
~~~
Time O(n) | Space O(1)` },

  { q: "Reverse String", a: `In-place two-pointer swap.

~~~
def reverseString(s):
    l, r = 0, len(s) - 1
    while l < r:
        s[l], s[r] = s[r], s[l]
        l += 1; r -= 1
~~~
Time O(n) | Space O(1)` },

  { q: "Reverse Words in a String", a: `Split on whitespace (collapses runs), reverse, join.

~~~
def reverseWords(s):
    return ' '.join(reversed(s.split()))
~~~
Time O(n) | Space O(n)` },

  { q: "String Compression", a: `Walk groups of repeated chars. Write the char, then digits of count if > 1.

~~~
def compress(chars):
    w = i = 0
    while i < len(chars):
        j = i
        while j < len(chars) and chars[j] == chars[i]:
            j += 1
        chars[w] = chars[i]; w += 1
        if j - i > 1:
            for c in str(j - i):
                chars[w] = c; w += 1
        i = j
    return w
~~~
Time O(n) | Space O(1)` },

  { q: "Encode and Decode Strings", a: `Prefix each string with its length and a delimiter so decoding is unambiguous.

~~~
class Codec:
    def encode(self, strs):
        return ''.join(f'{len(s)}#{s}' for s in strs)

    def decode(self, s):
        res, i = [], 0
        while i < len(s):
            j = s.find('#', i)
            length = int(s[i:j])
            res.append(s[j+1:j+1+length])
            i = j + 1 + length
        return res
~~~
Time O(n) | Space O(n)` },

  { q: "Zigzag Conversion", a: `Distribute characters into row buckets, bouncing direction at top/bottom rows.

~~~
def convert(s, numRows):
    if numRows == 1 or numRows >= len(s): return s
    rows = [[] for _ in range(numRows)]
    cur, step = 0, 1
    for c in s:
        rows[cur].append(c)
        if cur == 0: step = 1
        elif cur == numRows - 1: step = -1
        cur += step
    return ''.join(''.join(r) for r in rows)
~~~
Time O(n) | Space O(n)` },

  { q: "Roman to Integer", a: `Add each value, but subtract if next symbol is larger (e.g., IV = 4).

~~~
def romanToInt(s):
    m = {'I':1,'V':5,'X':10,'L':50,'C':100,'D':500,'M':1000}
    res = 0
    for i, c in enumerate(s):
        if i + 1 < len(s) and m[c] < m[s[i+1]]:
            res -= m[c]
        else:
            res += m[c]
    return res
~~~
Time O(n) | Space O(1)` },

  { q: "Integer to Roman", a: `Greedy substitution from largest value down — includes subtractive pairs (CM, CD, XC, etc.).

~~~
def intToRoman(num):
    vals = [(1000,'M'),(900,'CM'),(500,'D'),(400,'CD'),
            (100,'C'),(90,'XC'),(50,'L'),(40,'XL'),
            (10,'X'),(9,'IX'),(5,'V'),(4,'IV'),(1,'I')]
    out = []
    for v, r in vals:
        while num >= v:
            out.append(r); num -= v
    return ''.join(out)
~~~
Time O(1) | Space O(1)` },

  { q: "Implement strStr() (Find Substring)", a: `Try each starting position, compare needle length characters.

~~~
def strStr(haystack, needle):
    if not needle: return 0
    n, m = len(haystack), len(needle)
    for i in range(n - m + 1):
        if haystack[i:i+m] == needle:
            return i
    return -1
~~~
Time O((n-m+1) · m) | Space O(1) — KMP makes this O(n+m).` },

  { q: "KMP Pattern Matching", a: `Build LPS (longest proper prefix-suffix) array, then scan text without ever moving backward.

~~~
def kmp(text, pattern):
    if not pattern: return 0
    lps = [0] * len(pattern)
    k = 0
    for i in range(1, len(pattern)):
        while k > 0 and pattern[k] != pattern[i]:
            k = lps[k-1]
        if pattern[k] == pattern[i]:
            k += 1
        lps[i] = k
    j = 0
    for i, c in enumerate(text):
        while j > 0 and pattern[j] != c:
            j = lps[j-1]
        if pattern[j] == c:
            j += 1
        if j == len(pattern):
            return i - j + 1
    return -1
~~~
Time O(n + m) | Space O(m)` },

  { q: "Valid Parentheses", a: `Stack: push openers, pop and match on closers.

~~~
def isValid(s):
    stack = []
    pairs = {')': '(', ']': '[', '}': '{'}
    for c in s:
        if c in pairs:
            if not stack or stack.pop() != pairs[c]:
                return False
        else:
            stack.append(c)
    return not stack
~~~
Time O(n) | Space O(n)` },

  { q: "Min Stack", a: `Parallel stack of running minimums — top is always current min.

~~~
class MinStack:
    def __init__(self):
        self.stack = []
        self.mins = []

    def push(self, x):
        self.stack.append(x)
        self.mins.append(min(x, self.mins[-1]) if self.mins else x)

    def pop(self):
        self.stack.pop(); self.mins.pop()

    def top(self):
        return self.stack[-1]

    def getMin(self):
        return self.mins[-1]
~~~
Time O(1) per op | Space O(n)` },

  { q: "Evaluate Reverse Polish Notation", a: `Stack: push numbers, pop two and apply operator. Use int(a/b) for truncation toward zero.

~~~
def evalRPN(tokens):
    stack = []
    ops = {'+': lambda a,b: a+b, '-': lambda a,b: a-b,
           '*': lambda a,b: a*b, '/': lambda a,b: int(a/b)}
    for t in tokens:
        if t in ops:
            b, a = stack.pop(), stack.pop()
            stack.append(ops[t](a, b))
        else:
            stack.append(int(t))
    return stack[0]
~~~
Time O(n) | Space O(n)` },

  { q: "Daily Temperatures", a: `Monotonic decreasing stack of indices. Pop when current temperature exceeds the stack top.

~~~
def dailyTemperatures(T):
    res = [0] * len(T)
    stack = []
    for i, t in enumerate(T):
        while stack and T[stack[-1]] < t:
            j = stack.pop()
            res[j] = i - j
        stack.append(i)
    return res
~~~
Time O(n) | Space O(n)` },

  { q: "Next Greater Element I", a: `Precompute next-greater for nums2 with a monotonic stack, then look up for nums1.

~~~
def nextGreaterElement(nums1, nums2):
    nxt = {}
    stack = []
    for n in nums2:
        while stack and stack[-1] < n:
            nxt[stack.pop()] = n
        stack.append(n)
    return [nxt.get(x, -1) for x in nums1]
~~~
Time O(n + m) | Space O(n)` },

  { q: "Largest Rectangle in Histogram", a: `Monotonic increasing stack of indices. Pop while current bar is shorter; width = current i - new top - 1.

~~~
def largestRectangleArea(heights):
    stack = []
    best = 0
    heights.append(0)
    for i, h in enumerate(heights):
        while stack and heights[stack[-1]] >= h:
            j = stack.pop()
            w = i if not stack else i - stack[-1] - 1
            best = max(best, heights[j] * w)
        stack.append(i)
    heights.pop()
    return best
~~~
Time O(n) | Space O(n)` },

  { q: "Car Fleet", a: `Sort cars by position descending. Compute time to target; a car only forms a new fleet if its time exceeds the leading fleet's time.

~~~
def carFleet(target, position, speed):
    cars = sorted(zip(position, speed), reverse=True)
    fleets = 0
    cur = 0
    for p, s in cars:
        t = (target - p) / s
        if t > cur:
            cur = t
            fleets += 1
    return fleets
~~~
Time O(n log n) | Space O(n)` },

  { q: "Generate Parentheses", a: `Backtracking: add '(' if open < n, add ')' if close < open.

~~~
def generateParenthesis(n):
    res = []
    def back(s, op, cl):
        if len(s) == 2 * n:
            res.append(s); return
        if op < n: back(s + '(', op + 1, cl)
        if cl < op: back(s + ')', op, cl + 1)
    back('', 0, 0)
    return res
~~~
Time O(4ⁿ / √n) | Space O(n) per call stack` },

  { q: "Simplify Path", a: `Stack of directory names. ".." pops, "." and empty ignored, else push.

~~~
def simplifyPath(path):
    stack = []
    for part in path.split('/'):
        if part == '..':
            if stack: stack.pop()
        elif part and part != '.':
            stack.append(part)
    return '/' + '/'.join(stack)
~~~
Time O(n) | Space O(n)` },

  { q: "LRU Cache", a: `OrderedDict — move_to_end on access; popitem(last=False) evicts the least recently used.

~~~
from collections import OrderedDict

class LRUCache:
    def __init__(self, capacity):
        self.cap = capacity
        self.cache = OrderedDict()

    def get(self, key):
        if key not in self.cache: return -1
        self.cache.move_to_end(key)
        return self.cache[key]

    def put(self, key, value):
        if key in self.cache:
            self.cache.move_to_end(key)
        self.cache[key] = value
        if len(self.cache) > self.cap:
            self.cache.popitem(last=False)
~~~
Time O(1) per op | Space O(capacity)` },

  { q: "LFU Cache", a: `Hash maps: key→(value, freq); freq→OrderedDict of keys at that freq. Maintain min_freq for eviction.

~~~
from collections import defaultdict, OrderedDict

class LFUCache:
    def __init__(self, capacity):
        self.cap = capacity
        self.min_freq = 0
        self.keys = {}
        self.freqs = defaultdict(OrderedDict)

    def _bump(self, key):
        v, f = self.keys[key]
        del self.freqs[f][key]
        if not self.freqs[f]:
            del self.freqs[f]
            if self.min_freq == f: self.min_freq += 1
        self.freqs[f+1][key] = None
        self.keys[key] = (v, f+1)

    def get(self, key):
        if key not in self.keys: return -1
        self._bump(key)
        return self.keys[key][0]

    def put(self, key, value):
        if self.cap == 0: return
        if key in self.keys:
            self.keys[key] = (value, self.keys[key][1])
            self._bump(key); return
        if len(self.keys) >= self.cap:
            old, _ = self.freqs[self.min_freq].popitem(last=False)
            del self.keys[old]
        self.keys[key] = (value, 1)
        self.freqs[1][key] = None
        self.min_freq = 1
~~~
Time O(1) per op | Space O(capacity)` },

  { q: "Design HashMap", a: `Array of buckets; each bucket is a list of (key, value). Hash by modulo.

~~~
class MyHashMap:
    def __init__(self):
        self.size = 1000
        self.buckets = [[] for _ in range(self.size)]

    def _bucket(self, key):
        return self.buckets[key % self.size]

    def put(self, key, value):
        b = self._bucket(key)
        for i, (k, _) in enumerate(b):
            if k == key:
                b[i] = (key, value); return
        b.append((key, value))

    def get(self, key):
        for k, v in self._bucket(key):
            if k == key: return v
        return -1

    def remove(self, key):
        b = self._bucket(key)
        for i, (k, _) in enumerate(b):
            if k == key:
                b.pop(i); return
~~~
Time O(1) avg per op | Space O(n)` },

  { q: "Design Twitter", a: `Per-user tweet lists with timestamps; followee sets. Merge recent tweets with a heap.

~~~
from collections import defaultdict
import heapq

class Twitter:
    def __init__(self):
        self.time = 0
        self.tweets = defaultdict(list)
        self.follows = defaultdict(set)

    def postTweet(self, uid, tid):
        self.tweets[uid].append((self.time, tid))
        self.time += 1

    def getNewsFeed(self, uid):
        heap = []
        users = self.follows[uid] | {uid}
        for u in users:
            for t in self.tweets[u][-10:]:
                heapq.heappush(heap, t)
                if len(heap) > 10:
                    heapq.heappop(heap)
        return [t for _, t in sorted(heap, reverse=True)]

    def follow(self, f, fe):
        self.follows[f].add(fe)

    def unfollow(self, f, fe):
        self.follows[f].discard(fe)
~~~
Time getNewsFeed O(U log 10) | Space O(users + tweets)` },

  { q: "Implement Queue Using Stacks", a: `Two stacks: inbox for push, outbox for pop. Drain inbox to outbox when outbox is empty.

~~~
class MyQueue:
    def __init__(self):
        self.inb = []
        self.outb = []

    def push(self, x):
        self.inb.append(x)

    def pop(self):
        self._shift()
        return self.outb.pop()

    def peek(self):
        self._shift()
        return self.outb[-1]

    def empty(self):
        return not self.inb and not self.outb

    def _shift(self):
        if not self.outb:
            while self.inb:
                self.outb.append(self.inb.pop())
~~~
Time amortized O(1) per op | Space O(n)` },

  { q: "Implement Stack Using Queues", a: `On push, rotate the single queue so the new element ends up at the front.

~~~
from collections import deque

class MyStack:
    def __init__(self):
        self.q = deque()

    def push(self, x):
        self.q.append(x)
        for _ in range(len(self.q) - 1):
            self.q.append(self.q.popleft())

    def pop(self):
        return self.q.popleft()

    def top(self):
        return self.q[0]

    def empty(self):
        return not self.q
~~~
Time push O(n), pop/top O(1) | Space O(n)` },

  { q: "Reverse Linked List", a: `Iterative — flip next pointers as you go.

~~~
def reverseList(head):
    prev = None
    while head:
        head.next, prev, head = prev, head, head.next
    return prev
~~~
Time O(n) | Space O(1)` },

  { q: "Reverse Linked List II", a: `Walk to position left, then iteratively move each next node to the front of the sub-list.

~~~
def reverseBetween(head, left, right):
    dummy = ListNode(0, head)
    prev = dummy
    for _ in range(left - 1):
        prev = prev.next
    cur = prev.next
    for _ in range(right - left):
        nxt = cur.next
        cur.next = nxt.next
        nxt.next = prev.next
        prev.next = nxt
    return dummy.next
~~~
Time O(n) | Space O(1)` },

  { q: "Merge Two Sorted Lists", a: `Dummy head + tail pointer; splice smaller node each step.

~~~
def mergeTwoLists(l1, l2):
    dummy = tail = ListNode()
    while l1 and l2:
        if l1.val <= l2.val:
            tail.next, l1 = l1, l1.next
        else:
            tail.next, l2 = l2, l2.next
        tail = tail.next
    tail.next = l1 or l2
    return dummy.next
~~~
Time O(n + m) | Space O(1)` },

  { q: "Merge K Sorted Lists", a: `Min-heap by node value; pop, attach, push next.

~~~
import heapq

def mergeKLists(lists):
    heap = []
    for i, node in enumerate(lists):
        if node:
            heapq.heappush(heap, (node.val, i, node))
    dummy = tail = ListNode()
    while heap:
        _, i, node = heapq.heappop(heap)
        tail.next = node
        tail = node
        if node.next:
            heapq.heappush(heap, (node.next.val, i, node.next))
    return dummy.next
~~~
Time O(N log k) | Space O(k)` },

  { q: "Reorder List", a: `Find middle, reverse second half, then interleave the two halves.

~~~
def reorderList(head):
    slow = fast = head
    while fast and fast.next:
        slow = slow.next; fast = fast.next.next
    prev, cur = None, slow.next
    slow.next = None
    while cur:
        cur.next, prev, cur = prev, cur, cur.next
    first, second = head, prev
    while second:
        n1, n2 = first.next, second.next
        first.next = second
        second.next = n1
        first, second = n1, n2
~~~
Time O(n) | Space O(1)` },

  { q: "Remove Nth Node From End of List", a: `Two pointers — advance fast by n, then move both until fast reaches the end.

~~~
def removeNthFromEnd(head, n):
    dummy = ListNode(0, head)
    slow = fast = dummy
    for _ in range(n):
        fast = fast.next
    while fast.next:
        slow = slow.next
        fast = fast.next
    slow.next = slow.next.next
    return dummy.next
~~~
Time O(n) | Space O(1)` },

  { q: "Linked List Cycle", a: `Floyd's tortoise-and-hare; they meet if a cycle exists.

~~~
def hasCycle(head):
    slow = fast = head
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
        if slow == fast:
            return True
    return False
~~~
Time O(n) | Space O(1)` },

  { q: "Linked List Cycle II", a: `After tortoise/hare meet, move one pointer to head; both walk one step at a time until they meet at the cycle's entrance.

~~~
def detectCycle(head):
    slow = fast = head
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
        if slow == fast:
            entry = head
            while entry != slow:
                entry = entry.next
                slow = slow.next
            return entry
    return None
~~~
Time O(n) | Space O(1)` },

  { q: "Add Two Numbers", a: `Walk both lists, carry the overflow, build a new list of digits.

~~~
def addTwoNumbers(l1, l2):
    dummy = tail = ListNode()
    carry = 0
    while l1 or l2 or carry:
        s = (l1.val if l1 else 0) + (l2.val if l2 else 0) + carry
        carry, digit = divmod(s, 10)
        tail.next = ListNode(digit)
        tail = tail.next
        if l1: l1 = l1.next
        if l2: l2 = l2.next
    return dummy.next
~~~
Time O(max(n, m)) | Space O(max(n, m))` },

  { q: "Copy List With Random Pointer", a: `Interleave each node with its copy, set random on copies, then split.

~~~
def copyRandomList(head):
    if not head: return None
    cur = head
    while cur:
        cur.next = Node(cur.val, cur.next)
        cur = cur.next.next
    cur = head
    while cur:
        if cur.random:
            cur.next.random = cur.random.next
        cur = cur.next.next
    new_head = head.next
    cur = head
    while cur:
        copy = cur.next
        cur.next = copy.next
        copy.next = copy.next.next if copy.next else None
        cur = cur.next
    return new_head
~~~
Time O(n) | Space O(1) extra` },

  { q: "Intersection of Two Linked Lists", a: `Two pointers switching to the other list's head when they reach null. They meet at the intersection (or both null).

~~~
def getIntersectionNode(a, b):
    pa, pb = a, b
    while pa != pb:
        pa = pa.next if pa else b
        pb = pb.next if pb else a
    return pa
~~~
Time O(n + m) | Space O(1)` },

  { q: "Palindrome Linked List", a: `Find middle, reverse second half in place, then compare two halves.

~~~
def isPalindrome(head):
    slow = fast = head
    while fast and fast.next:
        slow = slow.next; fast = fast.next.next
    prev, cur = None, slow
    while cur:
        cur.next, prev, cur = prev, cur, cur.next
    l, r = head, prev
    while r:
        if l.val != r.val: return False
        l = l.next; r = r.next
    return True
~~~
Time O(n) | Space O(1)` },

  { q: "Rotate List", a: `Find length, connect tail to head (cycle), break at the new tail (length - k - 1) steps from head.

~~~
def rotateRight(head, k):
    if not head or not head.next: return head
    length, tail = 1, head
    while tail.next:
        tail = tail.next; length += 1
    k %= length
    if k == 0: return head
    new_tail = head
    for _ in range(length - k - 1):
        new_tail = new_tail.next
    new_head = new_tail.next
    new_tail.next = None
    tail.next = head
    return new_head
~~~
Time O(n) | Space O(1)` },

  { q: "Swap Nodes in Pairs", a: `Dummy + prev pointer; for each pair, rewire prev → b → a → next.

~~~
def swapPairs(head):
    dummy = prev = ListNode(0, head)
    while prev.next and prev.next.next:
        a, b = prev.next, prev.next.next
        a.next = b.next
        b.next = a
        prev.next = b
        prev = a
    return dummy.next
~~~
Time O(n) | Space O(1)` },

  { q: "Binary Tree Inorder Traversal", a: `Iterative with a stack — push lefts, pop and visit, then go right.

~~~
def inorderTraversal(root):
    res, stack = [], []
    cur = root
    while cur or stack:
        while cur:
            stack.append(cur)
            cur = cur.left
        cur = stack.pop()
        res.append(cur.val)
        cur = cur.right
    return res
~~~
Time O(n) | Space O(h)` },

  { q: "Binary Tree Preorder Traversal", a: `Iterative stack — push right first so left is visited next.

~~~
def preorderTraversal(root):
    res, stack = [], [root] if root else []
    while stack:
        node = stack.pop()
        res.append(node.val)
        if node.right: stack.append(node.right)
        if node.left: stack.append(node.left)
    return res
~~~
Time O(n) | Space O(h)` },

  { q: "Binary Tree Postorder Traversal", a: `Track last-visited so you know when to pop versus descend right.

~~~
def postorderTraversal(root):
    res, stack = [], []
    cur, last = root, None
    while cur or stack:
        while cur:
            stack.append(cur); cur = cur.left
        peek = stack[-1]
        if peek.right and peek.right != last:
            cur = peek.right
        else:
            res.append(peek.val)
            last = stack.pop()
    return res
~~~
Time O(n) | Space O(h)` },

  { q: "Binary Tree Level Order Traversal", a: `BFS with a queue; process one level at a time using the queue size.

~~~
from collections import deque

def levelOrder(root):
    if not root: return []
    res, q = [], deque([root])
    while q:
        level = []
        for _ in range(len(q)):
            node = q.popleft()
            level.append(node.val)
            if node.left: q.append(node.left)
            if node.right: q.append(node.right)
        res.append(level)
    return res
~~~
Time O(n) | Space O(n)` },

  { q: "Maximum Depth of Binary Tree", a: `Recursion — depth = 1 + max(left depth, right depth).

~~~
def maxDepth(root):
    if not root: return 0
    return 1 + max(maxDepth(root.left), maxDepth(root.right))
~~~
Time O(n) | Space O(h)` },

  { q: "Diameter of Binary Tree", a: `DFS returning height; at each node, candidate diameter = left height + right height.

~~~
def diameterOfBinaryTree(root):
    best = 0
    def depth(node):
        nonlocal best
        if not node: return 0
        l, r = depth(node.left), depth(node.right)
        best = max(best, l + r)
        return 1 + max(l, r)
    depth(root)
    return best
~~~
Time O(n) | Space O(h)` },

  { q: "Balanced Binary Tree", a: `Return -1 to short-circuit when imbalance found; otherwise return depth.

~~~
def isBalanced(root):
    def check(node):
        if not node: return 0
        l = check(node.left)
        if l == -1: return -1
        r = check(node.right)
        if r == -1 or abs(l - r) > 1: return -1
        return 1 + max(l, r)
    return check(root) != -1
~~~
Time O(n) | Space O(h)` },

  { q: "Same Tree", a: `Both null → True. One null or value differs → False. Else compare both subtrees.

~~~
def isSameTree(p, q):
    if not p and not q: return True
    if not p or not q or p.val != q.val: return False
    return isSameTree(p.left, q.left) and isSameTree(p.right, q.right)
~~~
Time O(n) | Space O(h)` },

  { q: "Symmetric Tree", a: `Compare left subtree to right subtree's mirror.

~~~
def isSymmetric(root):
    def mirror(a, b):
        if not a and not b: return True
        if not a or not b or a.val != b.val: return False
        return mirror(a.left, b.right) and mirror(a.right, b.left)
    return mirror(root.left, root.right) if root else True
~~~
Time O(n) | Space O(h)` },

  { q: "Invert Binary Tree", a: `Recursively swap each node's children.

~~~
def invertTree(root):
    if not root: return None
    root.left, root.right = invertTree(root.right), invertTree(root.left)
    return root
~~~
Time O(n) | Space O(h)` },

  { q: "Path Sum", a: `DFS subtracting node values; leaf with remaining target == leaf.val means success.

~~~
def hasPathSum(root, target):
    if not root: return False
    if not root.left and not root.right:
        return target == root.val
    return (hasPathSum(root.left, target - root.val) or
            hasPathSum(root.right, target - root.val))
~~~
Time O(n) | Space O(h)` },

  { q: "Binary Tree Maximum Path Sum", a: `DFS returns max gain through a node going down only one side; update global with both sides.

~~~
def maxPathSum(root):
    best = float('-inf')
    def gain(node):
        nonlocal best
        if not node: return 0
        l = max(0, gain(node.left))
        r = max(0, gain(node.right))
        best = max(best, node.val + l + r)
        return node.val + max(l, r)
    gain(root)
    return best
~~~
Time O(n) | Space O(h)` },

  { q: "Lowest Common Ancestor of a Binary Tree", a: `If both sides return non-null, current root is the LCA; else propagate the non-null side up.

~~~
def lowestCommonAncestor(root, p, q):
    if not root or root == p or root == q: return root
    l = lowestCommonAncestor(root.left, p, q)
    r = lowestCommonAncestor(root.right, p, q)
    return root if l and r else (l or r)
~~~
Time O(n) | Space O(h)` },

  { q: "Validate Binary Search Tree", a: `Pass an allowed (lo, hi) range; each node's value must lie strictly inside.

~~~
def isValidBST(root):
    def check(node, lo, hi):
        if not node: return True
        if not (lo < node.val < hi): return False
        return (check(node.left, lo, node.val) and
                check(node.right, node.val, hi))
    return check(root, float('-inf'), float('inf'))
~~~
Time O(n) | Space O(h)` },

  { q: "Kth Smallest Element in a BST", a: `Iterative in-order traversal — the k-th popped node is the answer.

~~~
def kthSmallest(root, k):
    stack = []
    cur = root
    while cur or stack:
        while cur:
            stack.append(cur); cur = cur.left
        cur = stack.pop()
        k -= 1
        if k == 0: return cur.val
        cur = cur.right
~~~
Time O(h + k) | Space O(h)` },

  { q: "Serialize and Deserialize Binary Tree", a: `Preorder with '#' for null; iterator while rebuilding.

~~~
class Codec:
    def serialize(self, root):
        vals = []
        def dfs(node):
            if not node:
                vals.append('#'); return
            vals.append(str(node.val))
            dfs(node.left); dfs(node.right)
        dfs(root)
        return ','.join(vals)

    def deserialize(self, data):
        vals = iter(data.split(','))
        def build():
            v = next(vals)
            if v == '#': return None
            node = TreeNode(int(v))
            node.left = build()
            node.right = build()
            return node
        return build()
~~~
Time O(n) | Space O(n)` },

  { q: "Construct Binary Tree from Preorder and Inorder Traversal", a: `Use preorder iterator for the next root; inorder index tells you the left/right split.

~~~
def buildTree(preorder, inorder):
    idx = {v: i for i, v in enumerate(inorder)}
    pre = iter(preorder)
    def build(lo, hi):
        if lo > hi: return None
        val = next(pre)
        node = TreeNode(val)
        mid = idx[val]
        node.left = build(lo, mid - 1)
        node.right = build(mid + 1, hi)
        return node
    return build(0, len(inorder) - 1)
~~~
Time O(n) | Space O(n)` },

  { q: "Number of Islands", a: `DFS or BFS — for each unvisited land cell, flood-fill and count.

~~~
def numIslands(grid):
    if not grid: return 0
    R, C = len(grid), len(grid[0])
    def dfs(r, c):
        if (r < 0 or r >= R or c < 0 or c >= C
                or grid[r][c] != '1'):
            return
        grid[r][c] = '0'
        for dr, dc in ((1,0),(-1,0),(0,1),(0,-1)):
            dfs(r + dr, c + dc)
    count = 0
    for r in range(R):
        for c in range(C):
            if grid[r][c] == '1':
                count += 1
                dfs(r, c)
    return count
~~~
Time O(R · C) | Space O(R · C)` },

  { q: "Clone Graph", a: `DFS or BFS with a hash map from original to clone.

~~~
def cloneGraph(node):
    if not node: return None
    clones = {}
    def dfs(n):
        if n in clones: return clones[n]
        copy = Node(n.val)
        clones[n] = copy
        for nb in n.neighbors:
            copy.neighbors.append(dfs(nb))
        return copy
    return dfs(node)
~~~
Time O(V + E) | Space O(V)` },

  { q: "Course Schedule", a: `DFS with three states (unvisited / visiting / done) detects cycles. Cycle ⇒ impossible.

~~~
from collections import defaultdict

def canFinish(n, prereqs):
    g = defaultdict(list)
    for a, b in prereqs:
        g[a].append(b)
    UNVIS, ING, DONE = 0, 1, 2
    state = [UNVIS] * n
    def dfs(u):
        if state[u] == ING: return False
        if state[u] == DONE: return True
        state[u] = ING
        for v in g[u]:
            if not dfs(v): return False
        state[u] = DONE
        return True
    return all(dfs(i) for i in range(n))
~~~
Time O(V + E) | Space O(V + E)` },

  { q: "Course Schedule II", a: `Kahn's algorithm — BFS over nodes with in-degree 0; order they pop is a valid topo sort.

~~~
from collections import defaultdict, deque

def findOrder(n, prereqs):
    g = defaultdict(list)
    indeg = [0] * n
    for a, b in prereqs:
        g[b].append(a)
        indeg[a] += 1
    q = deque(i for i in range(n) if indeg[i] == 0)
    order = []
    while q:
        u = q.popleft()
        order.append(u)
        for v in g[u]:
            indeg[v] -= 1
            if indeg[v] == 0:
                q.append(v)
    return order if len(order) == n else []
~~~
Time O(V + E) | Space O(V + E)` },

  { q: "Pacific Atlantic Water Flow", a: `DFS from BOTH oceans inward (water flows uphill in reverse). Cells reachable from both are the answer.

~~~
def pacificAtlantic(heights):
    if not heights: return []
    R, C = len(heights), len(heights[0])
    pac, atl = set(), set()
    def dfs(r, c, seen):
        seen.add((r, c))
        for dr, dc in ((1,0),(-1,0),(0,1),(0,-1)):
            nr, nc = r + dr, c + dc
            if (0 <= nr < R and 0 <= nc < C and
                (nr, nc) not in seen and
                heights[nr][nc] >= heights[r][c]):
                dfs(nr, nc, seen)
    for r in range(R):
        dfs(r, 0, pac)
        dfs(r, C - 1, atl)
    for c in range(C):
        dfs(0, c, pac)
        dfs(R - 1, c, atl)
    return [list(rc) for rc in pac & atl]
~~~
Time O(R · C) | Space O(R · C)` },

  { q: "Rotting Oranges", a: `Multi-source BFS from all rotten oranges; track time and remaining fresh.

~~~
from collections import deque

def orangesRotting(grid):
    R, C = len(grid), len(grid[0])
    q = deque()
    fresh = 0
    for r in range(R):
        for c in range(C):
            if grid[r][c] == 2: q.append((r, c, 0))
            elif grid[r][c] == 1: fresh += 1
    minutes = 0
    while q:
        r, c, t = q.popleft()
        minutes = t
        for dr, dc in ((1,0),(-1,0),(0,1),(0,-1)):
            nr, nc = r + dr, c + dc
            if 0 <= nr < R and 0 <= nc < C and grid[nr][nc] == 1:
                grid[nr][nc] = 2
                fresh -= 1
                q.append((nr, nc, t + 1))
    return minutes if fresh == 0 else -1
~~~
Time O(R · C) | Space O(R · C)` },

  { q: "Word Ladder", a: `BFS over the word graph — each step changes one letter; first time you reach end gives shortest path.

~~~
from collections import deque

def ladderLength(begin, end, wordList):
    words = set(wordList)
    if end not in words: return 0
    q = deque([(begin, 1)])
    seen = {begin}
    while q:
        word, steps = q.popleft()
        if word == end: return steps
        for i in range(len(word)):
            for c in 'abcdefghijklmnopqrstuvwxyz':
                nw = word[:i] + c + word[i+1:]
                if nw in words and nw not in seen:
                    seen.add(nw)
                    q.append((nw, steps + 1))
    return 0
~~~
Time O(L² · N) | Space O(L · N)` },

  { q: "Graph Valid Tree", a: `A tree on n nodes has exactly n-1 edges and is fully connected. Use Union-Find — cycle means not a tree.

~~~
def validTree(n, edges):
    if len(edges) != n - 1: return False
    parent = list(range(n))
    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x
    for a, b in edges:
        ra, rb = find(a), find(b)
        if ra == rb: return False
        parent[ra] = rb
    return True
~~~
Time O(E · α(N)) | Space O(N)` },

  { q: "Network Delay Time", a: `Dijkstra from source k. Answer is max distance (or -1 if any node unreachable).

~~~
import heapq
from collections import defaultdict

def networkDelayTime(times, n, k):
    g = defaultdict(list)
    for u, v, w in times:
        g[u].append((v, w))
    dist = {}
    heap = [(0, k)]
    while heap:
        d, u = heapq.heappop(heap)
        if u in dist: continue
        dist[u] = d
        for v, w in g[u]:
            if v not in dist:
                heapq.heappush(heap, (d + w, v))
    return max(dist.values()) if len(dist) == n else -1
~~~
Time O((V + E) log V) | Space O(V + E)` },

  { q: "Dijkstra's Algorithm (template)", a: `Min-heap of (distance, node). Pop minimum, relax neighbors. Skip stale entries.

~~~
import heapq

def dijkstra(graph, start):
    dist = {start: 0}
    heap = [(0, start)]
    while heap:
        d, u = heapq.heappop(heap)
        if d > dist.get(u, float('inf')): continue
        for v, w in graph[u]:
            nd = d + w
            if nd < dist.get(v, float('inf')):
                dist[v] = nd
                heapq.heappush(heap, (nd, v))
    return dist
~~~
Time O((V + E) log V) | Space O(V)` },

  { q: "Coin Change", a: `1D DP — dp[a] = min coins to make a. Try every coin.

~~~
def coinChange(coins, amount):
    INF = float('inf')
    dp = [0] + [INF] * amount
    for a in range(1, amount + 1):
        for c in coins:
            if c <= a:
                dp[a] = min(dp[a], dp[a - c] + 1)
    return dp[amount] if dp[amount] != INF else -1
~~~
Time O(amount · len(coins)) | Space O(amount)` },

  { q: "Longest Increasing Subsequence", a: `Patience sorting: tails[i] = smallest tail of an increasing subsequence of length i+1. Binary-search the insertion point.

~~~
from bisect import bisect_left

def lengthOfLIS(nums):
    tails = []
    for n in nums:
        i = bisect_left(tails, n)
        if i == len(tails):
            tails.append(n)
        else:
            tails[i] = n
    return len(tails)
~~~
Time O(n log n) | Space O(n)` }
];
