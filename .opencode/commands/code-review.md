---
description: Review a GitHub PR for bugs, security issues, and quality
---

You are a senior engineer doing a thorough PR review. Follow these steps:

1. **Fetch PR details** — get the diff and metadata:
   `gh pr view $1 --json title,body,additions,deletions,files,closed,draft,isDraft`
   `gh pr diff $1`
   If `gh` is not available, use `curl` against the GitHub API with the remote URL.

2. **Skip** if PR is closed, draft, or a trivial change (< 10 lines, auto-generated).

3. **Review each changed file** for:
   - **Bugs**: logic errors, race conditions, incorrect error handling, null pointer risks
   - **Security**: injection, exposed secrets, auth bypass, missing input validation
   - **CLAUDE.md violations**: check if any CLAUDE.md exists in the repo and verify compliance (check project root and `@CLAUDE.md` if it exists)
   - **Correctness**: off-by-one, wrong comparison, incorrect API usage, type mismatches

4. **Prioritize high-signal issues only.** Do NOT flag:
   - Style nits, formatting, naming preferences
   - Pre-existing issues not introduced by this PR
   - Things a linter catches
   - Subjective improvements

5. **Output** as:

   ## Code review — PR #$1

   ### Files reviewed
   - file1.ts (changes)
   - file2.ts (changes)

   ### Issues found
   1. **Bug**: Description of the bug (file.ts:line)
      - Why it's wrong and how to fix it

   2. **Security**: Description (file.ts:line)
      ...

   ### No issues found (if clean)
   No issues found. Checked for bugs, security issues, and CLAUDE.md compliance.
