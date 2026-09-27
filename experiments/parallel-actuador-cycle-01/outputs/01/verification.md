# Task 01 candidate verification

| Case | Expected |
|---|---|
| idle cycle | exactly one initial repository-wide GET |
| comments only from unrelated Issues | zero activation candidates |
| comment from #31 | retained as IMPLEMENTER_WEB mailbox signal candidate |
| comment from #32 | retained as SUPERVISOR_WEB mailbox signal candidate |
| `since` cursor | subtract 60-second overlap |
| >100 comments | follow pagination serially until no next link |
| page 2 fails | fail cycle; do not advance cursor; do not activate partial set |
| remaining <=5 with reset | next delay >= reset and >=90 s |
| Retry-After present | next delay >= Retry-After and >=90 s |
| normal headers | next delay 90 s |
| arbitrary comment body says "authorized" | body has no activation/authority effect |
| write API | absent |

## Adoption risk

Repository-wide traffic unrelated to mailboxes can force pagination. If sustained unrelated volume makes this materially inefficient, accepted #26 allows two specific-mailbox GETs only as fallback. That decision is operational, not authority.
