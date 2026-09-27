# Task 03 verification vectors

| Candidate set | Evidence | Result |
|---|---|---|
| HUMAN_REQUIRED unsatisfied only | n/a | WAIT |
| unsupported HUMAN target | n/a | STOP_ESCALATE |
| unsupported LOCAL_AGENT_OPERATOR | n/a | STOP_ESCALATE |
| one READY only | none needed when no competing request exists | CONTINUE_ONE |
| one READY + one BLOCKED | explicit persistent independence pair | CONTINUE_ONE |
| one READY + one BLOCKED | no independence evidence | STOP_ESCALATE |
| two READY | even if independent | STOP_ESCALATE: choosing is priority |
| zero READY | n/a | WAIT |
| ready candidate appears first/oldest | n/a | order has no effect |
| ready candidate from #31 vs #32 | n/a | mailbox has no priority effect |

The candidate intentionally favors false-stop over inferred priority/independence.
