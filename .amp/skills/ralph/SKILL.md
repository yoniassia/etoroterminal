---
name: ralph
description: "Autonomous parallel feature development. Triggers on: ralph, run ralph, run the loop, parallel ralph, run parallel. Spawns MULTIPLE parallel agents for independent tasks. Keeps spawning batches until ALL tasks complete."
---

# Ralph Feature Setup

Interactive feature planning that creates ralph-ready tasks with dependencies.

---

## The Job

**Two modes:**

### Mode 1: New Feature
1. Chat through the feature - Ask clarifying questions
2. Break into small tasks - Each completable in one iteration
3. Create task_list tasks - Parent + subtasks with `dependsOn`
4. Set up ralph files - Save parent ID, reset progress.txt

### Mode 2: Existing Tasks
1. Find existing parent task - Search or let user specify
2. Verify structure - Check subtasks have proper `dependsOn`
3. Set up ralph files - Save parent ID to parent-task-id.txt
4. Show status - Which tasks are ready, completed, blocked

**Ask the user which mode they need:**
```
Are you:
1. Starting a new feature (I'll help you plan and create tasks)
2. Using existing tasks (I'll set up Ralph to run them)
```

---

## Step 1: Understand the Feature

Start by asking the user about their feature. Don't assume - ASK:

```
What feature are you building?
```

Then ask clarifying questions:
- What's the user-facing goal?
- What parts of the codebase will this touch? (database, UI, API, etc.)
- Are there any existing patterns to follow?
- What should it look like when done?

**Keep asking until you have enough detail to break it into tasks.**

---

## Step 2: Break Into Tasks

**Each task must be completable in ONE Ralph iteration (~one context window).**

Ralph spawns a fresh Amp instance per iteration with no memory of previous work. If a task is too big, the LLM runs out of context before finishing.

### Right-sized tasks:
- Add a database column + migration
- Create a single UI component
- Implement one server action
- Add a filter to an existing list
- Write tests for one module

### Too big (split these):
- "Build the entire dashboard" → Split into: schema, queries, components, filters
- "Add authentication" → Split into: schema, middleware, login UI, session handling
- "Refactor the API" → Split into one task per endpoint

**Rule of thumb:** If you can't describe the change in 2-3 sentences, it's too big.

---

## Step 3: Order by Dependencies

Tasks execute based on `dependsOn`. Earlier tasks must complete before dependent ones start.

**Typical order:**
1. Schema/database changes (migrations)
2. Server actions / backend logic
3. UI components that use the backend
4. Integration / E2E tests

Use `dependsOn` to express this:
```
Task 1: Schema (no dependencies)
Task 2: Server action (dependsOn: [task-1])
Task 3: UI component (dependsOn: [task-2])
Task 4: Tests (dependsOn: [task-3])
```

Parallel tasks that don't depend on each other can share the same dependency.

---

## Step 4: Create Tasks

### First, create the parent task:

```
task_list create
  title: "[Feature Name]"
  description: "[One-line description of the feature]"
  repoURL: "https://github.com/snarktank/untangle"
```

**Save the returned task ID** - you'll need it for subtasks.

### Then, create subtasks with parentID and dependsOn:

```
task_list create
  title: "[Task title - action-oriented]"
  description: "[Detailed description with:
    - What to implement
    - Files to create/modify
    - Acceptance criteria
    - How to verify (typecheck, tests, browser)]"
  parentID: "<parent-task-id>"
  dependsOn: ["<previous-task-id>"]  // omit for first task
  repoURL: "https://github.com/snarktank/untangle"
```

### Task description format:

Write descriptions that a future Ralph iteration can pick up without context:

```
Implement category name to ID mapping for expenses.

**What to do:**
- Create function mapExpenseCategoryNameToId(name, isChildExpense)
- Query item_category table with category_type filter
- Add alias mapping for common synonyms (rent → Rent or Mortgage)

**Files:**
- workflows/tools/upsert-expense.ts

**Acceptance criteria:**
- Function returns category ID for valid names
- Returns null for unknown categories
- npm run typecheck passes

**Notes:**
- Follow pattern from upsert-income.ts
- EXPENSE type for family, CHILD_EXPENSE for child
```

---

## Step 5: Set Up Ralph Files

After creating all tasks, **run the shared setup steps from "Final Setup (Required for Both Modes)" section.**

This ensures:
- Parent task ID is saved to `scripts/ralph/parent-task-id.txt`
- Previous progress.txt is archived if it has content
- Fresh progress.txt is created with Codebase Patterns preserved

---

## Step 6: Confirm Setup

Show the user what was created:

```
✅ Ralph is ready!

**Parent task:** [title] (ID: [id])

**Subtasks:**
1. [Task 1 title] - no dependencies
2. [Task 2 title] - depends on #1
3. [Task 3 title] - depends on #2
...

**To start Ralph:** Say "run ralph" or "start the loop" - I'll use handoff to execute the first ready task, and each task will hand off to the next until complete.

---

## Mode 2: Setting Up Existing Tasks

If the user already has tasks created, help them set up Ralph to run them.

### Find the parent task:

**First, check if a parent task is already saved:**

```bash
cat scripts/ralph/parent-task-id.txt
```

If this file exists and contains a task ID, use it! Verify it's valid by fetching the task:
```
task_list action: "get", taskID: "<id-from-file>"
```

**Only if no saved parent task exists**, ask the user:
```
What's the parent task? You can give me:
- The task ID directly
- A search term and I'll find it
- Or say "list recent" to see recent tasks
```

To search for tasks (always use limit to avoid context overflow):
```
task_list list
  repoURL: "https://github.com/snarktank/untangle"
  limit: 10
```

### Verify subtasks exist:

Once you have the parent ID, check for subtasks (always use limit):
```
task_list list
  parentID: "<parent-task-id>"
  limit: 10
```

If no subtasks found, the parent task might BE the work (not a container). Ask:
```
This task has no subtasks. Is this:
1. A parent task with subtasks I should find differently?
2. The actual work task (I should create it as a parent with this as the first subtask)?
```

### Check dependencies:

Review the subtasks and verify:
- Do they have `dependsOn` set correctly?
- Are there any circular dependencies?
- Is the first task(s) dependency-free so Ralph can start?

If dependencies are missing, offer to fix:
```
These tasks don't have dependencies set. Should I:
1. Add dependencies based on their order?
2. Leave them parallel (Ralph picks any ready task)?
```

### Set up ralph files:

**Run the shared setup steps from "Final Setup (Required for Both Modes)" section below.**

### Show status:

```
✅ Ralph is ready to use existing tasks!

**Parent task:** [title] (ID: [id])

**Status:**
- ✅ Completed: 3 tasks
- 🔄 Ready to work: 2 tasks  
- ⏳ Blocked: 5 tasks (waiting on dependencies)

**Next task Ralph will pick:**
[Task title] - [brief description]

**To start Ralph:** Say "run ralph" or "start the loop"

---

## Final Setup (Required for Both Modes)

**ALWAYS run these steps after creating tasks OR setting up existing tasks:**

### 1. Save parent task ID:

```bash
echo "<parent-task-id>" > scripts/ralph/parent-task-id.txt
```

Verify it was saved:
```bash
cat scripts/ralph/parent-task-id.txt
```

### 2. Check if progress.txt needs archiving:

Read the current progress.txt:
```bash
cat scripts/ralph/progress.txt
```

**Archive if:**
- It has content beyond the header (learnings from a previous feature)
- The previous feature is different from the current one

**Archive command:**
```bash
DATE=$(date +%Y-%m-%d)
FEATURE="previous-feature-name-here"
mkdir -p scripts/ralph/archive/$DATE-$FEATURE
cp scripts/ralph/progress.txt scripts/ralph/archive/$DATE-$FEATURE/
echo "Archived to scripts/ralph/archive/$DATE-$FEATURE/"
```

### 3. Reset progress.txt:

**Preserve useful Codebase Patterns** from the previous run, then reset:

```bash
cat > scripts/ralph/progress.txt << 'EOF'
# Ralph Progress Log
Started: [current date]

## Codebase Patterns
[Copy any patterns from previous run that are still relevant]
---
EOF
```

### 4. Verify setup is complete:

```bash
# Confirm parent ID is saved
cat scripts/ralph/parent-task-id.txt

# Confirm progress.txt is reset
head -10 scripts/ralph/progress.txt

# List subtasks to confirm they exist
# (use task_list list with parentID)
```

**Only after completing all 4 steps is Ralph ready to run.**

---

## Acceptance Criteria for Each Task

Each task description MUST include verifiable acceptance criteria:

### Good criteria (verifiable):
- "Add `investorType` column to investor table with default 'cold'"
- "Filter dropdown has options: All, Cold, Friend"
- "npm run typecheck passes"
- "npm test -- path/to/test.ts passes"

### Bad criteria (vague):
- ❌ "Works correctly"
- ❌ "Good UX"
- ❌ "Handles edge cases"

### Always include:
```
npm run typecheck passes
```

### For tasks with testable logic:
```
npm test passes
```

### For UI/browser tasks:

**For functional testing** (checking behavior, not appearance):
```
Use Chrome DevTools MCP with take_snapshot to read page content (NOT screenshots)
```
- `take_snapshot` returns the a11y tree as text that Ralph can read and verify
- `take_screenshot` returns images which Ralph cannot interpret for functional checks
- Only use screenshots when testing visual appearance/look and feel

**For visual testing** (checking appearance):
```
Use take_screenshot to capture and verify visual appearance
```

---

## Example Conversation

**User:** set up ralph for adding expense tracking to the legal agent

**Assistant:** What feature are you building?

**User:** I want Grace (our legal chat agent) to be able to create, update, and delete expenses when users mention them in conversation.

**Assistant:** Got it - an expense upsert tool for the legal agent. A few questions:

1. Are there existing tools in the legal agent I should follow as a pattern?
2. Do expenses have different types (family vs child)?
3. Should it also list expenses or just CRUD?
4. Any task completion logic needed?

**User:** Follow upsert-income.ts. Yes family and child expenses (different tables). Yes list too. Mark APP_EXPENSES_ENTERED task complete.

**Assistant:** Perfect. Here's my proposed breakdown:

1. **Create tool skeleton** - Zod schema, basic structure
2. **Category mapping** - Map names like "rent" to category IDs
3. **Amount parsing** - Handle currency formats, allow $0
4. **Duplicate detection** - Check before creating
5. **Create family expenses** - Insert into expense table
6. **Create child expenses** - Insert into child_expense table
7. **Update action** - Modify existing expenses
8. **Delete action** - Remove expenses
9. **List action** - Show all expenses with totals
10. **Task completion** - Mark APP_EXPENSES_ENTERED done
11. **Register tool** - Add to legal chat workflow
12. **UI progress indicator** - Show progress during tool use
13. **Unit tests** - Test helper functions
14. **E2E tests** - Test via chat interface

Does this look right? Any tasks to add or remove?

**User:** Looks good, create the tasks

**Assistant:** [Creates parent task, then subtasks with dependencies, saves parent-task-id.txt]

✅ Ralph is ready!

**Parent task:** Legal Agent Expense Upsert Tool (ID: task-abc123)

**Subtasks:** 14 tasks created with dependencies

**To start:** Say "run ralph" or "start the loop"

---

## How Ralph Completes

When all subtasks are completed:
1. Ralph marks the **parent task** as `completed`
2. Reports "✅ Build complete - all tasks finished!"
3. Summarizes what was accomplished

**Important:** Ralph uses `limit: 5` when querying tasks to avoid context overflow. If you have many subtasks, they'll be processed over multiple iterations.

---

## Checklist Before Creating Tasks

- [ ] Chatted through feature to understand scope
- [ ] Each task completable in one iteration (small enough)
- [ ] Tasks ordered by dependency (schema → backend → UI → tests)
- [ ] Every task has "npm run typecheck passes" in description
- [ ] UI tasks have browser verification in description
- [ ] Descriptions have enough detail for Ralph to implement without context
- [ ] Parent task ID saved to scripts/ralph/parent-task-id.txt
- [ ] Previous run archived if progress.txt had content

---

# Phase 2: The Parallel Execution Loop

Ralph runs **PARALLEL agents** to implement multiple independent tasks simultaneously.

---

## Parallel Loop Workflow

### 0. Get the parent task ID

```bash
cat scripts/ralph/parent-task-id.txt
```

If this file doesn't exist, ask the user which parent task to work on.

### 1. Get ALL ready tasks

Query for all tasks that are ready to execute:
```
task_list action: "list", parentID: "<parent-task-id>", ready: true, status: "open", limit: 20
```

### 2. If no ready tasks - check completion

Query all tasks to check status:
```
task_list action: "list", parentID: "<parent-task-id>", limit: 50
```

- If ALL tasks are `completed`: 
  1. Mark parent task as `completed`
  2. Report "✅ BUILD COMPLETE - All [N] tasks finished!"
  3. Stop

- If some tasks are `blocked` or `open` with unmet dependencies:
  1. Report which tasks are blocked and why
  2. Wait or ask user for intervention

### 3. If ready tasks exist - SPAWN PARALLEL AGENTS

**CRITICAL: Spawn ALL ready tasks simultaneously using multiple Task tool calls in ONE message.**

For each ready task, use the `Task` tool (NOT handoff) with this prompt:

```
Implement task [task-id]: [task-title]

[task-description]

**Instructions:**

1. Read scripts/ralph/progress.txt for codebase patterns and context

2. Implement the task completely:
   - Create/modify the required files
   - Follow existing code patterns in the codebase
   - Ensure all acceptance criteria are met

3. Run quality checks:
   - Run: npm run build (or npm run typecheck if available)
   - If checks fail, FIX THE ISSUES until they pass
   - Do NOT proceed until quality checks pass

4. Update progress.txt (APPEND to end of file):
   ```
   ## [Date] - [Task Title]
   Task ID: [task-id]
   - What was implemented
   - Files changed
   - Patterns discovered
   ---
   ```

5. Commit changes: git add -A && git commit -m "feat: [task-title]"

6. Mark task complete: task_list action: "update", taskID: "[task-id]", status: "completed"

7. Return summary of what was done
```

**Example of parallel spawning (3 ready tasks):**

In a SINGLE assistant message, include multiple Task tool calls:
- Task 1: Implement T001
- Task 2: Implement T006  
- Task 3: Implement T012

All three agents run concurrently!

### 4. After batch completes - CONTINUE THE LOOP

After all parallel agents return:

1. Report what was completed in this batch
2. Query for newly ready tasks (dependencies now satisfied)
3. Spawn the next batch of parallel agents
4. Repeat until no more tasks

**THE LOOP NEVER STOPS UNTIL ALL TASKS ARE DONE.**

### 5. Coordinator responsibilities

The main thread (coordinator) must:
- Track total tasks: completed vs remaining
- After each batch, immediately query for new ready tasks
- Spawn the next batch without user intervention
- Only stop when ALL tasks show `status: "completed"`

```
LOOP:
  1. Query ready tasks
  2. If none ready AND all complete → DONE
  3. If none ready AND some blocked → Report blockers
  4. If ready tasks exist → Spawn ALL as parallel Task agents
  5. Wait for batch to complete
  6. GOTO 1
```

---

## Conflict Prevention for Parallel Agents

When multiple agents run in parallel, prevent file conflicts:

1. **Each task should touch DIFFERENT files** - task design should ensure this
2. **progress.txt updates** - Each agent appends to end; conflicts are rare
3. **If conflict occurs** - Agent should pull latest, resolve, and continue

---

## Quality Requirements

Before marking any task complete:
- `npm run build` must pass (or `npm run typecheck`)
- Changes must be committed
- Progress must be logged
- Task marked as `completed` via task_list

---

## Stop Condition

When no ready tasks remain AND all tasks are completed:
1. Output: "✅ BUILD COMPLETE - All [N] tasks finished!"
2. Summarize total tasks completed
3. List any issues encountered

---

## Max Parallelism

Spawn up to **5 parallel agents** per batch to avoid overwhelming the system.
If more than 5 tasks are ready, prioritize by:
1. Tasks with most dependents (unblock more work)
2. Foundation/infrastructure tasks first
3. UI tasks last (they depend on backend)

---

## Example Full Run

```
Batch 1: [T001, T006, T012] → 3 agents spawn
         ↓ all complete
Batch 2: [T002, T003, T014] → 3 agents spawn (deps satisfied)
         ↓ all complete
Batch 3: [T004, T005, T007, T008, T009] → 5 agents spawn
         ↓ all complete
... continues until ...
Batch N: [T051] → 1 agent spawns
         ↓ complete
✅ BUILD COMPLETE - All 51 tasks finished!
```

---

## Running Ralph

To start the parallel build, say: **"run ralph"**

The coordinator will:
1. Read parent-task-id.txt
2. Query all ready tasks
3. Spawn parallel agents for each
4. Wait for completion
5. Query newly ready tasks
6. Repeat until done

**No user intervention needed after starting.**
