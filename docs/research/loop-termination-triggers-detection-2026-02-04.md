# Loop Termination Triggers and Detection Mechanisms - Research Report
**Research Date:** 2026-02-04
**Context:** Designing system to detect when loops should terminate in AI agent workflows

---

## 1. TERMINATION TRIGGER TYPES

### 1.1 Success-Based Triggers

**Definition:** Loop terminates when a specific goal or objective is achieved.

**Detection Methods:**
- **Goal-state matching**: Check if current state equals target state
- **Success signals**: Tools/functions return explicit `SUCCESS`, `COMPLETE`, or `DONE` status
- **Threshold satisfaction**: Metric reaches or exceeds target threshold (e.g., accuracy > 0.95)

**Implementation Pattern:**
```python
if check_goal_state(current_state) == target_state:
    terminate("Goal achieved")
elif function_result.status in ["SUCCESS", "COMPLETE"]:
    terminate("Explicit success signal received")
```

**Real-World Examples:**
- Gradient descent reaching loss < ε (convergence)
- Model training achieving accuracy target
- Agent completing all tasks in workflow

---

### 1.2 Failure-Based Triggers

**Definition:** Loop terminates when maximum attempts or retries are exhausted without success.

**Detection Methods:**
- **Iteration counter**: Track loop iterations, terminate when `iterations >= max_iterations`
- **Attempt counter**: Track specific operation attempts, terminate when `attempts >= max_attempts`
- **Failure streak detection**: Track consecutive failures, terminate when streak exceeds threshold

**Implementation Pattern:**
```python
max_attempts = 5
attempt_count = 0

while attempt_count < max_attempts:
    try:
        result = attempt_operation()
        if result.success:
            break  # Success, exit normally
        else:
            attempt_count += 1
    except Exception:
        attempt_count += 1

if attempt_count >= max_attempts:
    terminate("Max attempts reached", escalate=True)
```

**Real-World Examples:**
- Database connection retry policies (typical: 3-5 attempts)
- API retry mechanisms (HTTP 5xx errors)
- Network request retry with backoff

---

### 1.3 Timeout-Based Triggers

**Definition:** Loop terminates when time limit is exceeded.

**Detection Methods:**
- **Absolute timeout**: `elapsed_time > max_duration`
- **Per-iteration timeout**: `iteration_duration > max_iteration_time`
- **Soft timeout**: Warn at `elapsed > warning_time`, terminate at `elapsed > hard_timeout`

**Implementation Pattern:**
```python
import time

start_time = time.time()
max_duration = 300  # 5 minutes

while time.time() - start_time < max_duration:
    perform_iteration()
    # Optional: soft timeout warning
    if time.time() - start_time > max_duration * 0.8:
        log_warning("Approaching timeout")

terminate("Timeout exceeded")
```

**Timeout Recommendations by Query Type:**
| Query Type | Recommended Timeout | Use Case |
|-------------|---------------------|-----------|
| UI/Dashboard | 10 seconds | Interactive feedback |
| Generic Default | 60 seconds | Application APIs |
| Mixed Workload | 2 minutes | Development/testing |
| Analytical/Background | 5 minutes | Reports, ETL, batch processing |

**Real-World Examples:**
- Database query timeouts (SQL Server optimizer timeout)
- HTTP request timeouts
- Docker container health check timeouts

---

### 1.4 Convergence-Based Triggers

**Definition:** Loop terminates when changes become minimal (system stabilizes).

**Detection Methods:**

#### 1.4.1 Gradient-Based Convergence
**Metric:** Gradient norm < ε
```python
def check_gradient_convergence(gradient_norm, threshold=1e-5):
    return gradient_norm < threshold
```

**Theoretical Basis:** Gradient descent converges when ∇f(x_k) → 0. For Lipschitz-smooth functions with learning rate ε < 2/L, convergence is guaranteed.

#### 1.4.2 Loss-Based Convergence
**Metric:** Loss change over N iterations < ε
```python
def check_loss_convergence(loss_history, window=5, threshold=1e-6):
    if len(loss_history) < window + 1:
        return False
    recent_losses = loss_history[-window:]
    return max(recent_losses) - min(recent_losses) < threshold
```

#### 1.4.3 Parameter-Based Convergence
**Metric:** Parameter change < ε
```python
def check_parameter_convergence(theta_old, theta_new, threshold=1e-7):
    return np.linalg.norm(theta_new - theta_old) < threshold
```

**Real-World Examples:**
- ML model training (loss convergence)
- Gradient descent optimization
- Iterative algorithms (EM, coordinate descent)

---

### 1.5 Progress-Based Triggers

**Definition:** Loop terminates when no new progress is detected (stalled).

**Detection Methods:**

#### 1.5.1 Plateau Detection
**Statistical Methods:**

**Method 1: Standard Deviation-Based**
```python
import numpy as np

def detect_plateau_std(values, window_size=10, std_threshold=0.01):
    """Detect plateau when standard deviation falls below threshold"""
    if len(values) < window_size:
        return False
    recent_values = values[-window_size:]
    return np.std(recent_values) < std_threshold
```

**Method 2: Slope-Based (Using GAM Derivatives)**
```python
def detect_plateau_slope(values, window_size=5, slope_threshold=0.001):
    """Detect plateau when 1st derivative approaches zero"""
    if len(values) < window_size + 1:
        return False

    # Calculate simple moving average slopes
    slopes = []
    for i in range(len(values) - window_size):
        slope = (values[i + window_size] - values[i]) / window_size
        slopes.append(abs(slope))

    return np.mean(slopes[-window_size:]) < slope_threshold
```

**Method 3: Statistical Significance Test**
```python
from scipy import stats

def detect_plateau_statistical(values, window_before=10, window_after=5, alpha=0.05):
    """
    Detect plateau using two-sample t-test comparing windows
    Null hypothesis: Means are equal (no progress)
    """
    if len(values) < window_before + window_after:
        return False

    before = values[-window_before - window_after:-window_after]
    after = values[-window_after:]

    t_stat, p_value = stats.ttest_ind(before, after)
    return p_value > alpha  # Fail to reject null = plateau
```

#### 1.5.2 Diminishing Returns Detection

**Indicators:**
- Increasing cost per acquisition (CPA) with declining conversion rates
- Frequency caps being reached consistently
- Declining click-through rates (CTR)
- Reduced engagement metrics

**Detection Algorithm:**
```python
def detect_diminishing_returns(metrics_history, window=5):
    """
    metrics_history: list of dicts with keys: {cost, conversion, cpa, ctr}
    Returns: True if diminishing returns detected
    """
    if len(metrics_history) < window:
        return False

    recent = metrics_history[-window:]

    # Check for increasing CPA trend
    cpa_trend = calculate_trend([m['cpa'] for m in recent])
    # Check for declining conversion trend
    conv_trend = calculate_trend([m['conversion'] for m in recent])

    return cpa_trend > 0 and conv_trend < 0

def calculate_trend(values):
    """Simple linear regression slope"""
    x = np.arange(len(values))
    y = np.array(values)
    slope = np.polyfit(x, y, 1)[0]
    return slope
```

**Real-World Examples:**
- Marketing spend optimization
- LLM scaling (performance plateaus despite increased compute)
- Deep learning training curves

---

### 1.6 Resource-Based Triggers

**Definition:** Loop terminates when resource budget (compute, tokens, API calls) is exhausted.

**Detection Methods:**

#### 1.6.1 Budget Monitoring
```python
class BudgetMonitor:
    def __init__(self, token_budget, api_call_budget):
        self.tokens_used = 0
        self.api_calls = 0
        self.token_budget = token_budget
        self.api_call_budget = api_call_budget

    def check_budget(self, tokens_consumed=0):
        self.tokens_used += tokens_consumed
        self.api_calls += 1

        if self.tokens_used >= self.token_budget:
            raise BudgetExceeded("Token budget exceeded")

        if self.api_calls >= self.api_call_budget:
            raise BudgetExceeded("API call budget exceeded")

        # Warning at 80% utilization
        if self.tokens_used >= self.token_budget * 0.8:
            log_warning(f"Token budget at {self.tokens_used/self.token_budget:.0%}")

        return True
```

#### 1.6.2 Resource Exhaustion Indicators
- **Memory**: Allocated memory approaches system limit
- **Compute**: GPU/CPU utilization at 100% for extended periods
- **API quota**: Rate limit errors (429 Too Many Requests)
- **Storage**: Disk space near capacity

**Real-World Examples:**
- AWS EC2 instance resource limits
- API rate limiting (GitHub API, Twitter API)
- Kubernetes pod resource quotas

---

### 1.7 User-Interrupt Triggers

**Definition:** Loop terminates on explicit user signal or manual halt.

**Detection Methods:**

#### 1.7.1 Signal-Based Interrupt
```python
import signal
import sys

class InterruptHandler:
    def __init__(self):
        self.interrupted = False
        signal.signal(signal.SIGINT, self.handle_interrupt)
        signal.signal(signal.SIGTERM, self.handle_interrupt)

    def handle_interrupt(self, signum, frame):
        self.interrupted = True
        log_info("Interrupt signal received, shutting down...")

    def check_interrupt(self):
        return self.interrupted

# Usage in loop
interrupt_handler = InterruptHandler()
while not interrupt_handler.check_interrupt():
    perform_work()
```

#### 1.7.2 User Confirmation-Based Interrupt
```python
def check_user_confirmation(prompt="Continue? [y/N]"):
    """Check for user interrupt via prompt"""
    try:
        response = input(prompt).strip().lower()
        return response == 'y'
    except (EOFError, KeyboardInterrupt):
        return False

# Usage in loop
while check_user_confirmation("Continue iteration?"):
    perform_iteration()
```

**Real-World Examples:**
- Ctrl+C signal handling in CLI tools
- UI cancel buttons
- Interactive debugger stop commands

---

### 1.8 State-Based Triggers

**Definition:** Loop terminates when specific state or condition is met.

**Detection Methods:**

#### 1.8.1 State Machine Termination
```python
class StateMachine:
    def __init__(self):
        self.state = 'INIT'

    def transition(self, event):
        transitions = {
            'INIT': {'start': 'RUNNING', 'error': 'ERROR'},
            'RUNNING': {'complete': 'SUCCESS', 'error': 'ERROR', 'timeout': 'TIMEOUT'},
            'ERROR': {'retry': 'RUNNING', 'abort': 'TERMINATED'},
            'SUCCESS': {},  # Terminal state
            'TIMEOUT': {},  # Terminal state
            'TERMINATED': {}  # Terminal state
        }

        if event in transitions[self.state]:
            self.state = transitions[self.state][event]

    def is_terminal(self):
        return self.state in ['SUCCESS', 'TIMEOUT', 'TERMINATED']
```

**Real-World Examples:**
- Raft consensus leader election
- Database transaction states (begin, commit, rollback)
- Build pipeline states (pending, running, success, failure)

---

## 2. DETECTION MECHANISMS

### 2.1 Convergence Detection

#### 2.1.1 Gradient Descent Convergence Criteria

**Common Criteria:**

1. **Gradient Magnitude**
```python
if np.linalg.norm(gradient) < tolerance:
    return True  # Converged
```

2. **Change in Loss**
```python
if abs(loss_old - loss_new) < loss_tolerance:
    return True  # Converged
```

3. **Change in Parameters**
```python
if np.linalg.norm(theta_new - theta_old) < param_tolerance:
    return True  # Converged
```

4. **Plateau Detection (No Improvement for k iterations)**
```python
def plateau_detection(loss_history, patience=10):
    """Return True if loss hasn't improved for 'patience' iterations"""
    if len(loss_history) < patience + 1:
        return False

    best_loss = min(loss_history[:-patience])
    recent_losses = loss_history[-patience:]
    return all(l >= best_loss for l in recent_losses)
```

**Timing Requirements (Raft Consensus):**
```
broadcastTime ≪ electionTimeout ≪ MTBF
```
Where:
- `broadcastTime`: Time to send RPCs and receive responses (0.5ms - 20ms)
- `electionTimeout`: Typically 150-500ms
- `MTBF`: Mean time between failures

---

#### 2.1.2 Oscillation Detection

**Definition:** System cycles between states without converging.

**Detection Methods:**

**Method 1: State History Pattern Matching**
```python
def detect_oscillation(state_history, window=4):
    """
    Detect repeating pattern in state history
    e.g., [A, B, A, B, A, B] indicates 2-state oscillation
    """
    if len(state_history) < window * 2:
        return False

    recent = state_history[-window:]
    previous = state_history[-window*2:-window]

    return recent == previous  # Exact match = oscillation
```

**Method 2: Gradient Correlation (SGD)**
```python
def detect_gradient_oscillation(gradients, window=10, threshold=0.1):
    """
    Detect oscillation by measuring correlation between consecutive gradients
    High negative correlation indicates oscillation
    """
    if len(gradients) < window + 1:
        return False

    recent_grads = gradients[-window-1:]
    correlations = []

    for i in range(len(recent_grads) - 1):
        g1 = recent_grads[i].flatten()
        g2 = recent_grads[i+1].flatten()
        corr = np.corrcoef(g1, g2)[0, 1]
        correlations.append(corr)

    # Negative correlation average suggests oscillation
    return np.mean(correlations) < -threshold
```

**Method 3: Loss Variance**
```python
def detect_loss_oscillation(losses, window=5):
    """
    Detect oscillation by checking variance in recent losses
    High variance relative to mean suggests oscillation
    """
    if len(losses) < window:
        return False

    recent = losses[-window:]
    mean = np.mean(recent)
    variance = np.var(recent)

    # Coefficient of variation
    cv = np.sqrt(variance) / mean if mean > 0 else 0

    return cv > 0.5  # High variability = possible oscillation
```

**Oscillation Causes:**
- Learning rate too high in SGD
- Non-convex loss landscape (ravines)
- Conflicting objectives in multi-agent systems
- Race conditions in distributed systems

---

#### 2.1.3 Deadlock Detection

**Definition:** System is waiting for conditions that can never be satisfied.

**Detection Methods:**

**Wait-For Graph Analysis**
```python
class DeadlockDetector:
    def __init__(self):
        self.wait_for_graph = {}  # {process: [resources it's waiting for]}
        self.resource_owners = {}  # {resource: owner_process}

    def check_deadlock(self):
        """
        Detect cycle in wait-for graph (Tarjan's algorithm)
        Returns list of processes in deadlock
        """
        visited = set()
        rec_stack = set()
        cycles = []

        def dfs(node, path):
            if node in rec_stack:
                # Found cycle
                cycle_start = path.index(node)
                cycles.append(path[cycle_start:])
                return True

            if node in visited:
                return False

            visited.add(node)
            rec_stack.add(node)

            if node in self.wait_for_graph:
                for waited_resource in self.wait_for_graph[node]:
                    if waited_resource in self.resource_owners:
                        owner = self.resource_owners[waited_resource]
                        if dfs(owner, path + [node]):
                            return True

            rec_stack.remove(node)
            return False

        for process in self.wait_for_graph:
            dfs(process, [])

        return cycles
```

**Timeout-Based Detection (Practical Approach)**
```python
def detect_deadlock_timeout(processes, timeout_ms=5000):
    """
    Simple deadlock detection: processes waiting > timeout
    """
    deadlocked = []
    for process in processes:
        if process.is_waiting() and process.wait_time() > timeout_ms:
            deadlocked.append(process)
    return deadlocked
```

**Real-World Examples:**
- Database transaction deadlocks (wait-for graph)
- Thread synchronization deadlocks
- Distributed system resource contention

---

### 2.2 Progress Measurement

#### 2.2.1 Metrics for Different Loop Types

| Loop Type | Primary Metrics | Secondary Metrics |
|-----------|----------------|-------------------|
| **Optimization** | Loss/error value | Gradient norm, parameter delta |
| **Search/Exploration** | Solutions found | Search space covered, time elapsed |
| **Validation/Testing** | Tests passed/failed | Coverage percentage, bugs found |
| **Data Processing** | Records processed | Bytes processed, throughput |
| **Agent Delegation** | Tasks completed | Delegation depth, tool calls made |

#### 2.2.2 Agent Delegation Depth Tracking

```python
class DelegationTracker:
    def __init__(self, max_depth=10):
        self.max_depth = max_depth
        self.current_depth = 0
        self.call_stack = []

    def push(self, agent_name):
        """Enter a delegation level"""
        if self.current_depth >= self.max_depth:
            raise RecursionLimitError(
                f"Delegation depth {self.current_depth} exceeds max {self.max_depth}"
            )
        self.call_stack.append(agent_name)
        self.current_depth += 1
        return self.current_depth

    def pop(self):
        """Exit a delegation level"""
        if self.call_stack:
            self.call_stack.pop()
            self.current_depth -= 1
        return self.current_depth

    def get_depth(self):
        return self.current_depth

    def is_too_deep(self):
        return self.current_depth >= self.max_depth * 0.9  # Warning threshold
```

**Progress Indicators for Abstract Tasks:**

1. **Goal Decomposition Progress**
   - Total subtasks: N
   - Completed subtasks: C
   - Progress: C/N

2. **State Space Coverage**
   - States explored: E
   - Estimated total states: T (if known)
   - Coverage: E/T

3. **Information Gain**
   - New information bits per iteration
   - Diminishing returns when bits → 0

#### 2.2.3 "No Progress" Condition Detection

```python
class ProgressDetector:
    def __init__(self, window=5, epsilon=1e-6):
        self.history = []
        self.window = window
        self.epsilon = epsilon

    def record(self, value):
        self.history.append(value)

    def has_progress(self):
        """
        Check if progress has stalled
        Returns: False if stalled (no progress), True if making progress
        """
        if len(self.history) < self.window:
            return True  # Not enough data

        recent = self.history[-self.window:]

        # Multiple checks
        mean_change = np.mean(np.diff(recent))
        std_change = np.std(recent)

        # Stalled if: mean change ~ 0 AND std deviation low
        no_progress = (
            abs(mean_change) < self.epsilon and
            std_change < self.epsilon * 10
        )

        return not no_progress

    def get_stall_duration(self):
        """Count consecutive iterations with no progress"""
        stall_count = 0
        for i in range(len(self.history) - 1, 0, -1):
            change = abs(self.history[i] - self.history[i-1])
            if change < self.epsilon:
                stall_count += 1
            else:
                break
        return stall_count
```

---

## 3. REAL-WORLD IMPLEMENTATIONS

### 3.1 Gradient Descent Convergence

**Standard GD Convergence Check:**
```python
def gradient_descent(f, grad_f, theta_init, learning_rate, max_iter=10000, tol=1e-6):
    theta = theta_init.copy()
    loss_history = [f(theta)]

    for i in range(max_iter):
        gradient = grad_f(theta)
        theta_new = theta - learning_rate * gradient
        loss_new = f(theta_new)

        # Check convergence
        if np.linalg.norm(gradient) < tol:
            print(f"Converged: gradient norm < {tol}")
            break

        if abs(loss_history[-1] - loss_new) < tol:
            print(f"Converged: loss change < {tol}")
            break

        # Check for divergence
        if loss_new > loss_history[-1] * 10:
            print("Diverging: loss increasing rapidly")
            break

        theta = theta_new
        loss_history.append(loss_new)

    return theta, loss_history
```

**SGD with Momentum and Convergence Detection:**
```python
def sgd_with_momentum(f, grad_f, theta_init, learning_rate, momentum=0.9,
                        max_iter=1000, tol=1e-6):
    theta = theta_init.copy()
    velocity = np.zeros_like(theta)
    loss_history = [f(theta)]

    for i in range(max_iter):
        gradient = grad_f(theta, get_minibatch())
        velocity = momentum * velocity - learning_rate * gradient
        theta_new = theta + velocity
        loss_new = f(theta_new)

        # Momentum-aware convergence check
        if np.linalg.norm(velocity) < tol:
            print(f"Converged: momentum norm < {tol}")
            break

        theta = theta_new
        loss_history.append(loss_new)

    return theta, loss_history
```

**Adaptive Learning Rate (Adam) Convergence:**
```python
def adam_optimizer(f, grad_f, theta_init, beta1=0.9, beta2=0.999,
                 learning_rate=0.001, epsilon=1e-8, max_iter=10000, tol=1e-6):
    theta = theta_init.copy()
    m = np.zeros_like(theta)  # First moment
    v = np.zeros_like(theta)  # Second moment
    t = 0

    for i in range(max_iter):
        t += 1
        gradient = grad_f(theta, get_minibatch())

        # Update biased first and second moment estimates
        m = beta1 * m + (1 - beta1) * gradient
        v = beta2 * v + (1 - beta2) * (gradient ** 2)

        # Compute bias-corrected estimates
        m_hat = m / (1 - beta1 ** t)
        v_hat = v / (1 - beta2 ** t)

        # Update parameters
        theta_new = theta - learning_rate * m_hat / (np.sqrt(v_hat) + epsilon)

        # Convergence check
        param_change = np.linalg.norm(theta_new - theta)
        if param_change < tol:
            print(f"Adam converged: param change < {tol}")
            break

        theta = theta_new

    return theta
```

---

### 3.2 Database Query Timeouts

**Query Timeout Configuration:**
```python
import time
import psycopg2  # PostgreSQL
from contextlib import contextmanager

@contextmanager
def query_with_timeout(conn, query, timeout_seconds=60):
    """Execute query with timeout enforcement"""
    cursor = conn.cursor()

    def timeout_handler(signum, frame):
        raise TimeoutError(f"Query exceeded {timeout_seconds}s timeout")

    signal.signal(signal.SIGALRM, timeout_handler)
    signal.alarm(timeout_seconds)

    try:
        start_time = time.time()
        cursor.execute(query)
        results = cursor.fetchall()
        elapsed = time.time() - start_time

        if elapsed > timeout_seconds * 0.8:
            log_warning(f"Query took {elapsed:.2f}s (near {timeout_seconds}s limit)")

        yield results

    except TimeoutError:
        conn.rollback()  # Cancel query
        raise

    finally:
        signal.alarm(0)  # Disable alarm
        cursor.close()
```

**SQL Server Optimizer Timeout Detection:**
```sql
-- Query plan with optimizer timeout indicator
-- Look for: Reason For Early Termination = "TimeOut"
SELECT
    qp.query_id,
    qp.query_plan,
    stmt.early_termination_reason
FROM sys.dm_exec_query_stats AS qs
JOIN sys.dm_exec_cached_plans AS qp ON qs.plan_handle = qp.plan_handle
JOIN sys.dm_exec_query_plan AS stmt ON qp.plan_handle = stmt.plan_handle
WHERE stmt.early_termination_reason = 'TimeOut';
```

---

### 3.3 Web Service Retry Policies

**Exponential Backoff with Jitter:**
```python
import random
import time

def retry_with_backoff(operation, max_retries=5, base_delay=1.0,
                       max_delay=60.0, jitter_factor=0.1):
    """
    Retry operation with exponential backoff and jitter
    Formula: delay = min(base_delay * (2 ** retry_num), max_delay)
    Jitter: delay *= (1 - jitter_factor/2 + random() * jitter_factor)
    """
    last_error = None

    for retry_num in range(max_retries):
        try:
            return operation()

        except RetryableError as e:
            last_error = e
            if retry_num < max_retries - 1:
                # Calculate exponential delay
                delay = min(base_delay * (2 ** retry_num), max_delay)

                # Add jitter to prevent thundering herd
                jitter = delay * jitter_factor
                delay = delay * (1 - jitter_factor/2 + random.random() * jitter_factor)

                log_warning(f"Attempt {retry_num + 1} failed: {e}")
                log_info(f"Retrying in {delay:.2f}s...")
                time.sleep(delay)
            else:
                log_error(f"Max retries ({max_retries}) exceeded")

    raise MaxRetriesError(f"Operation failed after {max_retries} attempts") from last_error
```

**Progressive Timeout with Retry:**
```python
def query_with_progressive_timeout(client, query, initial_timeout=60,
                                max_retries=3, timeout_increment=30):
    """
    Retry query with progressively increasing timeouts
    Useful for long-running queries that may timeout on retry
    """
    for attempt in range(max_retries):
        timeout = initial_timeout + attempt * timeout_increment

        try:
            start = time.time()
            result = client.query(query, timeout=timeout)
            elapsed = time.time() - start
            log_info(f"Query completed in {elapsed:.2f}s (timeout was {timeout}s)")
            return result

        except TimeoutError as e:
            log_warning(f"Query timed out after {timeout}s (attempt {attempt + 1})")
            if attempt < max_retries - 1:
                wait_time = 2 ** attempt  # Exponential backoff
                log_info(f"Waiting {wait_time}s before retry...")
                time.sleep(wait_time)
            else:
                raise

    raise TimeoutError(f"Query failed after {max_retries} attempts")
```

**Best Practices from AWS:**
1. Always limit the number of retries
2. Consider the type of error (404s shouldn't be retried)
3. Use jitter to prevent synchronized retries
4. Adjust overall timeout settings to account for retry delays

---

### 3.4 Distributed System Consensus Timeouts

**Raft Leader Election Timeout:**
```python
class RaftNode:
    def __init__(self, election_timeout_ms=(150, 300)):
        self.state = 'FOLLOWER'
        self.current_term = 0
        self.voted_for = None
        self.election_timeout_min = election_timeout_ms[0]
        self.election_timeout_max = election_timeout_ms[1]
        self.reset_election_timer()

    def reset_election_timer(self):
        """Reset with randomized timeout to prevent split votes"""
        timeout_ms = random.randint(
            self.election_timeout_min,
            self.election_timeout_max
        )
        self.election_deadline = time.time() + (timeout_ms / 1000.0)

    def check_election_timeout(self):
        """Check if follower should become candidate"""
        if self.state != 'FOLLOWER':
            return False

        if time.time() > self.election_deadline:
            self.start_election()
            return True

        return False

    def receive_append_entries(self, term, leader_id):
        """Reset election timer when receiving leader heartbeat"""
        if term >= self.current_term:
            self.state = 'FOLLOWER'
            self.current_term = term
            self.voted_for = None
            self.reset_election_timer()

    def start_election(self):
        """Become candidate and start election"""
        self.state = 'CANDIDATE'
        self.current_term += 1
        self.voted_for = self.id
        self.reset_election_timer()
        self.request_votes()

    def request_votes(self):
        """Send RequestVote RPCs to all peers"""
        for peer in self.peers:
            peer.send_request_vote(
                term=self.current_term,
                candidate_id=self.id,
                last_log_index=len(self.log) - 1,
                last_log_term=self.log[-1].term if self.log else 0
            )
```

**Raft Timing Requirement:**
```
broadcastTime ≪ electionTimeout ≪ MTBF
```

Where:
- `broadcastTime`: Time to send RPCs (0.5ms - 20ms depending on storage)
- `electionTimeout`: 150-500ms (prevents leader from timing out before sending heartbeat)
- `MTBF`: Mean time between failures (hours to days)

**Split Vote Detection:**
```python
def detect_split_vote(vote_results, total_nodes):
    """
    Detect if election resulted in split vote (no majority)
    vote_results: dict {node_id: vote_granted (bool)}
    """
    votes_granted = sum(vote_results.values())
    votes_needed = (total_nodes // 2) + 1

    return votes_granted < votes_needed
```

---

## 4. IMPLEMENTATION CONSIDERATIONS

### 4.1 Multiple Termination Condition Composition

**Priority-Based Termination:**
```python
class MultiConditionTermination:
    def __init__(self):
        self.conditions = []

    def add_condition(self, condition, priority=0, message=""):
        """
        condition: callable() -> bool
        priority: higher = checked first
        message: termination reason
        """
        self.conditions.append({
            'condition': condition,
            'priority': priority,
            'message': message
        })
        self.conditions.sort(key=lambda x: x['priority'], reverse=True)

    def should_terminate(self):
        """Check conditions in priority order"""
        for cond in self.conditions:
            if cond['condition']():
                return True, cond['message']
        return False, None

# Usage
terminator = MultiConditionTermination()

terminator.add_condition(
    condition=lambda: iteration >= max_iterations,
    priority=10,
    message="Max iterations reached"
)

terminator.add_condition(
    condition=lambda: time.time() - start_time > max_duration,
    priority=20,  # Higher priority
    message="Timeout exceeded"
)

terminator.add_condition(
    condition=lambda: loss < loss_target,
    priority=30,  # Highest priority
    message="Loss target achieved"
)

while True:
    should_stop, reason = terminator.should_terminate()
    if should_stop:
        terminate(reason)
    perform_iteration()
```

---

### 4.2 Termination State Recording and Recovery

```python
class LoopStateRecorder:
    def __init__(self, checkpoint_dir='checkpoints'):
        self.checkpoint_dir = checkpoint_dir
        self.checkpoints = []

    def save_checkpoint(self, state, iteration, metadata):
        """Save loop state for recovery"""
        checkpoint = {
            'iteration': iteration,
            'timestamp': time.time(),
            'state': state,
            'metadata': metadata
        }

        filename = f"{self.checkpoint_dir}/checkpoint_{iteration}.json"
        with open(filename, 'w') as f:
            json.dump(checkpoint, f, default=str)

        self.checkpoints.append(filename)

    def load_latest_checkpoint(self):
        """Load latest checkpoint for recovery"""
        if not self.checkpoints:
            return None

        latest = max(self.checkpoints, key=os.path.getctime)
        with open(latest, 'r') as f:
            return json.load(f)

    def cleanup_old_checkpoints(self, keep_last=5):
        """Remove old checkpoints, keep recent"""
        if len(self.checkpoints) > keep_last:
            for old in self.checkpoints[:-keep_last]:
                os.remove(old)
            self.checkpoints = self.checkpoints[-keep_last:]
```

---

### 4.3 Termination Diagnostics and Debugging

**Termination Reason Logger:**
```python
class TerminationLogger:
    def __init__(self):
        self.termination_reasons = []

    def log_termination(self, reason, context=None):
        entry = {
            'timestamp': time.time(),
            'reason': reason,
            'context': context or {},
            'iteration': getattr(context, 'iteration', None)
        }
        self.termination_reasons.append(entry)

    def get_summary(self):
        """Summarize termination patterns"""
        from collections import Counter
        reasons = [e['reason'] for e in self.termination_reasons]
        return Counter(reasons)

    def export_diagnostic_report(self, filename='termination_report.json'):
        with open(filename, 'w') as f:
            json.dump({
                'total_terminations': len(self.termination_reasons),
                'summary': self.get_summary(),
                'details': self.termination_reasons
            }, f, default=str, indent=2)
```

---

### 4.4 Adaptive Termination Thresholds

**Dynamic Threshold Adjustment:**
```python
class AdaptiveTermination:
    def __init__(self, initial_threshold, adjustment_factor=0.9):
        self.threshold = initial_threshold
        self.adjustment_factor = adjustment_factor
        self.stall_count = 0
        self.progress_count = 0

    def check_progress(self, metric, expected_change):
        """
        Adjust threshold based on observed progress
        Returns: True if termination condition met
        """
        actual_change = metric - self.get_previous_metric()

        if abs(actual_change) < abs(expected_change) * 0.5:
            # Progress is slower than expected
            self.stall_count += 1
            self.progress_count = 0

            if self.stall_count >= 3:
                # Consistently stalling, relax threshold
                self.threshold /= self.adjustment_factor
                log_warning(f"Stalling detected, relaxing threshold to {self.threshold}")
        else:
            # Good progress
            self.progress_count += 1
            self.stall_count = 0

            if self.progress_count >= 5:
                # Consistently making progress, tighten threshold
                self.threshold *= self.adjustment_factor
                log_info(f"Good progress, tightening threshold to {self.threshold}")

        return metric < self.threshold

    def get_previous_metric(self):
        # Implementation depends on metric type
        pass
```

---

## 5. CODE PATTERNS

### 5.1 Loop with Multiple Termination Conditions

```python
def robust_loop(initial_state, max_iterations=1000, max_duration=300,
               convergence_tol=1e-6, stall_window=10):
    """
    Loop with multiple termination conditions:
    - Max iterations
    - Timeout
    - Convergence
    - Stalled progress
    """
    state = initial_state
    loss_history = []
    start_time = time.time()

    for iteration in range(max_iterations):
        # Timeout check
        if time.time() - start_time > max_duration:
            return {
                'status': 'TIMEOUT',
                'iteration': iteration,
                'reason': f'Exceeded {max_duration}s timeout',
                'final_state': state
            }

        # Perform iteration
        state = perform_iteration(state)
        loss = compute_loss(state)
        loss_history.append(loss)

        # Convergence check
        if len(loss_history) > 1:
            loss_change = abs(loss_history[-1] - loss_history[-2])
            if loss_change < convergence_tol:
                return {
                    'status': 'CONVERGED',
                    'iteration': iteration,
                    'reason': f'Loss change {loss_change:.2e} < {convergence_tol}',
                    'final_state': state
                }

        # Stalled progress check
        if len(loss_history) >= stall_window:
            recent_losses = loss_history[-stall_window:]
            loss_std = np.std(recent_losses)
            loss_mean = np.mean(recent_losses)

            # Stalled if: low variance AND near plateau
            if loss_std < convergence_tol * 10 and loss_change < convergence_tol:
                return {
                    'status': 'STALLED',
                    'iteration': iteration,
                    'reason': f'Progress stalled (std={loss_std:.2e})',
                    'final_state': state
                }

    # Max iterations reached
    return {
        'status': 'MAX_ITERATIONS',
        'iteration': max_iterations,
        'reason': f'Reached max {max_iterations} iterations',
        'final_state': state
    }
```

---

### 5.2 Hierarchical Agent Delegation with Termination

```python
class HierarchicalAgent:
    def __init__(self, name, max_depth=10):
        self.name = name
        self.max_depth = max_depth
        self.delegation_tracker = DelegationTracker(max_depth)

    def execute(self, task, depth=0):
        """Execute task with delegation, track depth"""
        self.delegation_tracker.push(self.name)

        try:
            result = self.process_task(task)

            # Check if delegation is needed
            if requires_delegation(result):
                if depth >= self.max_depth:
                    raise RecursionError(
                        f"Max delegation depth {self.max_depth} exceeded"
                    )

                # Delegate to sub-agents
                sub_tasks = decompose_task(result)
                sub_results = []

                for sub_task in sub_tasks:
                    sub_agent = select_agent(sub_task)
                    sub_result = sub_agent.execute(sub_task, depth + 1)
                    sub_results.append(sub_result)

                result = synthesize_results(sub_results)

            return result

        finally:
            self.delegation_tracker.pop()

    def process_task(self, task):
        """Core task processing logic"""
        # Implementation depends on agent type
        pass

    def should_terminate(self):
        """Check termination conditions"""
        # Check delegation depth
        if self.delegation_tracker.get_depth() >= self.max_depth:
            return True, "Max delegation depth"

        # Check budget
        if self.budget_exceeded():
            return True, "Budget exceeded"

        # Check timeout
        if self.time_exceeded():
            return True, "Timeout exceeded"

        return False, None
```

---

### 5.3 State Machine-Based Loop Termination

```python
class AgentLoopStateMachine:
    """State machine for agent loop lifecycle"""

    def __init__(self):
        self.state = 'INIT'
        self.history = []

    def transition(self, event):
        """State transition with terminal state detection"""
        transitions = {
            'INIT': {
                'start': 'RUNNING',
                'error': 'TERMINATED'
            },
            'RUNNING': {
                'complete': 'SUCCESS',
                'error': 'ERROR',
                'timeout': 'TIMEOUT',
                'stalled': 'STALLED',
                'user_interrupt': 'INTERRUPTED'
            },
            'ERROR': {
                'retry': 'RUNNING',
                'escalate': 'TERMINATED'
            },
            'SUCCESS': {},  # Terminal
            'TIMEOUT': {},  # Terminal
            'STALLED': {},  # Terminal
            'INTERRUPTED': {},  # Terminal
            'TERMINATED': {}  # Terminal
        }

        if event in transitions[self.state]:
            old_state = self.state
            self.state = transitions[self.state][event]
            self.history.append((old_state, event, self.state))
            return True

        return False

    def is_terminal(self):
        """Check if in terminal state"""
        return self.state in ['SUCCESS', 'TIMEOUT', 'STALLED',
                              'INTERRUPTED', 'TERMINATED']

    def run_loop(self, task):
        """Run agent loop with state machine"""
        self.transition('start')

        while not self.is_terminal():
            try:
                # Perform iteration
                result = perform_iteration(task)

                # Check for completion
                if is_complete(result):
                    self.transition('complete')

                # Check for stall
                if is_stalled():
                    self.transition('stalled')

                # Check for timeout
                if check_timeout():
                    self.transition('timeout')

            except Exception as e:
                self.transition('error')
                # Decide whether to retry or escalate
                if should_retry(e):
                    self.transition('retry')
                else:
                    self.transition('escalate')

            # Check for user interrupt
            if user_interrupted():
                self.transition('user_interrupt')

        return {
            'final_state': self.state,
            'history': self.history
        }
```

---

## 6. IMPLEMENTATION CHECKLIST

### 6.1 Termination Condition Checklist

- [ ] Define explicit success conditions
- [ ] Set maximum iteration limit
- [ ] Configure timeout (absolute and per-iteration)
- [ ] Implement convergence detection with tolerance
- [ ] Add stall/plateau detection
- [ ] Track resource consumption (tokens, API calls, memory)
- [ ] Enable user interrupt handling
- [ ] Define state-based termination conditions
- [ ] Implement deadlock detection (if applicable)
- [ ] Add oscillation detection
- [ ] Configure exponential backoff for retries
- [ ] Set budget limits (compute, financial)
- [ ] Add checkpoint/recovery mechanism
- [ ] Implement diagnostic logging
- [ ] Test edge cases (empty input, immediate success, infinite loop risk)
- [ ] Validate termination thresholds (tune based on workload)

---

### 6.2 Progress Indicator Checklist

- [ ] Define primary progress metric per loop type
- [ ] Track secondary metrics for context
- [ ] Implement moving window analysis (5-10 iterations)
- [ ] Calculate rate of change (first derivative)
- [ ] Monitor acceleration (second derivative) if needed
- [ ] Track delegation depth for agent systems
- [ ] Log progress at regular intervals
- [ ] Alert on progress degradation
- [ ] Store history for post-mortem analysis
- [ ] Visualize progress curves (optional)

---

### 6.3 Safety and Reliability Checklist

- [ ] Add circuit breaker for cascading failures
- [ ] Implement graceful degradation
- [ ] Add fail-safes for critical resources
- [ ] Use idempotent operations where possible
- [ ] Add health check endpoints (for services)
- [ ] Implement circuit pattern for external dependencies
- [ ] Add rate limiting for API calls
- [ ] Use circuit breakers for downstream services
- [ ] Add monitoring and alerting
- [ ] Document termination behavior

---

## 7. REFERENCES AND FURTHER READING

### Academic Papers

1. **"An Overview of Gradient Descent Optimization Algorithms"** - Sebastian Ruder
   - Comprehensive survey of GD, SGD, Momentum, Adam, RMSprop
   - Oscillation analysis and convergence guarantees
   - https://arxiv.org/pdf/1609.04747

2. **"In Search of an Understandable Consensus Algorithm"** - Ongaro & Ousterhout (Raft)
   - Raft consensus algorithm with timeout mechanisms
   - Election timeout requirements: broadcastTime ≪ electionTimeout ≪ MTBF
   - https://raft.github.io/raft.pdf

3. **"Understanding and Detecting Convergence for Stochastic Gradient Descent with Momentum"**
   - Convergence diagnostic algorithms for SGDM
   - Theoretical bounds on convergence detection
   - https://arxiv.org/pdf/2008.12224

4. **"On the Convergence Direction of Gradient Descent"**
   - Proves GD either aligns to fixed direction or oscillates along line
   - Explains "Edge of Stability" phenomenon
   - https://openreview.net/forum?id=3U6wH7uAPZ

### Industry Documentation

5. **AWS: Timeouts, Retries, and Backoff with Jitter**
   - Exponential backoff with jitter implementation
   - Thundering herd prevention
   - https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/

6. **Microsoft: Implement Retries with Exponential Backoff**
   - Retry patterns for cloud applications
   - Transient failure handling
   - https://learn.microsoft.com/en-us/dotnet/architecture/microservices/implement-resilient-applications/implement-retries-exponential-backoff

7. **SQL Server: Troubleshoot Optimizer Timeout**
   - Query optimizer timeout detection
   - Performance impact analysis
   - https://learn.microsoft.com/en-us/troubleshoot/sql/database-engine/performance/troubleshoot-optimizer-timeout-performance

8. **InfluxDB: Query Timeout Best Practices**
   - Timeout recommendations by query type
   - Progressive timeout with retry
   - https://docs.influxdata.com/influxdb3/cloud-dedicated/query-data/troubleshoot-and-optimize/query-timeout-best-practices/

### Blog Posts and Tutorials

9. **"Agent Loop Chaos: Designing for Convergence"** - LinkedIn
   - AI agent infinite loop prevention
   - Self-reflection and history tracking
   - https://www.linkedin.com/posts/anirshar_agent-loop-basics-avoiding-infinite-chaos-activity-7406705928139444226-pXpH

10. **"Stopping Conditions That Actually Stop Multi-Agent Loops"** - DEV.to
    - Loop budget, missing-info gate, evidence threshold
    - Progress test implementation
    - https://dev.to/dowhatmatters/stopping-conditions-that-actually-stop-multi-agent-loops-bnb

11. **"Understanding Exponential Backoff"** - Medium
    - Exponential backoff implementation in Python
    - Benefits: reduces load, improves success rate, avoids cascading failures
    - https://medium.com/@someshrangrej/understanding-exponential-backoff-a-smart-retry-mechanism-0de0a7a8ce6f

12. **"Better Retries with Exponential Backoff and Jitter"** - Baeldung
    - Resilience4j retry implementation
    - Jitter formula and collision prevention
    - https://www.baeldung.com/resilience4j-backoff-jitter

### Statistical Methods

13. **"How to Detect a Plateau at the End of a Short Time Series"** - Stats.SE
    - GAM-based plateau detection
    - Standard deviation vs slope-based methods
    - https://stats.stackexchange.com/questions/646494/how-to-detect-a-plateau-at-the-end-of-a-short-time-series

14. **"Anomaly Detection in Time Series"** - Schmidl et al.
    - Time series anomaly detection survey
    - 61 algorithms evaluated
    - https://hpi.de/fileadmin/user_upload/fachgebiete/naumann/publications/PDFs/2022_schmidl_anomaly.pdf

### AI/ML Specific

15. **"The Agent Execution Loop: How to Build an AI Agent From Scratch"** - Victor Dibia
    - Agent loop architecture
    - Streaming, memory, error handling
    - https://newsletter.victordibia.com/p/the-agent-execution-loop-how-to-build

16. **"Understanding AI Agents by Looking Inside the Loop"** - Medium
    - End conditions: LLM says complete, function signal, max steps
    - https://medium.com/data-science-collective/understanding-ai-agents-by-looking-inside-the-loop-c571c49c23f9

### Resource Management

17. **"Manage AI Agents Across Your Organization"** - Microsoft Learn
    - Quota optimization, budget tracking
    - Monthly consumption review
    - https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/ai-agents/integrate-manage-operate

18. **"Agent Cost Monitoring: Optimize AI Budgets"** - Sparkco
    - Real-world case study: retail corporation
    - Budget alerting mechanisms
    - https://sparkco.ai/blog/agent-cost-monitoring-optimize-ai-budgets

### State Machines

19. **"A Crash Course in UML State Machines"** - state-machine.com
    - State machine entry/exit actions
    - Termination states and transitions
    - https://www.state-machine.com/doc/AN_Crash_Course_in_UML_State_Machines.pdf

20. **"Finite State Machines (FSM) in Embedded Systems"** - EmbeddedRelated
    - Event-driven vs polling-based FSM
    - Interrupt handling
    - https://www.embeddedrelated.com/showarticle/1665.php

---

## 8. SUMMARY AND KEY TAKEAWAYS

### 8.1 Termination Trigger Taxonomy

| Category | Primary Trigger | Detection Method | Typical Thresholds |
|----------|--------------|----------------|------------------|
| **Success** | Goal achieved | State comparison, explicit signal | Problem-specific |
| **Failure** | Max attempts | Counter comparison | 3-5 retries, 1000-10000 iterations |
| **Timeout** | Time exceeded | Clock comparison | 10s (UI), 60s (API), 300s (batch) |
| **Convergence** | Minimal change | Gradient/loss/parameter delta | 1e-5 to 1e-7 |
| **Progress** | No change | Plateau detection | Window 5-10, std < 1e-4 |
| **Resource** | Budget exhausted | Counter/monitoring | Problem-specific limits |
| **Interrupt** | User signal | Signal handler | Immediate |
| **State** | Condition met | State machine transition | Problem-specific |

### 8.2 Detection Algorithm Selection Guide

| Scenario | Recommended Detection | Complexity | False Positive Rate |
|----------|-------------------|------------|-------------------|
| Simple optimization | Loss change | Low | Low |
| Noisy gradients | Moving average loss | Medium | Medium |
| Non-convex landscape | Gradient correlation | High | Low |
| Time series data | Statistical test (t-test) | Medium | Medium |
| Agent delegation | Depth counter | Low | Very Low |
| Distributed consensus | Timeout + randomized election | Medium | Low |
| Retry logic | Exponential backoff + jitter | Medium | Low |

### 8.3 Implementation Priorities

**High Priority:**
1. Always set max iterations and timeout
2. Implement explicit success condition
3. Add user interrupt handling
4. Track resource consumption
5. Log termination reasons

**Medium Priority:**
1. Convergence detection for optimization
2. Plateau detection for long-running loops
3. Exponential backoff for retries
4. Delegation depth tracking

**Low Priority (Optimization):**
1. Adaptive thresholds
2. Advanced oscillation detection
3. Checkpoint/recovery
4. Detailed diagnostic logging

### 8.4 Common Pitfalls

1. **Setting thresholds too tight** → Premature termination, wasted potential
2. **Setting thresholds too loose** → Resource waste, slow failure detection
3. **Single termination condition** → Missing edge cases
4. **No budget limits** → Cost explosions in cloud environments
5. **No interrupt handling** → Cannot stop runaway processes
6. **Ignoring oscillation** → Infinite loops without progress
7. **No stall detection** → Long wait times before timeout

---

## APPENDIX: QUICK REFERENCE CODE

### Termination Condition Checker (All-in-One)

```python
class LoopTerminator:
    """Comprehensive loop termination detector"""

    def __init__(self, config):
        self.max_iterations = config.get('max_iterations', 1000)
        self.max_duration = config.get('max_duration', 300)
        self.convergence_tol = config.get('convergence_tol', 1e-6)
        self.stall_window = config.get('stall_window', 10)
        self.stall_std_tol = config.get('stall_std_tol', 1e-4)
        self.resource_budget = config.get('resource_budget', {})

        # State
        self.iteration = 0
        self.start_time = None
        self.metrics_history = []
        self.resource_usage = {}
        self.termination_reason = None

    def start(self):
        """Initialize termination tracking"""
        self.iteration = 0
        self.start_time = time.time()
        self.metrics_history = []
        self.termination_reason = None

    def check(self, metrics, resource_usage=None):
        """
        Check all termination conditions
        Returns: (should_terminate, reason)
        """
        self.iteration += 1
        self.metrics_history.append(metrics)

        if resource_usage:
            for key, value in resource_usage.items():
                if key not in self.resource_usage:
                    self.resource_usage[key] = 0
                self.resource_usage[key] += value

        # Check 1: Max iterations
        if self.iteration >= self.max_iterations:
            self.termination_reason = 'MAX_ITERATIONS'
            return True, f"Reached {self.max_iterations} iterations"

        # Check 2: Timeout
        elapsed = time.time() - self.start_time
        if elapsed > self.max_duration:
            self.termination_reason = 'TIMEOUT'
            return True, f"Exceeded {self.max_duration}s timeout"

        # Check 3: Resource budget
        for key, budget in self.resource_budget.items():
            used = self.resource_usage.get(key, 0)
            if used >= budget:
                self.termination_reason = f'EXHAUSTED_{key.upper()}'
                return True, f"Exhausted {key} budget ({used}/{budget})"

        # Check 4: Convergence (if metrics provide primary metric)
        if 'primary_metric' in metrics and len(self.metrics_history) > 1:
            change = abs(metrics['primary_metric'] -
                       self.metrics_history[-2]['primary_metric'])
            if change < self.convergence_tol:
                self.termination_reason = 'CONVERGED'
                return True, f"Converged (change={change:.2e} < {self.convergence_tol})"

        # Check 5: Stalled progress
        if len(self.metrics_history) >= self.stall_window:
            recent = [m['primary_metric'] for m in
                      self.metrics_history[-self.stall_window:]
            std = np.std(recent)
            if std < self.stall_std_tol:
                self.termination_reason = 'STALLED'
                return True, f"Progress stalled (std={std:.2e})"

        return False, None

    def get_summary(self):
        """Get termination summary"""
        return {
            'termination_reason': self.termination_reason,
            'iterations': self.iteration,
            'duration': time.time() - self.start_time,
            'resource_usage': self.resource_usage,
            'final_metrics': self.metrics_history[-1] if self.metrics_history else None
        }
```

### Usage Example

```python
# Configuration
config = {
    'max_iterations': 10000,
    'max_duration': 600,  # 10 minutes
    'convergence_tol': 1e-6,
    'stall_window': 10,
    'stall_std_tol': 1e-4,
    'resource_budget': {
        'tokens': 1000000,
        'api_calls': 1000
    }
}

# Initialize terminator
terminator = LoopTerminator(config)
terminator.start()

# Run loop
while True:
    # Perform iteration
    result = perform_iteration()

    # Track metrics and resources
    metrics = {
        'primary_metric': result.loss,
        'secondary_metric': result.accuracy
    }
    resources = {
        'tokens': result.tokens_used,
        'api_calls': 1
    }

    # Check termination
    should_terminate, reason = terminator.check(metrics, resources)
    if should_terminate:
        print(f"Terminated: {reason}")
        break

# Get summary
summary = terminator.get_summary()
print(f"Final state: {summary}")
```

---

**End of Research Report**

This research synthesized information from 20+ sources including academic papers, industry documentation, blog posts, and implementation guides. All detection mechanisms and code patterns are practical and implementable in production systems.
