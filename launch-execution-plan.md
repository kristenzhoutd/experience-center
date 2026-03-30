---
PLG Daily Report (2026-03-29)

Milestones

- 4/6: Internal testing (Product team)
- 4/13: Internal company-wide release
- 4/20: Launch

---
Owner / Task Matrix

+---------------------+--------------------------------------------+-----------+
| Owner               | Task                                       | Target    |
+---------------------+--------------------------------------------+-----------+
| CustOps             | CUSTOPS-6882 TD Account Creation           | 4/6       |
| Kristen             | PLG Web Dev (dummy data)                   | 4/6       |
| Kristen             | Sandbox Data Load                          | 4/6       |
| Kristen             | Parent Segment Definition                  | 4/6       |
| Nahi                | AIF Switch Instruction                     | 4/6       |
| Kristen             | LLM -> AIF Switch                          | 4/6       |
| Kristen             | Verification                               | 4/6       |
+---------------------+--------------------------------------------+-----------+
| Nahi                | DEVAI-576 (CORS, Security Review, Rate)    | 4/13      |
| Kristen + Nick B    | Staging Deploy                             | 4/13      |
| Kristen             | Legal Review -> Signal Design -> JS/SDK    | 4/13      |
+---------------------+--------------------------------------------+-----------+
| Kristen + Sec Arch  | Security Hardening                         | 4/20      |
+---------------------+--------------------------------------------+-----------+

---
Kristen Task Flow

====== Before 4/6 Internal Testing ======

[Waiting] CUSTOPS-6882 TD Account Creation
                |
                v
        +-------+-------+
        |               |
        v               v
   Sandbox Data    Parent Segment
      Load           Definition
        |               |
        +-------+-------+
                |
                v
        AIF Data Ready --------+
                               |
PLG Web Dev (dummy data) ------+
                |              |
                v              v
        Dev Complete -----> Both Ready
                               |
                               | <-- Instruction from Nahi
                               v
                       LLM -> AIF Switch [!] Tech Risk
                               |
                               v
                         Verification
                               |
                               v
                    >>> 4/6 Internal Testing <<<


====== Before 4/13 Internal Release ======

        +-----------------+-----------------+
        |                 |                 |
        v                 v                 v
   [Waiting]         Legal Review     Staging Deploy
   DEVAI-576              |              Prep
   (Nahi)                 v           (with Nick B)
        |          Signal Design            |
        |           Finalized               |
        |                 |                 |
        |                 v                 |
        |           TD JS/SDK               |
        |          Integration              |
        |                 |                 |
        v                 v                 v
   CORS Ready ------------+-----------------+
                          |
                          v
                >>> 4/13 Internal Release <<<


====== Before 4/20 Launch ======

        Security Hardening (with Security Arch)
        - Permission review & configuration
                          |
                          v
                   >>> 4/20 Launch <<<

---
Current Blockers

+----------------+-------------------------+---------------------------+
| Item           | Status                  | Next Action               |
+----------------+-------------------------+---------------------------+
| CUSTOPS-6882   | Ticket created, waiting | Check with CustOps: ETA?  |
+----------------+-------------------------+---------------------------+

---
Risks

+-------------------------+----------+--------------------------------+
| Risk                    | Impact   | Notes                          |
+-------------------------+----------+--------------------------------+
| CUSTOPS-6882 delay      | 4/6 slip | Need status update             |
| PLG Web Dev delay       | 4/6 slip | ETA?                           |
| LLM -> AIF Switch       | 4/6 slip | Tech risk (behavior, perf)     |
+-------------------------+----------+--------------------------------+
