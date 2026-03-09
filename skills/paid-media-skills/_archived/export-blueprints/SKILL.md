---
name: export-blueprints
description: >
  Exports campaign blueprints to JSON, CSV, or PDF format. This is a deterministic
  skill that triggers file generation via IPC — no LLM generation is required for
  the export itself.
---

# Export Blueprints Skill

## When to Use

Activate this skill when the user wants to download or export their campaign
blueprints in a specific format. Trigger phrases include but are not limited to:

- "Export my blueprints"
- "Download the media plan"
- "Save blueprints as PDF"
- "Export to CSV"
- "Download as JSON"
- "Share the campaign plan"
- "Export for the team"
- Any request to export, download, save, or share blueprint data.

## Input Context

You will receive:
- The blueprint(s) to export (one or all three variants)
- The desired export format (JSON, CSV, or PDF)
- Optional: specific sections to include or exclude
- Optional: branding or formatting preferences

## Output Schema

This skill triggers a deterministic IPC call to the export utility. No LLM-generated
code fence is needed. The IPC handler manages file generation and download.

```jsonc
// IPC request (sent by the application):
{
  "blueprintIds": ["string — IDs of blueprints to export"],
  "format": "string — json | csv | pdf",
  "options": {
    "includeMetrics": "boolean — include performance projections",
    "includeChannelDetails": "boolean — include channel-level breakdown",
    "includeBudgetPhases": "boolean — include budget phasing",
    "campaignName": "string — for file naming"
  }
}

// IPC response:
{
  "success": true,
  "filePath": "string — path to the generated file",
  "fileName": "string — generated file name",
  "format": "string — json | csv | pdf"
}
```

## Output Format

This is a **deterministic skill** — no LLM-generated code fence is needed.
The export is handled entirely by the IPC handler and export utilities. In your
conversational response, confirm the export is being generated and inform the
user about the file format and contents.

## Quality Rules

1. **Confirm the export request.** Before triggering the export, confirm the
   format and which blueprints the user wants exported.
2. **Suggest the right format.** JSON for programmatic use or API import, CSV
   for spreadsheet analysis, PDF for stakeholder presentations.
3. **Handle errors gracefully.** If the export fails, provide a clear error
   message and suggest alternatives (e.g. try a different format).
4. **Include file naming context.** The exported file should be named with the
   campaign name and date for easy identification.
5. **Do not modify blueprint data.** This is a read-only export operation.
   The skill should never alter the blueprint content during export.
