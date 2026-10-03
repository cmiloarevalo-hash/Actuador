# Generic Workflow V2 — Operational Plan

**Status:** ACTIVE
**Class:** CONTROL
**Authority:** Current operational workflow represented by the integrated repository revision
**Purpose:** Define the generic operating protocol for Human + Supervisor + Implementer + GitHub, with optional explicitly activated subordinate profiles.
**Related:** `WORKFLOW_FOUNDATIONS.md` contains stable principles. `DOCUMENT_CONTROL_PROTOCOL.md` governs documentation. `docs/engineering/*` defines GoFlow itself.

---

## 0. Operating model

The workflow is:

~~~text
CORE
+ 0..N EXPLICITLY ACTIVATED SUBORDINATE PROFILES
+ CURRENT PROJECT SPECIFICATIONS
~~~

The core remains usable with zero profiles.

The core governs:

- Human / Supervisor / Implementer authority;
- GitHub as durable memory/evidence;
- Work Item lifecycle;
- Semantic Scope, Path Scope and Resource Scope;
- baseline/ref/SHA/version/freshness;
- verification and evidence;
- Supervisor review;
- STOP/escalation;
- merge and publication boundaries;
- recovery.

Profiles add bounded operational capability. They do not replace or override the core.

`MULTIPLE PROFILES != AUTOMATIC COMPOSITION`.

GoFlow remains the accepted deterministic helper for this repository. Generic Workflow V2 does not modify GoFlow code, tests, CI or engineering contracts.

---

## 1. Source precedence and authority

For an active activity, use this precedence:

1. current Human decisions for reserved/material intent;
2. current Supervisor authority persisted in the governing Work Item/review;
3. active Work Item;
4. this workflow core;
5. current project specifications in their proper technical/product domain;
6. explicitly activated subordinate profiles;
7. accepted evidence;
8. fresh external research only when materially required.

Rules:

- evidence does not create authority;
- technical capability does not create authority;
- a profile does not create authority by existing;
- a branch/PR does not become current truth by existing;
- a shorter summary cannot silently weaken a governing rule;
- a material conflict or ambiguous precedence is STOP;
- historical/provenance material does not silently become current authority.

Legacy state vocabulary may appear in historical evidence. For current core operation:

~~~text
SEMANTIC_ACCEPTED → compatibility/provenance equivalent of ACCEPT
HOLD              → compatibility/provenance equivalent of BLOCK
~~~

These mappings do not create additional current Supervisor states.

---

## 2. Core roles

### 2.1 Human Operator

The Human:

- defines product/workflow intent;
- resolves material trade-offs and exceptions;
- authorizes material scope/authority changes;
- provides or authorizes credentials, account permissions and cost-bearing commitments when needed;
- retains publication authority by default when an external/product publication exists;
- may explicitly delegate a bounded action;
- is not the routine technical message bus.

### 2.2 Web Chat Supervisor

The Supervisor:

- reconstructs current authority from durable sources;
- translates Human intent into bounded Work Items;
- verifies Objective, Acceptance Criteria and all applicable scopes;
- identifies baseline/version/freshness requirements;
- determines whether subordinate profiles are needed and explicitly activates them;
- reviews exact delivered state independently;
- decides only `ACCEPT / REWORK / BLOCK / ESCALATE`;
- verifies integration/merge conditions separately from `ACCEPT`;
- escalates reserved/material decisions.

The Supervisor must not infer authority from credentials, tools, CI, profile availability or technical access.

### 2.3 GPT Work / Implementer

The Implementer:

- bootstraps from the Work Item and durable state;
- reads only necessary context;
- verifies repository/resource/baseline identity before material action;
- operates only within Semantic Scope + Path Scope + Resource Scope as applicable;
- implements or executes the authorized objective;
- performs proportional verification;
- inspects the complete relevant diff/state;
- persists branch/PR/SHA/evidence when repository changes exist;
- reports unexpected findings;
- stops on material mismatch;
- returns `READY_FOR_SUPERVISOR_REVIEW` only as a review signal.

The Implementer must not:

- silently expand Objective or Acceptance Criteria;
- silently expand any scope;
- redefine architecture/workflow authority without authorization;
- self-approve;
- issue `ACCEPT`;
- declare merge authority from tests or access;
- merge by inference;
- publish by inference.

### 2.4 Git / GitHub

GitHub is the durable coordination/evidence plane for:

- Work Items;
- branches/refs;
- commits;
- Pull Requests;
- diff;
- CI/checks when configured;
- evidence references;
- review decisions;
- history and recovery.

GitHub state is evidence. It does not independently issue semantic decisions.

### 2.5 GoFlow

GoFlow performs deterministic routing, state, scope, verification, CI inspection and review packaging according to its existing engineering contract.

Conceptual role:

~~~text
route
+ state
+ verify
+ signal
~~~

GoFlow:

- does not approve semantically;
- does not create workflow authority;
- does not infer missing scope;
- does not turn `CI_NOT_CONFIGURED` into PASS;
- does not activate subordinate profiles;
- does not become a profile registry service.

### 2.6 Subordinate actor/profile

A subordinate actor is an agent, application, tool, platform, service or other technical participant operating through an explicitly activated profile.

It supplies capability, not authority.

---

## 3. Work Item contract

Every material task is governed by a durable Work Item.

The current GoFlow Issue grammar remains the seven H2 sections already defined by GoFlow:

~~~text
## Objective
## Acceptance Criteria
## Authorized Scope
## Relevant Sources
## Local Verification
## Required CI
## Base SHA
~~~

Generic V2 does not require a parser change.

The semantic contract represented by those sections must cover:

### Objective

What the activity must achieve.

### Acceptance Criteria

Observable conditions that define successful completion.

### Authorized Scope

Must make applicable scope dimensions reconstructable:

- **Semantic Scope** — behavior/result authorized;
- **Path Scope** — repository paths allowed;
- **Resource Scope** — external/material resources and operations allowed.

Current GoFlow compatibility is strict:

- the canonical seven-H2 Issue grammar remains unchanged;
- backticked bullet entries under `## Authorized Scope` are **Path Scope only** and are parsed as repository paths by current GoFlow;
- Semantic Scope remains derived from Objective + Acceptance Criteria and applicable governing prose;
- Resource Scope must be recorded as non-path prose after the Path Scope list, in an applicable governing decision, or in an explicitly activated subordinate activity record;
- external resource identifiers must not be formatted as backticked `Authorized Scope` bullets that GoFlow can misread as repository paths;
- GoFlow does not mechanically validate Resource Scope; the acting recipient and Supervisor must review it independently.

Resource Scope is a contract concept, not a new authority system or required new file.

### Relevant Sources

Minimum canonical sources needed to execute/review safely.

### Local Verification

Checks/evidence required before handoff, when applicable.

### Required CI

Expected remote automated evidence. Absence of configured CI is reported as absence, never as PASS.

### Base SHA / baseline

Exact starting identity for repository work. Non-repository activities may additionally require artifact/version/environment/resource identity.

A scope/base mismatch is STOP.

---

## 4. Scope model

### 4.1 Semantic Scope

Derived primarily from Objective + Acceptance Criteria.

It answers:

> What intended behavior/result is authorized to change?

A path being writable does not expand Semantic Scope.

### 4.2 Path Scope

Defines repository paths/files/modules that may change.

GoFlow continues to validate repository path scope according to its current engineering contract.

Path Scope does not authorize:

- unrelated behavior;
- external resource mutation;
- credentials;
- paid commitments;
- deployment/publication;
- profile activation.

### 4.3 Resource Scope

Defines material non-path resources when applicable, for example:

- workspace or execution environment;
- account/provider;
- API/service;
- database/data store;
- device;
- cloud/hosting/CDN/DNS;
- artifact/build target;
- credential/secret use;
- cost-bearing resource;
- deployment target.

Resource Scope should be the smallest useful description that makes allowed targets/operations unambiguous.

When Resource Scope is written in a Work Item's `## Authorized Scope` section, place it as ordinary non-path prose after the backticked Path Scope bullet list. Do not encode resource/account/API/device identifiers as backticked bullets. Current GoFlow validates Path Scope mechanically but does not mechanically enforce Resource Scope.

### 4.4 Independent-pass rule

A material activity is valid only when all applicable scope dimensions pass independently.

~~~text
PATH PERMISSION != SEMANTIC PERMISSION
RESOURCE ACCESS != RESOURCE AUTHORITY
~~~

A newly discovered path/resource requirement outside authorization produces STOP → Supervisor.

---

## 5. Baseline, identity, version and freshness

Before material action, identify enough state to make the operation and its evidence reproducible.

Repository work normally includes:

- repository identity;
- Base SHA;
- branch/ref;
- current HEAD;
- working-tree/change state where available.

Other activity may require:

- artifact/build hash;
- package/runtime/tool version;
- profile revision;
- environment/device identity;
- external resource identity;
- protocol/specification version;
- date/version scope for volatile external facts.

Rules:

1. authorization applies to the identified baseline/scope;
2. evidence applies to the identity it actually verified;
3. a new material SHA/version/artifact/resource state does not silently inherit old evidence or acceptance;
4. stale evidence must be marked/repeated rather than reused silently;
5. “latest” external facts are researched only when material;
6. current external research records version/date scope and separates verified fact from inference.

Research is a gate, not a default reading burden.

---

## 6. Bootstrap and recovery

### 6.1 Actor bootstrap

Before editing, review, delegation or external mutation, reconstruct:

1. recipient role/actor assignment;
2. repository/project identity;
3. current Human/Supervisor authority;
4. Work Item;
5. current activity/phase;
6. Objective and Acceptance Criteria;
7. Semantic Scope;
8. Path Scope;
9. Resource Scope;
10. Base/baseline and current state;
11. current project specifications;
12. explicitly activated subordinate profiles;
13. required verification/CI;
14. unresolved blockers or prior REWORK/BLOCK/ESCALATE;
15. return/next actor routing.

Then read only the minimum relevant project/index/code/test sources.

### 6.2 Mandatory recipient routing gate

Before executing an operational prompt, the recipient must validate the Prompt Routing Envelope against current durable state:

1. `TARGET_ROLE` matches the receiving workflow role;
2. `REPOSITORY` matches the repository/project being operated;
3. `WORK_ITEM` is the governing active Work Item;
4. `ACTIVITY` matches the current durable activity/phase;
5. HEAD/baseline and authority reference match when material;
6. the prompt/handoff has not been superseded by a newer durable Human/Supervisor routing or decision.

A wrong recipient, wrong repository, wrong Work Item, wrong activity, materially stale prompt/handoff or unverifiable routing is fail-closed:

~~~text
STOP
RESULT: ROUTING_MISMATCH
OBSERVED_ROLE:
EXPECTED_TARGET_ROLE:
REPOSITORY:
WORK_ITEM:
OBSERVED_ACTIVITY:
EXPECTED_ACTIVITY:
REASON:
LATEST_DURABLE_REF:
RETURN_TO:
STATE: BLOCKED_ROUTING
~~~

On `ROUTING_MISMATCH`:

- do not execute the requested task;
- do not mutate repository or external resources;
- do not reinterpret the prompt as work for another role;
- do not reuse an older handoff as the requested current deliverable;
- request corrected routing from the emitting/governing actor.

Read-only checks needed to establish routing identity or mismatch are allowed.

### 6.3 General mismatch gate

If authority, scope, baseline, profile activation, resource identity, required source or other material state is ambiguous or contradictory after routing passes:

~~~text
STOP
RESULT: BLOCKED
EVIDENCE: <durable reference>
RETURN: SUPERVISOR
~~~

Do not fabricate a missing baseline, permission, credential or project fact.

### 6.4 Supervisor identity gate

Supervisor identity means current workflow assignment, not self-asserted identity or personal authentication.

At bootstrap, after replacement/interruption, and after a material routing mismatch, a Supervisor session must establish from durable state:

- expected role = Supervisor;
- repository;
- Work Item;
- current activity/phase;
- latest applicable Human requirement/decision;
- latest applicable Supervisor decision/routing instruction;
- exact review HEAD/baseline when state-bound;
- unresolved REWORK/BLOCK/ESCALATE;
- next authorized Supervisor action.

If the assignment cannot be reconstructed durably:

~~~text
STOP
REASON: SUPERVISOR_IDENTITY_UNVERIFIED
ACTION: ROUTE_OR_START_FRESH_SUPERVISOR_SESSION
→ apply AI_ACTOR_ONBOARDING
~~~

Opening a fresh chat does not itself establish authority; the new Supervisor must pass the same identity/routing gate before continuing.

### 6.5 Generic AI actor onboarding/replacement

Onboarding applies to Supervisor, Implementer and other AI actors independently of subordinate application/tool profiles. `ACTIVE_PROFILES: 0` is valid.

~~~text
AI_ACTOR_ONBOARDING

ROLE:
REPOSITORY:
WORK_ITEM:
CURRENT_ACTIVITY:
AUTHORITY_REFS:
SEMANTIC_SCOPE_REF:
PATH_SCOPE_REF:
RESOURCE_SCOPE_REF:
BASELINE / CURRENT_HEAD:
MINIMUM_SOURCE_REFS:
ACTIVE_PROFILES: <0..N>
LATEST_DECISION / BLOCKER:
OPEN_ITEMS:
NEXT_AUTHORIZED_ACTION:
RETURN_TO:
~~~

The new/replacement actor must:

1. load the durable pointers;
2. reconstruct current state from GitHub/canonical sources;
3. pass the recipient routing gate;
4. verify scopes, baseline and current activity;
5. continue only when assignment and authority are coherent.

No application-specific profile is required to onboard or replace a core AI actor.

### 6.6 Session recovery

A replacement session reconstructs from durable state:

~~~text
Work Item
→ latest CONTINUITY_CHECKPOINT when present
→ repository/ref/HEAD
→ current Human/Supervisor review/decision
→ current activity and intent
→ current project specifications
→ active profiles
→ relevant sources
→ open items/evidence/blockers
→ next authorized actor/action
~~~

The exact checkout/tool recovery mechanics may be profile/project-specific. The core requirement is verified identity/state before continuing.

---

## 7. End-to-end lifecycle

Normal lifecycle:

~~~text
Human intent
→ Supervisor analysis
→ bounded Work Item
→ Prompt Routing Envelope
→ mandatory recipient routing gate
→ Implementer bootstrap
→ optional explicit subordinate-profile activation
→ implementation / authorized operation
→ proportional local/external verification
→ complete diff/state inspection
→ branch/commit/PR when repository changes exist
→ exact-state handoff
→ Supervisor independent review
→ ACCEPT | REWORK | BLOCK | ESCALATE
→ if ACCEPT: separate integration/merge authority checks
→ merge only when explicitly authorized
→ post-merge/current-state reconciliation
→ external/product publication only under explicit authority
→ close when durable state is coherent
~~~

A profile invocation is a bounded subroutine inside this lifecycle; it is not a parallel governance lane.

---

## 8. Verification and evidence

### 8.1 Proportional verification

Verification should match the risk and Acceptance Criteria.

Default pattern:

~~~text
targeted local verification
→ inspect complete relevant diff/state
→ publish exact state
→ CI/remote evidence if configured/required
→ Supervisor review
~~~

Do not run every possible check by default when a smaller evidence set is sufficient. Do not omit broader checks when the risk requires them.

### 8.2 Evidence requirements

A reviewable delivery identifies as applicable:

- Work Item;
- branch/PR;
- exact HEAD/ref/version;
- changed paths/resources;
- local checks actually run;
- CI/check result for the exact HEAD;
- subordinate-actor activity/result;
- limitations and unavailable checks;
- unexpected findings;
- unresolved risks.

### 8.3 Evidence is not approval

~~~text
LOCAL PASS       != ACCEPT
CI_PASS          != ACCEPT
BUILD PASS       != ACCEPT
TEST PASS        != ACCEPT
PREVIEW PASS     != ACCEPT
EXTERNAL PASS    != ACCEPT
READY_FOR_SUPERVISOR_REVIEW != ACCEPT
~~~

GoFlow's `READY_FOR_SUPERVISOR_REVIEW` remains a mechanical review signal only.

### 8.4 Staleness

If HEAD or other material identity changes after verification:

- prior evidence remains historical;
- it is not silently attached to the new state;
- rerun affected verification or record why the prior evidence still applies;
- Supervisor review must bind to the exact state reviewed.

---

## 9. Supervisor review

The Supervisor reviews, as relevant:

- Objective and Acceptance Criteria;
- Semantic Scope;
- Path Scope;
- Resource Scope;
- current baseline/version/freshness;
- exact delivered state;
- complete diff or external mutation;
- architecture/interfaces/project specifications;
- tests and evidence;
- CI;
- active profile contracts and activity reports;
- temporary artifacts;
- complexity/duplication;
- unexpected findings;
- publication/merge/credential/cost boundaries.

Formal current decisions are only:

### ACCEPT

The reviewed exact state satisfies the Work Item semantically.

It does not grant merge or publication authority.

### REWORK

A correction is required while the objective remains generally valid.

Default continuity:

~~~text
same Work Item
+ same branch/PR where practical
+ focused correction
+ affected verification rerun
+ new exact-state handoff/review
~~~

### BLOCK

An objective impediment prevents valid continuation at present.

Examples include unavailable required environment, unverifiable baseline, missing required permission or external dependency failure.

### ESCALATE

A decision exceeds current Supervisor/Implementer authority or changes material intent, scope, cost, credential use, architecture/workflow governance or publication authority.

---

## 10. Current-decision rule

A decision is valid only for the exact material state it identifies.

Example:

~~~text
SHA A → REWORK
SHA B → ACCEPT
SHA C → new material commit
~~~

`ACCEPT` for B does not automatically accept C.

Legacy decisions can be read for provenance, but current review always uses the current vocabulary and binds to current exact state.

---

## 11. Integration, merge and publication

### 11.1 Integration/merge

`ACCEPT` is semantic review, not merge authority.

Before merge, the authorized actor must separately verify:

- reviewed HEAD/state is still current;
- target state is current;
- required CI/checks remain applicable;
- no relevant conflict/blocker appeared;
- merge authority is explicit.

The Implementer and subordinate actors do not self-merge.

Repository settings or merge-button access are technical capabilities, not authority.

### 11.2 Publication

When external/product publication exists:

~~~text
DEFAULT PUBLICATION AUTHORITY = HUMAN
~~~

Any delegation must be explicit, bounded and durable.

Preview, staging, deploy, upload, signing, store/provider access, production credentials, build success, merge or `ACCEPT` do not imply publication authority.

`PUBLISH` is never inferred.

---

## 12. Generic subordinate-profile model

### 12.1 Definitions

**Subordinate profile:** reusable operational contract for a bounded technical capability.

**Actor:** concrete agent/application/tool/platform/service executing under a profile.

**Activity:** one explicit invocation of a profile for a Work Item.

An actor may expose one or more profiles. Availability does not activate them.

### 12.2 What belongs in a profile

A profile may define:

- identity/function;
- technical capabilities;
- normal limits;
- activation trigger;
- allowed/prohibited operation types;
- default scope/resource boundaries;
- baseline/version compatibility;
- evidence format;
- freshness rules;
- lifecycle;
- STOP/escalation rules;
- composition policy.

A profile must not redefine:

- Human authority;
- Supervisor authority;
- Implementer authority;
- current decision vocabulary;
- Work Item authority;
- Semantic/Path/Resource Scope semantics;
- exact-state review;
- merge authority;
- publication authority;
- core recovery semantics.

### 12.3 What stays outside profiles

Concrete project/product intent remains in current project specifications and Work Items.

Examples of profile-local detail may include a toolchain, platform, execution environment or specialized evidence procedure. Concrete product behavior, target values and one-project decisions do not become profile rules merely because they are important.

---

## 13. Subordinate Profile Registry

The registry is simple durable governance metadata, not a runtime service.

It exists so a fresh session can identify recognized profiles without broad rediscovery.

Registry record:

~~~text
SUBORDINATE_PROFILE_REGISTRY_ENTRY

PROFILE_ID:
KIND: AGENT | APP | TOOL | PLATFORM | SERVICE | OTHER
CONTRACT_REF:
IDENTITY / FUNCTION:
ACTIVATION_TRIGGER:
RELATIONSHIP_TO_CORE: SUBORDINATE
LIFECYCLE: ACTIVE | SUPERSEDED | DEPRECATED | PROVENANCE_ONLY
LAST_REVIEWED:
BASELINE / VERSION NOTES:
COMPOSITION_POLICY: EXPLICIT_ONLY
COMPATIBILITY_NOTES:
~~~

Rules:

- the registry does not replace the profile contract or Work Item;
- listing a candidate/example does not register it;
- profile registration requires applicable explicit authority/review;
- zero registry entries is valid;
- lifecycle metadata is not a Supervisor semantic decision state;
- no registry automation/service is implied.

### 13.1 Current registry for this workflow repository

No subordinate profile is registered/activated by Generic Workflow V2 itself.

~~~text
ACTIVE SUBORDINATE PROFILES: 0
~~~

GoFlow is the repository's deterministic helper, not an automatically activated subordinate profile.

---

## 14. Explicit activation and activity protocol

### 14.1 Activation rules

A profile can be used only when:

1. the Work Item materially needs its capability;
2. the profile is recognized/current enough for the activity;
3. activation is explicit and durable;
4. the specific actor/target is identified when material;
5. scopes and baseline/version are known;
6. the operation is bounded;
7. required permission/credential/cost authority exists;
8. STOP conditions are defined.

Do not activate because:

- matching files exist;
- a technology/provider is detected;
- a tool is installed;
- credentials are visible;
- an App/integration has broad permissions;
- the actor says it can perform the action.

### 14.2 Activity request

~~~text
SUBORDINATE_ACTIVITY

WORK_ITEM:
PROFILE_ID:
ACTOR_ID:
OBJECTIVE:
PRECONDITIONS:
EXPLICIT_ACTIVATION_REF:
SEMANTIC_SCOPE:
PATH_SCOPE: <or N/A>
RESOURCE_SCOPE: <or N/A>
EXPECTED_BASELINE / SHA / VERSION:
ONE_ALLOWED_OPERATION:
PROHIBITED_OPERATIONS:
REQUIRED_EVIDENCE:
AUTHORITY_REF:
STOP_CONDITIONS:
RETURN_TO: SUPERVISOR | HUMAN
~~~

Rules:

- one activity authorizes only its stated operation;
- a second independent operation requires a new/updated explicit activity authorization;
- credentials/access do not expand the activity;
- if a mutation becomes materially larger than authorized, STOP;
- no automatic continuation from diagnose → mutate → verify → publish.

### 14.3 Activity report

~~~text
SUBORDINATE_REPORT

WORK_ITEM:
PROFILE_ID:
ACTOR_ID:
OBSERVED_BASELINE / SHA / VERSION:
OPERATION_EXECUTED:
RESULT: PASS | FAIL | BLOCKED
EVIDENCE_REFS:
MUTATIONS_PERFORMED:
FRESHNESS / STALENESS:
UNEXPECTED_FINDINGS:
UNRESOLVED:
STOP -> SUPERVISOR
~~~

A subordinate technical result never emits `ACCEPT`, merge eligibility, canonical adoption or publication authority.

---

## 15. Multiple-profile composition

For an active Work Item:

1. identify whether the core + project specifications are sufficient;
2. activate only profiles whose trigger materially applies;
3. list each activated profile explicitly;
4. identify overlapping operations/resources;
5. run a consistency check before execution;
6. establish precedence only from existing authority, never by tool capability;
7. stop on material contradiction or incompatible assumptions.

Invariant:

> `MULTIPLE PROFILES != AUTOMATIC COMPOSITION`

Composition policy is:

~~~text
EXPLICIT_ONLY
~~~

No profile may invoke another profile, delegate to another actor or chain a new side effect merely because the combination is technically possible.

---

## 16. Profile freshness, maintenance and retirement

Profiles are maintained through explicit bounded change, not silent drift.

For material profile use/change, verify:

- current contract reference;
- parent/core compatibility;
- current lifecycle;
- applicable version/baseline;
- `LAST_REVIEWED`;
- volatile external facts if material;
- evidence format;
- composition notes.

If a profile is replaced:

- mark prior registry entry `SUPERSEDED` or `PROVENANCE_ONLY`;
- identify the replacement explicitly;
- do not silently redirect historical Work Items/evidence.

If deprecated:

- record the state;
- do not activate for new work unless separately authorized;
- preserve evidence needed to reconstruct historical decisions.

Profile retirement does not delete provenance.

---

## 17. Current project specifications

Project specifications define concrete application/product facts such as:

- requirements;
- architecture;
- runtime/toolchain selected by the project;
- interfaces;
- behavior;
- target environments;
- supported devices/browsers;
- performance/quality budgets;
- deployment topology;
- product-specific verification.

The core and profiles describe **how authorized work is executed**.

They do not duplicate concrete project truth.

When project specifications are missing, stale or contradictory in a material way:

~~~text
STOP
→ report the specification gap
→ Supervisor/Human resolves authority/intent
~~~

---

## 18. Current execution strategy

### 18.1 Short pointer-based Prompt Routing Envelope

Normal operational prompts/handoffs use a compact routing envelope:

~~~text
TARGET_ROLE: <Supervisor | Implementer | other authorized role>
TARGET_ACTOR: <optional concrete actor/session when material>
REPOSITORY: <owner/repo>
WORK_ITEM: #<id>
ACTIVITY: <current bounded activity/objective id>
REVIEW_HEAD / BASELINE: <when exact state matters>
RETURN_TO: <governing actor when applicable>
NEXT_ACTOR: <next actor when onward routing applies>
AUTHORITY_REF: <optional durable Issue/comment/review pointer when material>
~~~

Required normal routing identity is `TARGET_ROLE + REPOSITORY + WORK_ITEM + ACTIVITY` plus `RETURN_TO` and/or `NEXT_ACTOR` as applicable. `TARGET_ACTOR`, exact HEAD/baseline and `AUTHORITY_REF` are added only when materially needed.

The envelope carries pointers, not the full specification. Work Item/GitHub state remains authority. A shorter prompt does not weaken the governing contract, and a newer durable activity/routing decision supersedes an older handoff for execution purposes.

The recipient must pass §6.2 before executing the prompt.

### 18.2 Selective context

Preferred reading order:

~~~text
Work Item
→ current authority/decision
→ Workflow Plan/Foundation as needed
→ current project specifications
→ explicitly activated profile contracts
→ indexed affected docs/code/tests
→ wider context only on demonstrated dependency
~~~

The Supervisor may read broader context than the Implementer.

### 18.3 Verification split

Default:

~~~text
Implementer
→ targeted local verification needed to develop the change
→ inspect complete task diff/state
→ commit/push when repository change exists

CI / external evidence systems
→ automated evidence for exact delivered state when configured

Supervisor
→ independent semantic review
→ ACCEPT | REWORK | BLOCK | ESCALATE
~~~

The exact local/global test mix is project/risk-specific.

### 18.4 Strict anti-overengineering rule

Do not introduce a framework, database, service, daemon, plugin system, registry runtime, generalized event bus, repository abstraction hierarchy, new governance layer or automation merely because Generic V2 could support it.

A new mechanism requires:

- an observed operational problem;
- a bounded Work Item;
- explicit Authorized Scope;
- evidence that a simpler existing mechanism is insufficient;
- independent Supervisor review.

Profiles are document/governance contracts first. They do not imply runtime orchestration.

### 18.5 Temporary/support artifacts

Temporary utilities, test adapters, generated processors, migration helpers, experiments and support artifacts must have an explicit lifecycle meaning.

At minimum, be able to answer:

~~~text
Why does it exist?
Which Work Item introduced it?
Is it product or support?
What depends on it?
When should it be removed/reclassified?
~~~

Do not create a separate persistent register unless observed need justifies it.

---

## 19. GoFlow compatibility and current controls

Generic V2 preserves existing GoFlow functions without changing their code.

### 19.1 Context

`wf begin` / `wf context` continue to read the canonical Issue grammar and route through `.workflow/index.json`.

The Issue remains authority; the Project Index is routing metadata and must not duplicate technical truth.

### 19.2 Scope

`wf scope` continues to inspect committed/staged/unstaged/untracked paths against the Work Item Base SHA and Authorized Scope.

Under current GoFlow, backticked bullet entries in `## Authorized Scope` are Path Scope only. Resource Scope must use the parser-safe representation defined in §3/§4.3 and is reviewed independently by actors/Supervisor.

GoFlow Path Scope checks do not replace Generic V2 Semantic Scope or Resource Scope review. GoFlow does not mechanically validate Resource Scope.

### 19.3 Verification

`wf verify` continues to execute only explicitly configured checks from authorized Base SHA configuration and to detect stale evidence according to its engineering contract.

Changing authorization/control files does not authorize itself.

### 19.4 CI

`wf ci` continues to bind PR/CI evidence to exact HEAD and distinguish:

- unavailable/authentication failures;
- absent PR;
- mismatched PR HEAD;
- `CI_NOT_CONFIGURED`;
- pending;
- fail;
- pass.

`CI_NOT_CONFIGURED` is not PASS.

### 19.5 Review

`wf review` continues to produce an ephemeral review package/signal.

`READY_FOR_SUPERVISOR_REVIEW` means the mechanical review prerequisites are coherent enough for independent review. GoFlow never emits `ACCEPT`.

---

## 20. Handoff, rework and recovery

### 20.1 Implementer handoff

Keep handoff compact:

~~~text
WORK ITEM:
BRANCH / PR:
BASE:
HEAD / VERSION:
CHANGED PATHS / RESOURCES:
ACTIVE PROFILES:
VERIFICATION:
CI:
UNEXPECTED FINDINGS:
UNRESOLVED:
STATE: READY_FOR_SUPERVISOR_REVIEW | BLOCKED
~~~

GitHub stores the detailed evidence.

### 20.2 REWORK

If Supervisor returns `REWORK`:

- keep the same Work Item/branch/PR when the objective remains valid;
- make a focused correction;
- rerun affected verification;
- publish new exact-state handoff;
- obtain a new Supervisor review.

Prior review remains provenance, not acceptance of the new state.

### 20.3 BLOCK / ESCALATE

`BLOCK` records an objective inability to proceed validly.

`ESCALATE` requests an authority/intent decision.

Neither authorizes an improvised workaround.

### 20.4 Replacement session

A new Implementer/Supervisor uses §6.5 onboarding and should be able to recover without the previous chat transcript.

The replacement must reconstruct the current thread/intent from GitHub durable state and pass the routing/identity gates before continuing.

### 20.5 Durable continuity checkpoint

Persist a derived recovery checkpoint in the active GitHub Work Item thread:

~~~text
CONTINUITY_CHECKPOINT

REPOSITORY:
WORK_ITEM:
ACTIVITY:
CURRENT_INTENT:
CURRENT_DECISION_REFS:
EXACT_STATE:
ACTIVE_PROFILES: <0..N>
OPEN_ITEMS:
NEXT_ACTOR:
NEXT_AUTHORIZED_ACTION:
SOURCE_REFS:
SUPERSEDES_CHECKPOINT:
~~~

Rules:

- the checkpoint is a pointer-based recovery snapshot/index, not a new authority source;
- Human decisions, the Work Item and applicable Supervisor decisions retain precedence;
- `CURRENT_INTENT` should point to current Objective/Acceptance Criteria/decision refs rather than duplicate full specifications;
- exact state identifies branch/PR/HEAD/version when applicable;
- a newer checkpoint supersedes an older checkpoint only as a recovery summary;
- checkpoint content must expose open items, next actor and next authorized action;
- detailed evidence remains in referenced GitHub state.

### 20.6 Continuity checkpoint cadence

A continuity checkpoint is mandatory when a material continuity event occurs, including:

- Human requirement/intent changes;
- Supervisor issues `ACCEPT / REWORK / BLOCK / ESCALATE`;
- current `ACTIVITY` or phase changes;
- material authority, scope, baseline or active-profile state changes;
- actor/session replacement is imminent or detected;
- routing mismatch/stale handoff occurs;
- a blocker/open decision changes the next authorized action.

For a long-running activity with no material event trigger, use a configurable fallback of approximately five operational prompts from the same actor since the last checkpoint as a continuity review/checkpoint trigger.

Prompt counting is never authority, never overrides an event trigger, and never substitutes for durable state verification. Tool calls, acknowledgements and non-operational chatter do not count as operational prompts. Projects/activities may tune the fallback threshold when justified without adding a runtime service or automation.

---

## 21. Optional enforcement mappings

Repository/tool-side controls may reinforce the workflow, for example:

- branch protection/rulesets;
- required reviews/checks;
- scoped tokens/tool permissions;
- approval gates;
- provider IAM restrictions.

These controls are optional mappings/evidence.

Rules:

- documentation is not technical enforcement by itself;
- technical enforcement does not create semantic authority;
- do not claim a control is enforced unless its actual state was verified;
- adding/changing repository-side enforcement requires separate explicit authorization;
- Generic V2 does not require or modify branch protection/rulesets by itself.

---

## 22. Adversarial acceptance checks

A Generic V2-compatible project should pass these conceptual tests.

### A. Zero profiles

Scenario: ordinary repository task needs no external/specialized capability.

Expected: core + project specifications are sufficient.

### B. Capability without authority

Scenario: Implementer or subordinate actor has production/cloud/merge credentials.

Expected: no extra operation is authorized by possession alone.

### C. Path vs semantic scope

Scenario: an authorized file can technically change unrelated behavior.

Expected: unrelated behavior remains prohibited.

### D. Resource scope

Scenario: repository path is authorized but database/provider mutation was not.

Expected: external mutation is STOP.

### E. Stale evidence

Scenario: tests passed for SHA A; HEAD is SHA B.

Expected: SHA A evidence is not silently treated as current.

### F. Profile availability

Scenario: repository contains technology matching a known profile.

Expected: profile remains inactive until explicit activation.

### G. Multiple profiles

Scenario: two profiles are individually applicable but their operations overlap.

Expected: consistency/precedence review; no automatic composition; material conflict => STOP.

### H. Technical PASS

Scenario: CI/build/external activity passes.

Expected: Supervisor still performs semantic review.

### I. Accepted change

Scenario: Supervisor issues `ACCEPT`.

Expected: merge still requires separate authority/checks.

### J. Publish capability

Scenario: actor can deploy/publish.

Expected: Human publication authority remains default unless explicit delegation exists.

### K. New operation

Scenario: subordinate actor completed one authorized diagnostic and can technically perform a fix.

Expected: no automatic continuation; new operation requires explicit authorization.

### L. Recovery

Scenario: replacement session cannot verify baseline/resource/profile state.

Expected: STOP rather than inventing state.

### M. Wrong/stale routing

Scenario: prompt targets the wrong role/repository/Work Item/activity or reuses a superseded handoff.

Expected: `STOP / ROUTING_MISMATCH`; no task execution; request corrected routing.

### N. Supervisor replacement

Scenario: a fresh Supervisor session cannot establish its assignment from durable state.

Expected: STOP and generic AI onboarding; `ACTIVE_PROFILES: 0` remains valid.

### O. Continuity drift

Scenario: a long activity crosses a material event or reaches its configured prompt-count fallback without a recovery checkpoint.

Expected: persist/update `CONTINUITY_CHECKPOINT` in GitHub before further dependent work; prompt count itself grants no authority.

### P. Resource parser compatibility

Scenario: an external resource must be authorized while current GoFlow parses backticked `Authorized Scope` bullets as paths.

Expected: path bullets remain Path Scope only; Resource Scope is non-path prose/governing decision/activity data and is reviewed independently.

---

## 23. Definition of reviewable V2 operation

A Work Item is ready for Supervisor review when, as applicable:

- current authority is known;
- the Prompt Routing Envelope matches role/repository/Work Item/current activity;
- any applicable Supervisor identity/onboarding gate passed;
- current continuity state is recoverable from GitHub durable pointers/checkpoint;
- Objective and Acceptance Criteria remain unchanged unless explicitly revised;
- Semantic Scope passes;
- Path Scope passes;
- Resource Scope passes;
- Base/baseline and delivered identity are explicit;
- current project specifications were respected;
- active profiles were explicitly activated;
- profile operations remained bounded;
- no automatic composition occurred;
- required verification is current;
- CI/status is reported truthfully;
- complete relevant diff/state was inspected;
- unexpected findings are reported;
- no self-approval occurred;
- no merge/publication was inferred;
- handoff identifies exact state.

The final decision remains with the Supervisor.
