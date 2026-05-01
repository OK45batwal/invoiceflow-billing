# GSD Runbook

> Operational procedures for debugging, validation, and recovery.

---

## Render Deployment — Email Configuration

### Why not SMTP?

Render free-tier web services **block all outbound SMTP** (ports 25, 465, 587).
InvoiceFlow Pro sends OTP emails via the **Resend HTTP API** (HTTPS port 443),
which Render allows on every plan including free.

### One-time Resend setup

1. Create a free account at <https://resend.com>.
2. **Add your sending domain** under *Domains* and follow the DNS verification steps
   (add the provided MX / TXT / DKIM records to your DNS provider).
   - During development, Resend lets you send to your own verified email address without a custom domain.
3. Go to *API Keys* and create a key with **Sending access**.
4. Copy the key — you will only see it once.

### Environment variables to set in Render Dashboard

| Variable | Example value | Notes |
|---|---|---|
| `RESEND_API_KEY` | `re_abc123…` | From the Resend dashboard |
| `RESEND_FROM` | `InvoiceFlow Pro <otp@yourdomain.com>` | Must match your verified domain |
| `OTP_APP_NAME` | `InvoiceFlow Pro` | Appears in email subject & body |

> **Do not** add `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, or `SMTP_FROM` — those variables are no longer used.

### Local development (no Resend account required)

Leave `RESEND_API_KEY` and `RESEND_FROM` unset in your `.env`.
The server will detect their absence and print the OTP to the console, returning
it in the API response as `developmentOtp`. The login page displays it automatically.

### Free-tier limits

| Limit | Value |
|---|---|
| Emails per month | 3,000 |
| Emails per day | 100 |
| Custom domains | 1 |

For a low-traffic internal billing tool these limits are well within range.
If you exceed them, Resend will return a `429` error and the `/send-otp` endpoint
will respond with HTTP 400 and a clear error message.

---

## Quick Commands

### Status Check

**PowerShell:**
```powershell
# Current git status
git status

# Recent commits
git log --oneline -10

# Current branch
git branch --show-current
```

**Bash:**
```bash
# Current git status
git status

# Recent commits
git log --oneline -10

# Current branch
git branch --show-current
```

---

## Wave Validation

### Verify Wave Completion

**Before marking a wave complete:**

1. All tasks have commits:
   ```powershell
   git log --oneline -N  # N = number of tasks in wave
   ```

2. All verifications passed (documented in SUMMARY.md)

3. STATE.md updated with current position

4. State snapshot created

### Wave Rollback

**If a wave needs to be reverted:**

```powershell
# Find commit before wave started
git log --oneline -20

# Reset to that commit (keeps changes staged)
git reset --soft <commit-hash>

# Or hard reset (discards changes)
git reset --hard <commit-hash>
```

---

## Debugging Procedures

### 3-Strike Rule

After 3 consecutive failed debug attempts:

1. **Stop** — Don't try a 4th approach in same session

2. **Document** in STATE.md:
   ```markdown
   ## Debug Session
   
   **Problem:** {description}
   
   **Attempts:**
   1. {approach 1} → {result}
   2. {approach 2} → {result}
   3. {approach 3} → {result}
   
   **Hypothesis:** {current theory}
   
   **Recommended next:** {suggested approach}
   ```

3. **Fresh session** — Start new conversation with documented context

### Log Inspection

**Find relevant logs:**

```powershell
# Search for error patterns
Select-String -Path "*.log" -Pattern "error|exception|failed" -CaseSensitive:$false
```

```bash
# Search for error patterns
grep -ri "error\|exception\|failed" *.log
```

---

## Verification Commands

### Build Verification

```powershell
# Node.js
npm run build
if ($LASTEXITCODE -eq 0) { Write-Host "✅ Build passed" }

# Python
python -m py_compile src/**/*.py
```

### Test Verification

```powershell
# Node.js
npm test

# Python
pytest -v

# Go
go test ./...
```

### Lint Verification

```powershell
# Node.js
npm run lint

# Python
ruff check .

# Go
golangci-lint run
```

---

## State Recovery

### From STATE.md

When resuming work:

1. Read STATE.md for current position
2. Check "Last Action" for context
3. Follow "Next Steps" to continue
4. Verify recent commits match documented progress

### From Git History

If STATE.md is outdated:

```powershell
# See recent work
git log --oneline -20

# Check specific commit details
git show <commit-hash> --stat

# View file at specific commit
git show <commit-hash>:path/to/file
```

### Context Pollution Recovery

If quality is degrading mid-session:

1. Create state snapshot immediately
2. Update STATE.md with full context
3. Commit any pending work
4. Start fresh session
5. Run `/resume` to reload context

---

## Search Commands

### Find in Codebase

**PowerShell:**
```powershell
# Find pattern in files
Select-String -Path "src/**/*.ts" -Pattern "TODO" -Recurse

# Find files by name
Get-ChildItem -Recurse -Filter "*.config.*"
```

**Bash:**
```bash
# Find pattern in files (with ripgrep)
rg "TODO" --type ts

# Find pattern in files (with grep)
grep -r "TODO" src/

# Find files by name
find . -name "*.config.*"
```

### Search-First Workflow

Before reading any file:

1. Search for relevant terms:
   ```powershell
   Select-String -Path "**/*.md" -Pattern "architecture" -Recurse
   ```

2. Identify candidate files from results

3. Read only relevant sections:
   ```powershell
   Get-Content file.md | Select-Object -Skip 49 -First 20  # Lines 50-70
   ```

---

## Common Issues

### "SPEC.md not FINALIZED"

**Cause:** Planning lock prevents implementation

**Fix:**
1. Open `.gsd/SPEC.md`
2. Complete all required sections
3. Change status to `Status: FINALIZED`
4. Retry command

### "Context degrading"

**Symptoms:** Shorter responses, skipped steps, inconsistency

**Fix:**
1. Create state snapshot
2. Commit current work
3. Start fresh session
4. Run `/resume`

### "Commit failed"

**Causes:** Staged conflicts, hook failures

**Debug:**
```powershell
git status
git diff --staged
```

---

## Checklist Templates

### Pre-Execution Checklist

- [ ] SPEC.md is FINALIZED
- [ ] ROADMAP.md has current phase
- [ ] STATE.md loaded and understood
- [ ] Previous wave verified complete

### Post-Wave Checklist

- [ ] All tasks committed
- [ ] Verifications documented
- [ ] STATE.md updated
- [ ] State snapshot created
- [ ] No uncommitted changes

### Session End Checklist

- [ ] Current work committed
- [ ] STATE.md has "Next Steps"
- [ ] JOURNAL.md updated (if milestone)
- [ ] No loose ends

---

*See PROJECT_RULES.md for canonical rules.*
*See docs/model-selection-playbook.md for model guidance.*
