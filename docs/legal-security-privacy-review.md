# Experience Center -- Legal, Security & Privacy Review Topics

Prepared for cross-functional review meeting. This document outlines the key topics and questions based on the Experience Center's architecture and public deployment model.

---

## 1. API Key Exposure

**Current state:**
- The TD LLM Proxy API key is served to the browser via a `/api/config` endpoint at runtime and stored in sessionStorage
- The app password (`TDsuperhuman`) is embedded in the JS bundle and extractable by anyone who inspects the source

**Questions:**
- What is the acceptable risk level for a shared sandbox API key exposed to the browser?
- Should we implement key rotation policies for the sandbox key?
- Should the `/api/config` endpoint be rate-limited or restricted?

---

## 2. No Authentication / Public Access

**Current state:**
- The app is designed as a "no-auth entry" experience -- zero login required (this is an explicit design principle)
- Only a casual password gate exists, and the password is visible in the JS bundle
- Anyone with the URL can access the full experience

**Questions:**
- Is a public-facing app calling the TD LLM Proxy acceptable without user authentication?
- Who is liable if the sandbox API key is extracted and abused?
- Do we need IP-based rate limiting, WAF protection, or other abuse prevention?

---

## 3. LLM Proxy Usage & Cost

**Current state:**
- Every visitor can trigger Claude API calls via the TD LLM Proxy at Treasure Data's cost
- No per-user or per-session rate limiting currently exists
- Each scenario generation makes 1 LLM call; slide generation adds another

**Questions:**
- What usage limits should be enforced?
- Who owns the cost for public usage of the LLM proxy?
- What is the abuse risk (automated scraping, bot traffic, prompt injection)?
- Should we cap requests per session or per IP?

---

## 4. Data Sent to Claude / Anthropic

**Current state:**
- Hardcoded industry sandbox data (sample segments, metrics, channel preferences) is included in LLM prompts
- With the planned TDX integration, real customer segment names and population counts from the Treasure Data CDP are sent to Claude as part of the prompt
- LLM responses (AI-generated marketing recommendations) are returned to the browser

**Questions:**
- Does any sandbox or TDX segment data contain PII or customer-identifiable information?
- Is sending TDX segment metadata to Anthropic's API compliant with our data processing agreements?
- Does Anthropic's data retention policy (training data opt-out, etc.) align with Treasure Data's requirements?
- Do we have a Data Processing Agreement (DPA) with Anthropic that covers this use case?

---

## 5. Client-Side Data Storage

**Current state:**
- API keys, chat history, and user settings are stored in browser sessionStorage
- sessionStorage auto-clears when the browser tab closes
- No cookies, no localStorage, no persistent storage, no cross-session tracking
- No analytics or tracking scripts are currently embedded

**Questions:**
- Is sessionStorage-only storage sufficient for privacy compliance?
- Do we need a cookie/privacy banner even without cookies (some jurisdictions require it for any client-side storage)?
- Are there any GDPR/CCPA implications for the current client-side storage approach?

---

## 6. Lead Capture -- Book a Walkthrough

**Current state:**
- The booking form collects PII: first name, last name, work email, company, role/title, and an optional message
- Currently no backend -- form data is not sent or stored anywhere (placeholder implementation)
- A backend integration (email, webhook, or CRM) is planned

**Questions:**
- When we add a backend, where should this data be stored and for how long?
- What consent language is required on the form?
- Do we need a link to a privacy policy?
- What are our GDPR right-to-delete obligations for collected lead data?
- Does the form need a checkbox for marketing consent?

---

## 7. Third-Party Services & Data Flow

**Current state:**
- **Render** (render.com) -- hosts the Docker container (Express server + React client)
- **TD LLM Proxy** (llm-proxy.us01.treasuredata.com) -- routes requests to Anthropic's Claude API
- **Anthropic (Claude)** -- processes LLM prompts and returns AI-generated output
- **TDX CDP API** (api-cdp.treasuredata.com) -- called directly from the browser to fetch segment data

**Data flow:**
```
Browser --> Render (Express) --> TD LLM Proxy --> Anthropic (Claude)
Browser --> TDX CDP API (direct, CORS)
```

**Questions:**
- Is Render an approved hosting platform for customer-adjacent tools?
- What is the data residency situation? (Render region, Anthropic processing location)
- Is the Anthropic DPA in place and does it cover public-facing demo applications?
- Are there compliance requirements for data flowing through the TD LLM Proxy?

---

## 8. Content Liability -- AI-Generated Output

**Current state:**
- AI-generated marketing recommendations are presented as "illustrative recommendations that showcase Treasure AI capabilities" when using sample data
- When using real TDX segments, framing changes to "data-driven recommendations powered by Treasure AI"
- Outputs include campaign briefs, journey maps, KPI frameworks, and strategic recommendations

**Questions:**
- Do we need disclaimers that AI-generated output is not guaranteed or actionable without review?
- What is our liability if a prospect acts on AI-generated recommendations?
- Who owns the intellectual property of the generated content?
- Should outputs include a visible "AI-generated" watermark or disclaimer?

---

## 9. Brand & External Visibility

**Current state:**
- The app uses Treasure Data branding ("Treasure AI Experience Center") and is publicly accessible
- The design principle is a "no-login, public website" for lead generation
- The presentation describes it as a tool for "enterprise marketers" to experience Treasure AI

**Questions:**
- Does this need marketing/brand team approval before public launch?
- Is the "Treasure AI" naming approved for external use?
- Are there trademark considerations for the name or branding?
- Does the public nature require a Terms of Use page?

---

## 10. Security Hardening

**Current state:**
- Security headers in place: `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`
- No Content Security Policy (CSP) header
- No HTTP Strict Transport Security (HSTS) header
- CORS is set to allow all origins (`*`)

**Questions:**
- Should we add CSP and HSTS headers?
- Should CORS be restricted to specific origins instead of `*`?
- Is the current security posture sufficient for a public-facing application?
- Should we conduct a penetration test or security audit before launch?

---

## Architecture Reference

```
Presentation Layer    React + TypeScript, hosted on Render
                      |
Orchestration Layer   Scenario Registry (36 scenarios) --> Skill Routing --> Prompt Assembly
                      |
Skill Families        Campaign Brief, Journey, Segment Analysis, Performance, Insight, Slides
                      |
Data Layer            Industry Sandbox (hardcoded) + TDX CDP API (real segments, planned)
                      |
LLM Layer             Express proxy --> TD LLM Proxy --> Anthropic Claude
```

## Key Design Principles (from presentation)

- **No-auth entry** -- zero friction, no login required
- **Web-first** -- no downloads, no installs, just a URL
- **Sandbox-based** -- realistic sample data, no customer data needed (transitioning to real TDX data)
- **Guided, not open-ended** -- curated paths, not free-form prompting
