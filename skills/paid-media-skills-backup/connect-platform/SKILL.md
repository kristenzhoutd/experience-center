---
name: connect-platform
description: >
  Connects, disconnects, or checks the status of advertising platform integrations
  (Meta Ads, Google Ads, TikTok Ads). The UI handles OAuth popups via IPC —
  Claude only needs to emit the action code fence.
---

# Connect Platform Skill

## When to Use

Activate this skill when the user wants to connect, disconnect, or check the
status of their advertising platform accounts. Trigger phrases include:

- "Connect my Meta account"
- "Link my Facebook Ads"
- "Connect Google Ads"
- "Disconnect Meta"
- "What platforms are connected?"
- "Show my connected accounts"
- "Are any ad platforms linked?"
- "Set up my Meta Ads integration"
- Any request to connect, disconnect, link, unlink, or check ad platform status.

## Output Format

Emit a `platform-action-json` code fence with the following JSON:

```platform-action-json
{
  "action": "connect",
  "platform": "meta"
}
```

### Fields

| Field | Type | Description |
|-------|------|-------------|
| `action` | `"connect"` \| `"disconnect"` \| `"status"` | The operation to perform |
| `platform` | `"meta"` \| `"google"` \| `"tiktok"` | Target advertising platform |

### Action Details

- **connect**: Opens an OAuth popup for the specified platform. The user authorizes
  in the popup, and campaigns are automatically fetched on success.
- **disconnect**: Removes the saved credentials and clears campaign data for the
  specified platform.
- **status**: Returns the current connection state of all platforms.

## Quality Rules

1. **Infer the platform from context.** If the user says "connect my Facebook Ads",
   map that to `"meta"`. If ambiguous, ask the user to clarify.
2. **Default to status for vague queries.** If the user asks "what's connected?" or
   "show my integrations", use `"action": "status"`.
3. **One action per response.** Only emit one `platform-action-json` fence per
   response. If the user wants to connect multiple platforms, handle them one at a time.
4. **Provide conversational context.** Before or after the code fence, briefly
   explain what will happen (e.g., "I'll open the Meta login window for you").
5. **Handle platform aliases.** Map "Facebook" → "meta", "Google" → "google",
   "TikTok" → "tiktok".
