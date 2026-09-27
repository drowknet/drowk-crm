# PWM WP-02 Work Engine Transfer

Status: PRESERVED DOMAIN INPUT

The PWM Work/Next Action Engine is not legacy UI glue. It contains tested domain
semantics that DROWK CRM should preserve unless an explicit later decision changes
them.

## Preserve

### Work states

```text
NEEDS_ACTION
REVIEW
WAITING
SCHEDULED
BLOCKED
NO_ACTION
DONE
CANCELLED
SUPERSEDED
```

Meaning:
- NEEDS_ACTION — actionable owner work now/by due date;
- REVIEW — conflict, ambiguity or missing critical information;
- WAITING — waiting on customer/third party;
- SCHEDULED — intentionally deferred to a known future date;
- BLOCKED — action exists but prerequisite/evidence is missing;
- NO_ACTION — explicit no-immediate-action;
- DONE/CANCELLED/SUPERSEDED — terminal/history.

Do not transform WAITING/SCHEDULED/NO_ACTION into generic follow-up merely because
time passed.

### Attention classes

```text
HARD_STOP_REVIEW
OVERDUE
DUE_TODAY
NEEDS_HUMAN_REVIEW
READY_HIGH
READY_NORMAL
BLOCKED_NEEDS_OWNER
WAITING
SCHEDULED
NO_ACTION
```

Attention is not event recency. Stable sorting should preserve severity, due state,
priority, due date, last activity and a deterministic final tie-breaker.

### Autonomy

```text
A0_OBSERVE
A1_SUGGEST
A2_PREPARE
A3_CONFIRMED_EXECUTE
A4_POLICY_AUTO
A5_NEVER_AUTO
```

The legacy WP-02 did not execute actions. DNC/commercial hard stops map to A5.
Ambiguous/review/research work remains A1. Preparation actions were bounded to A2.

### Source precedence

Preserve the principle:
1. hard policy/CRM constraints;
2. explicit human/core Tasks;
3. deterministic core state;
4. eligible Shadow/AI suggestion;
5. legacy/default fallback.

Conflict is evidence. Human/core wins over Shadow and the conflict is audited.

### Idempotency and supersession

- deterministic Work Key from stable context;
- rerun unchanged inputs without duplicate active work;
- preserve Created At for same logical work;
- update fingerprint on changed authoritative input;
- supersede replaced work instead of silently deleting it;
- keep source evidence attached.

### High-value reason codes

Preserve at least the semantics of:
- MISSING_CRITICAL_IDENTITY
- AMBIGUOUS_CONVERSATION_LINK
- MULTIPLE_ACTIVE_TASKS
- TASK_DUE_CONFLICT
- TASK_PRIORITY_CONFLICT
- TASK_OWNER_CONFLICT
- TASK_WAITING_CONFLICT
- TASK_ACTION_CONFLICT
- CORE_ACTION_CONFLICT
- CORE_TASK_CONFLICT
- SHADOW_CONFLICT_CORE_WINS
- PARENT_TERMINAL_CONFLICT
- MISSING_POLICY_DATE
- MISSING_DATE
- MISSING_SNOOZE_DATE
- MISSING_CONTACT
- PURSUIT_BLOCKED
- COMMERCIAL_EXCLUSION_EXISTING_PWM
- COMMERCIAL_EXCLUSION_HOLD
- EXCLUSION_RECONCILIATION

## Adapt

The DROWK version should replace sheet rows with PostgreSQL/domain records and use
tenant/run/policy/source-watermark lineage, but preserve behavioral meaning.

The old Apps Script implementation is reference code. The domain semantics and
golden regression cases are the reusable asset.
