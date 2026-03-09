---
name: sync-platform-audiences
description: >
  Pushes selected audience segments from Treasure Data CDP to advertising platforms
  (Google Ads, Meta Ads, LinkedIn, etc.). This is a deterministic skill that triggers
  platform API calls via IPC — no LLM generation is required.
---

# Sync Platform Audiences Skill

## When to Use

Activate this skill when the user wants to push audience segments to ad platforms
for targeting. Trigger phrases include but are not limited to:

- "Sync audiences to Google Ads"
- "Push segments to Meta"
- "Send my audiences to the platforms"
- "Activate segments on LinkedIn"
- "Upload audiences to ad platforms"
- "Sync TD segments to my ad accounts"
- "Connect my CDP audiences to Google"
- Any request to push, sync, upload, or activate audience segments on ad platforms.

## Input Context

You will receive:
- The audience segments to sync (IDs, names, sizes)
- The target advertising platform(s)
- Campaign context for which these audiences are being synced
- Optional: platform account identifiers
- Optional: match type preferences (email, phone, device ID)

## Output Schema

This skill triggers a deterministic IPC call to the platform sync service. No
LLM-generated code fence is needed.

```jsonc
// IPC request (sent by the application):
{
  "segments": [
    {
      "segmentId": "string — TD segment ID",
      "segmentName": "string — segment display name",
      "estimatedSize": "number — audience size"
    }
  ],
  "platforms": [
    {
      "name": "string — Google Ads | Meta Ads | LinkedIn Ads | TikTok Ads | DV360",
      "accountId": "string — platform account identifier",
      "matchTypes": ["string — email | phone | deviceId | customerId"]
    }
  ],
  "campaignId": "string — associated campaign ID"
}

// IPC response:
{
  "success": true,
  "results": [
    {
      "platform": "string — platform name",
      "segmentId": "string — TD segment ID",
      "status": "string — synced | pending | failed",
      "matchRate": "number — estimated match rate percentage",
      "platformAudienceId": "string — audience ID on the platform",
      "estimatedReach": "number — estimated reachable users on platform",
      "error": "string — error message if failed, null if successful"
    }
  ],
  "syncedAt": "string — ISO datetime"
}
```

## Output Format

This is a **deterministic skill** — no LLM-generated code fence is needed.
The sync operation is handled entirely by the IPC handler and platform APIs.
In your conversational response, confirm which segments are being synced to
which platforms and set expectations about sync timing.

## Quality Rules

1. **Confirm before syncing.** Always confirm the segments and target platforms
   with the user before triggering the sync operation.
2. **Set timing expectations.** Platform audience syncs can take 24-48 hours to
   fully populate. Inform the user of expected timelines.
3. **Warn about match rates.** First-party data match rates vary by platform
   (typically 30-70%). Set realistic expectations.
4. **Handle partial failures.** If some segments sync successfully but others
   fail, report the mixed results clearly with per-segment status.
5. **Do not sync without authorization.** This operation pushes real data to
   external platforms. Always require explicit user confirmation.
6. **Suggest match type best practices.** Email-based matching typically has
   higher match rates than phone or device ID. Recommend the best approach.
