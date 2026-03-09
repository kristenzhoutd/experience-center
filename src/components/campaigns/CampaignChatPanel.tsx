/**
 * CampaignChatPanel — Placeholder chat interface for the collapsible left panel
 * Future: Can integrate full chat functionality from CampaignChatPage.tsx
 */

export default function CampaignChatPanel() {
  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-gray-900">Campaign Assistant</h2>
        <p className="text-xs text-gray-500">Ask questions about your campaigns</p>
      </div>

      {/* Placeholder Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <p className="text-sm text-gray-500 text-center">
          Chat interface coming soon.
          <br />
          Use the Campaign Chat page for now.
        </p>
      </div>
    </div>
  );
}
