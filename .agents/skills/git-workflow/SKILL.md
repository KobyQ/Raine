---
name: git-workflow
description: Use this skill whenever the user asks to save changes, commit code, push work, or create a pull request. This enforces strict branching, conventional commits, and branch protection.
version: 1.0.0
---

# Git Workflow & Version Control

## Goal
Safely commit changes, enforce branch naming conventions, and manage Pull Requests without ever pushing directly to the `main` branch.

## Strict Rules
1. **Protect Main:** NEVER execute `git push origin main`. If the current branch is `main`, you must create a new branch before committing.
2. **Branch Naming:** Branches must follow `feat/[component]-[short-description]` or `fix/[component]-[short-description]`.
3. **Conventional Commits:** Commit messages must strictly follow the `type(scope): description` format. (e.g., `feat(auth): added jwt validation`).

## Execution Steps
When triggered, you must execute the following sequence precisely:

### Step 1: Branch Verification
- Run `git branch --show-current`.
- If the branch is `main`, immediately prompt the user: "You are on the main branch. Should I create a `feat/` or `fix/` branch for these changes?" Wait for their input before proceeding.
- If they are already on a valid feature/fix branch, proceed to Step 2.

### Step 2: Stage and Commit
- Run `git status` and analyze the changed files to determine the affected components.
- Stage the changes.
- Generate a single, atomic commit message using the Conventional Commits format that includes the component name. 
- Execute the `git commit` command.

### Step 3: Push and PR
- Push the branch to the remote repository.
- If the user requested a Pull Request, use the appropriate CLI tool (like `gh pr create`) to open a PR against `main`. 

### Step 4: HALT for Human-in-the-Loop
- **CRITICAL:** Once the PR is created, or if the user asks you to merge the branch, you must STOP execution.
- Present the commit log and PR details to the user. 
- Ask: "Please review the changes. Click 'Approve' to allow me to merge this into main."
- Do NOT proceed with any merge commands until explicit human approval is received.

### Step 5: Merge (After Approval)
- Only after the user clicks "Approve" or explicitly says "yes, merge it", execute the merge into `main` and clean up the feature branch if necessary.