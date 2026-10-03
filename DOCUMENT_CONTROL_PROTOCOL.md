# Document Control Protocol

**Status:** ACTIVE  
**Authority:** Documentation governance for this repository  
**Applies to:** Human operators, Web Supervisors, Coding Agents, GPT Work, and automation tools  
**Purpose:** Keep project documentation minimal, authoritative, traceable, and safe for AI consumption.

## 1. Governing principle

The repository must not become a document dump.

Every persistent document must have:

1. one defined purpose;
2. one information class;
3. one current authority;
4. a known reader;
5. a known update trigger;
6. a clear lifecycle state.

If those properties cannot be stated, the information should not become a new persistent document.

## 2. Canonical-information rule

For any operational fact, there should be one canonical current source.

Examples include the current runtime version, architecture decision, work item, verification state, and project status.

A second file must not independently restate the same current fact as another authoritative source unless it is a justified machine-generated view.

When a current fact changes, update the canonical source.

Do not create copies such as:

~~~text
ARCHITECTURE_v2.md
ARCHITECTURE_final.md
ARCHITECTURE_final_new.md
CONFIG_old.md
CONFIG_fixed.md
~~~

Git history already preserves previous versions.

## 3. Information classes

Every persistent document must belong to one of these classes.

### NORMATIVE

Defines what the project is intended to be or how it must operate.

Examples:

- requirements;
- architecture;
- accepted engineering rules;
- active configuration baseline;
- accepted ADRs.

Normative documents can authorize future work.

### CONTROL

Defines the current operational state of the workflow.

Examples:

- current work item;
- project state;
- supervisor handoff;
- workflow status.

Control documents are current-state documents and should remain compact.

### EVIDENCE

Records an observed result tied to a specific execution or revision.

Examples:

- verification result;
- test result;
- agent run result;
- CI result;
- review result.

Evidence does not automatically become a requirement or architecture decision.

### HISTORICAL

Preserves information that is no longer operationally current but still has justified historical value.

Historical information must not compete with current authoritative information.

## 4. Document admission gate

Before creating a persistent document, answer all of the following:

1. **Purpose:** What exact problem does this document solve?
2. **Class:** Is it NORMATIVE, CONTROL, EVIDENCE, or HISTORICAL?
3. **Authority:** Is it authoritative, derived, or informational?
4. **Reader:** Who needs to read it?
5. **Writer:** Who is responsible for updating it?
6. **Trigger:** What event causes it to be updated?
7. **Lifetime:** Is it persistent, task-scoped, or temporary?
8. **Overlap:** Does an existing document already contain this information?
9. **Removal test:** What would fail if this document did not exist?

A new document is admitted only when its purpose cannot be satisfied cleanly by updating an existing canonical document.

## 5. Document lifecycle

Allowed lifecycle states:

~~~text
DRAFT
ACTIVE
SUPERSEDED
ARCHIVED
~~~

### DRAFT

Being prepared and not yet authoritative.

### ACTIVE

Current and applicable.

There should normally be only one ACTIVE canonical document for a given information responsibility.

### SUPERSEDED

Replaced by a specific newer authoritative source.

A superseded document must identify its replacement.

### ARCHIVED

Retained only for justified historical reference.

Archived material is excluded from normal agent context unless explicitly required.

## 6. Update-in-place rule

Current-state documents are updated in place.

Examples:

~~~text
PROJECT_STATE.md
CONFIGURATION_BASELINE.yaml
ARCHITECTURE.md
~~~

When their content changes, Git history preserves the previous revision.

Do not preserve obsolete operational state inside an active document merely to maintain history.

Historical explanations belong in Git history, ADRs when the reason for a decision matters, or a justified archive when Git history alone is insufficient.

## 7. No duplicate truth

Two ACTIVE documents must not independently define the same operational fact.

If duplication is discovered:

1. identify the intended canonical source;
2. migrate the current fact to that source;
3. replace duplicate statements with a reference where necessary;
4. remove or reclassify the duplicate document;
5. verify that agents will encounter only one current authority.

If two authoritative documents disagree and precedence is not explicitly defined, treat the condition as a document conflict, not as permission for an agent to guess.

## 8. Positive-current-state rule

Active operational documents should state the current accepted value directly.

Preferred:

~~~text
Python runtime: 3.14
~~~

Avoid maintaining obsolete values inside active instructions such as:

~~~text
Do not use Python 3.12.
We previously used Python 3.12.
Never install Python 3.12.
~~~

Historical values belong outside normal operational context.

This reduces stale-context contamination for AI agents.

## 9. Temporary information

Temporary notes, debugging observations, experiments, and scratch material do not automatically qualify as persistent documentation.

Temporary information must either:

1. be incorporated into an existing canonical document;
2. become a justified evidence record;
3. become an accepted ADR or requirement;
4. be discarded.

Temporary material must not remain indefinitely as ambiguous documentation.

Avoid persistent generic files such as:

~~~text
notes.md
ideas.md
temp.md
scratch.md
misc.md
old.md
todo2.md
~~~

unless their lifecycle and role are explicitly governed.

## 10. Agent-generated documents

An AI agent may not create a new persistent CONTROL or NORMATIVE document merely because it considers one useful.

Before creating such a document, the agent must:

1. check whether an existing canonical document should be updated instead;
2. identify the proposed document class and purpose;
3. confirm that it does not duplicate existing authority;
4. follow the current workflow authorization rules.

Task-scoped evidence may be created automatically when the workflow explicitly requires it.

## 11. Naming rules

Use stable engineering names.

Preferred characteristics:

- uppercase descriptive names for repository-level control documents;
- established engineering terminology where available;
- no version numbers in filenames for living documents;
- no words such as final, latest, new, fixed, or copy;
- IDs for bounded records where multiple instances are expected.

Examples:

~~~text
ARCHITECTURE.md
PROJECT_STATE.md
ADR-0007.md
WI-0024.md
WI-0024-R01.md
~~~

Git provides document version history.

## 12. Directory rules

Directories are created by information responsibility, not by convenience.

A directory should exist only when it contains a stable category with multiple legitimate records or has a clear architectural purpose.

Do not create deep directory hierarchies preemptively.

The current repository should remain shallow until document volume justifies further organization.

## 13. Index and discoverability

README.md is the canonical navigation index for persistent documentation in this repository.

Do not maintain a second manual registry that merely repeats the list of documents.

The workflow may use a separate **Project Index** for selective AI retrieval. That index has a different responsibility: it maps topics, engineering sections, components, source paths, symbols, tests and related artifacts to their canonical locations.

The Project Index must contain routing metadata only. It must not copy the technical facts it points to.

Its exact implementation may be Markdown, machine-readable data, generated data, or a hybrid, and is defined by the workflow design rather than by this document registry rule.

## 14. Archiving policy

Archive only information with continuing historical value that cannot be adequately recovered from Git history.

Archiving is not the default response to every replaced file.

Prefer:

~~~text
update canonical file
+ Git history
~~~

over:

~~~text
move old copy to archive
+ create new copy
~~~

This prevents the repository from accumulating multiple competing versions.

## 15. Deletion policy

A document should be removed when:

- its purpose no longer exists;
- its information has been incorporated into a canonical source;
- it is an obsolete duplicate;
- it was temporary and its useful information has been resolved;
- Git history is sufficient for traceability.

Deletion from the current tree does not erase Git history.

## 16. Review triggers

Documentation control should be reviewed when:

- a new control or normative file is proposed;
- a document changes authority or lifecycle state;
- two files appear to define the same fact;
- a new agent misinterprets documentation;
- context loading becomes excessive;
- a project phase changes materially;
- the workflow itself changes.

## 17. Minimum-document principle

The target is not maximum documentation.

The target is the minimum set of documents required to preserve correctness, continuity, traceability, and agent orientation.

Every new document adds reading cost, token cost, maintenance cost, synchronization risk, and ambiguity risk.

Therefore each document must justify its continued existence.

## 18. Current repository rule

Keep the repository intentionally small.

README.md is the canonical list and navigation surface for current persistent documentation. This protocol must not duplicate that list because doing so would create another synchronization point.

Additional files should be created only after the workflow design identifies a concrete responsibility that cannot be handled cleanly by an existing canonical document.

## 19. Document change checklist

Before committing a documentation change, verify:

~~~text
[ ] Information class is known.
[ ] Existing canonical location was checked first.
[ ] Current truth is being updated rather than duplicated.
[ ] Lifecycle state is clear.
[ ] Obsolete operational information is not being kept active.
[ ] Temporary material is not being promoted accidentally.
[ ] The change reduces or preserves ambiguity.
[ ] A future agent can identify the authoritative source.
~~~

## 20. Core rule

> Prefer one maintained canonical document over multiple explanatory copies.

The documentation system must make it easier for an AI agent to find the correct current information than to find obsolete, duplicated, or experimental information.
