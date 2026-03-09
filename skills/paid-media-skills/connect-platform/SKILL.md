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
- "Unlink my TikTok account"
- "Check my connections"
- Any request to connect, disconnect, link, unlink, or check ad platform status.

**Do NOT use when:**
- The user is asking about Treasure Data (TD) segments → use `fetch-td-segments`
- The user wants to view campaign data → use `diagnose-campaigns`
- The user is asking about platform features or capabilities → answer conversationally
- The user is configuring settings unrelated to ad platforms → handle in Settings UI

## Input Context

You will receive:
- The user's request
- Optional: current platform connection status in conversation context

## Output Schema

Emit a JSON object with the action and platform:

```jsonc
{
  "action": "connect | disconnect | status",
  "platform": "meta | google | tiktok"
}
```

**Field constraints:**
- `action`: Must be exactly one of: `"connect"`, `"disconnect"`, `"status"`
- `platform`: Must be exactly one of: `"meta"`, `"google"`, `"tiktok"`
- For `"status"` action, `platform` can be any value (all platforms are checked)

### Platform Name Mapping

| User says | Maps to |
|-----------|---------|
| Facebook, Facebook Ads, FB, Meta, Meta Ads | `"meta"` |
| Google, Google Ads, AdWords, GDN | `"google"` |
| TikTok, TikTok Ads, TT | `"tiktok"` |

### Action Details

- **connect**: Opens an OAuth popup for the specified platform. The user
  authorizes in the popup and campaigns are automatically fetched on success.
- **disconnect**: Removes saved credentials and clears campaign data for the
  specified platform.
- **status**: Returns the current connection state of all platforms.

## Output Format

Wrap the JSON in a `platform-action-json` code fence:

````
```platform-action-json
{
  "action": "connect",
  "platform": "meta"
}
```
````

Include conversational context before or after explaining what will happen.

## Quality Rules

1. **If the user's platform reference is ambiguous, ask a clarifying question
   INSTEAD of guessing.** For example, if the user says "connect my ads" without
   specifying a platform, ask which platform they want.
2. **Default to status for vague queries.** If the user asks "what's connected?"
   or "show my integrations", use `"action": "status"`.
3. **One action per response.** Only emit one `platform-action-json` fence per
   response. If the user wants to connect multiple platforms, handle them one
   at a time and offer to do the next one after.
4. **Provide conversational context.** Briefly explain what will happen (e.g.,
   "I'll open the Meta login window for you").
5. **Handle platform aliases** correctly using the mapping table above.
6. **Warn before disconnecting.** If the user asks to disconnect, confirm
   what will be removed (credentials and campaign data) before emitting the
   code fence.
7. **Use only valid enum values.** Never output a platform value not in the
   allowed list.

## Edge Cases

- **User asks to connect a platform not supported**: Explain that only Meta,
  Google, and TikTok are currently supported. Do not emit a code fence.
- **User asks to connect all platforms at once**: Handle one at a time. Start
  with the first one and offer to do the next after completion.
- **User says "reconnect"**: Treat as disconnect + connect. Emit disconnect first
  and explain you'll reconnect after.
- **User is unsure which platforms are available**: Use status action and explain
  the options in your response.

## Examples

### Example 1: Connect Meta

**User message:**
> Connect my Facebook Ads account

**Expected output:**

I'll open the Meta Ads authorization window for you. Please complete the login in the popup — once authorized, your campaigns will be fetched automatically.

```platform-action-json
{
  "action": "connect",
  "platform": "meta"
}
```

### Example 2: Check Status

**User message:**
> What platforms do I have connected?

**Expected output:**

Let me check your current platform connections.

```platform-action-json
{
  "action": "status",
  "platform": "meta"
}
```

### Example 3: Ambiguous Platform

**User message:**
> Connect my ad account

**Expected output (no code fence):**

I'd be happy to connect your ad account. Which platform would you like to connect?

1. **Meta Ads** (Facebook / Instagram)
2. **Google Ads** (Search, Display, YouTube)
3. **TikTok Ads**
