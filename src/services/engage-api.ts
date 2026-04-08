/**
 * Browser-side client for Treasure Data Engage Delivery API.
 * Uses the email_campaign_test endpoint to send inline HTML emails
 * (no template merge variables needed — full HTML baked in).
 */

import { storage } from '../utils/storage';
import type { OutputData } from '../stores/experienceLabStore';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

// Account 13232 sender: noreply@plg.treasure-engage-testing.link
const SENDER_ID = '019d6e37-5083-7c4e-af1b-9697114b4e16';
const WORKSPACE_ID = '019d69ca-5d11-78f9-a0ee-23ee343827a0';

type WfStep = { stepDef: { label: string; stepType: string }; output: Record<string, unknown> | null; summary: string };

// Official Treasure AI 2026 palette (hex)
const DEEP_BLUE = '#2D40AA';
const PURPLE = '#847BF2';
const ORCHID = '#C466D4';
const SKY_BLUE = '#80B3FA';
const PINK_LIGHT = '#F3CCF2';
const PEACH_LIGHT = '#FFE2BD';
const NEAR_WHITE = '#F9FEFF';
const BLACK = '#000000';
const GRAY800 = '#1F2937';
const GRAY600 = '#4B5563';
const GRAY400 = '#9CA3AF';
const GRAY200 = '#E5E7EB';

const h = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function sectionHeader(title: string): string {
  return `<div style="font-size:13px;font-weight:700;color:${PURPLE};text-transform:uppercase;letter-spacing:0.04em;margin:28px 0 10px;padding-bottom:5px;border-bottom:2px solid ${PINK_LIGHT}">${title}</div>`;
}

function levelColor(level: string): string {
  return level === 'High' ? PURPLE : level === 'Medium' ? SKY_BLUE : GRAY400;
}

function priorityColor(p: string): string {
  return p === 'Do now' ? PURPLE : p === 'Test next' ? SKY_BLUE : GRAY400;
}

function metricsHtml(metrics: Array<{ label: string; value: string }>): string {
  return metrics.slice(0, 4).map(m =>
    `<div style="display:inline-block;width:48%;text-align:center;padding:10px 6px;background:${NEAR_WHITE};border-radius:6px;margin:3px 0;vertical-align:top"><div style="font-size:16px;font-weight:700;color:${DEEP_BLUE}">${h(m.value || '')}</div><div style="font-size:12px;color:${GRAY600};margin-top:2px">${h(m.label || '')}</div></div>`
  ).join(' ');
}

// ── Per-step-type renderers (correct field names) ──

function renderAnalyzeEmail(out: Record<string, unknown>): string {
  let html = '';
  if (Array.isArray(out.findings)) {
    for (const f of out.findings as Array<{ name: string; insight: string; level: string }>) {
      const lc = levelColor(f.level);
      html += `<div style="margin:8px 0;padding:12px 14px;background:#fff;border-radius:6px;border-left:3px solid ${lc};border:1px solid ${GRAY200}"><div style="margin-bottom:4px"><strong style="font-size:14px;color:${BLACK}">${h(f.name || '')}</strong> <span style="font-size:12px;font-weight:700;color:${lc}">[${f.level}]</span></div><div style="font-size:13px;color:${GRAY600};line-height:1.5">${h(f.insight || '')}</div></div>`;
    }
  }
  if (Array.isArray(out.metrics)) html += metricsHtml(out.metrics as Array<{ label: string; value: string }>);
  if (typeof out.rationale === 'string') {
    html += `<div style="font-size:12px;font-style:italic;color:${GRAY400};margin:10px 0;line-height:1.5">${h(out.rationale)}</div>`;
  }
  return html;
}

function renderInspectEmail(out: Record<string, unknown>): string {
  let html = '';
  if (Array.isArray(out.profiles)) {
    for (const p of out.profiles as Array<{ name: string; level: string; behavior: string; action: string }>) {
      const lc = levelColor(p.level);
      html += `<div style="margin:8px 0;padding:12px 14px;background:${NEAR_WHITE};border-radius:6px"><div style="margin-bottom:4px"><strong style="font-size:14px;color:${BLACK}">${h(p.name || '')}</strong> <span style="font-size:12px;font-weight:700;color:${lc}">[${p.level}]</span></div><div style="font-size:13px;color:${GRAY600};line-height:1.5">${h(p.behavior || '')}</div><div style="font-size:13px;color:${PURPLE};margin-top:4px">Action: ${h(p.action || '')}</div></div>`;
    }
  }
  if (Array.isArray(out.sections)) {
    for (const s of out.sections as Array<{ label: string; content: string }>) {
      html += `<div style="margin:8px 0"><strong style="font-size:13px;color:${PURPLE}">${h(s.label || '')}</strong><div style="font-size:13px;color:${GRAY600};margin-top:3px;line-height:1.5">${h(s.content || '')}</div></div>`;
    }
  }
  return html;
}

function renderCreateEmail(out: Record<string, unknown>): string {
  let html = '';
  if (Array.isArray(out.sections)) {
    for (const s of out.sections as Array<{ label: string; content: string }>) {
      html += `<div style="margin:8px 0"><strong style="font-size:13px;color:${PURPLE}">${h(s.label || '')}</strong><div style="font-size:13px;color:${GRAY600};margin-top:3px;line-height:1.5">${h(s.content || '')}</div></div>`;
    }
  }
  if (Array.isArray(out.channels)) {
    html += `<div style="font-size:13px;font-weight:700;color:${GRAY400};text-transform:uppercase;margin:12px 0 6px">Channels</div>`;
    for (const ch of out.channels as Array<{ name: string; role: string }>) {
      html += `<div style="margin:4px 0;padding:8px 12px;background:${NEAR_WHITE};border-radius:4px"><strong style="font-size:13px;color:${BLACK}">${h(ch.name || '')}</strong> <span style="font-size:12px;color:${GRAY600}">— ${h(ch.role || '')}</span></div>`;
    }
  }
  if (Array.isArray(out.nextSteps)) {
    html += `<div style="font-size:13px;font-weight:700;color:${GRAY400};text-transform:uppercase;margin:12px 0 6px">Next Steps</div>`;
    for (const [i, a] of (out.nextSteps as Array<{ action: string; priority: string }>).entries()) {
      const pc = priorityColor(a.priority);
      html += `<div style="margin:4px 0;font-size:13px;color:${GRAY600}"><span style="display:inline-block;width:18px;height:18px;border-radius:50%;background:${PURPLE};color:#fff;font-size:11px;font-weight:700;text-align:center;line-height:18px;margin-right:6px">${i + 1}</span>${h(a.action || '')} <span style="font-size:13px;font-weight:700;color:${pc}">[${a.priority}]</span></div>`;
    }
  }
  return html;
}

function renderCompareEmail(out: Record<string, unknown>): string {
  let html = '';
  if (Array.isArray(out.options)) {
    for (const opt of out.options as Array<{ name: string; description: string; score: string; recommended: boolean }>) {
      const border = opt.recommended ? `2px solid ${PURPLE}` : `1px solid ${GRAY200}`;
      html += `<div style="margin:6px 0;padding:12px;border-radius:8px;border:${border}">`;
      html += `<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px"><strong style="font-size:13px;color:${BLACK}">${h(opt.name || '')}</strong>`;
      if (opt.recommended) html += `<span style="font-size:8px;font-weight:700;color:#fff;background:${PURPLE};padding:2px 6px;border-radius:6px">RECOMMENDED</span>`;
      html += `</div><div style="font-size:13px;color:${GRAY600};line-height:1.4">${h(opt.description || '')}</div>`;
      html += `<div style="font-size:18px;font-weight:700;color:${PURPLE};margin-top:6px;text-align:center">${h(opt.score || '')}</div></div>`;
    }
  }
  if (Array.isArray(out.metrics)) html += metricsHtml(out.metrics as Array<{ label: string; value: string }>);
  return html;
}

function renderActivateEmail(out: Record<string, unknown>): string {
  let html = '';
  if (typeof out.summary === 'string') {
    html += `<div style="font-size:13px;color:${GRAY600};line-height:1.4;margin-bottom:8px">${h(out.summary)}</div>`;
  }
  if (Array.isArray(out.destinations)) {
    for (const d of out.destinations as Array<{ channel: string; role: string; detail: string }>) {
      html += `<div style="margin:6px 0;padding:10px 12px;background:${NEAR_WHITE};border-radius:6px"><div style="margin-bottom:2px"><strong style="font-size:12px;color:${BLACK}">${h(d.channel || '')}</strong> <span style="font-size:12px;color:${PURPLE}">${h(d.role || '')}</span></div><div style="font-size:13px;color:${GRAY600}">${h(d.detail || '')}</div></div>`;
    }
  }
  if (Array.isArray(out.sections)) {
    for (const s of out.sections as Array<{ label: string; content: string }>) {
      html += `<div style="margin:6px 0"><strong style="font-size:13px;color:${PURPLE}">${h(s.label || '')}</strong><div style="font-size:13px;color:${GRAY600};margin-top:2px;line-height:1.4">${h(s.content || '')}</div></div>`;
    }
  }
  return html;
}

function renderOptimizeEmail(out: Record<string, unknown>): string {
  let html = '';
  if (typeof out.rationale === 'string') {
    html += `<div style="font-size:13px;font-style:italic;color:${GRAY600};line-height:1.4;margin-bottom:8px">${h(out.rationale)}</div>`;
  }
  if (Array.isArray(out.changes)) {
    for (const [i, ch] of (out.changes as Array<{ action: string; priority: string }>).entries()) {
      const pc = priorityColor(ch.priority);
      html += `<div style="margin:4px 0;padding:6px 10px;background:#fff;border:1px solid ${GRAY200};border-radius:6px"><span style="display:inline-block;width:16px;height:16px;border-radius:50%;background:${PURPLE};color:#fff;font-size:8px;font-weight:700;text-align:center;line-height:16px;margin-right:6px">${i + 1}</span><span style="font-size:13px;color:${GRAY600}">${h(ch.action || '')}</span> <span style="font-size:11px;font-weight:700;color:${pc}">[${ch.priority}]</span></div>`;
    }
  }
  if (Array.isArray(out.metrics)) html += metricsHtml(out.metrics as Array<{ label: string; value: string }>);
  return html;
}

const stepEmailRenderers: Record<string, (out: Record<string, unknown>) => string> = {
  analyze: renderAnalyzeEmail,
  inspect: renderInspectEmail,
  create: renderCreateEmail,
  compare: renderCompareEmail,
  activate: renderActivateEmail,
  optimize: renderOptimizeEmail,
};

/** Build the full HTML email body — Treasure AI 2026 branded */
function buildEmailHtml(output: OutputData | null | undefined, wfStepHistory?: WfStep[]): string {
  let contentHtml = '';

  if (output) {
    // Segments
    contentHtml += sectionHeader('Audience Segments');
    for (const c of output.audienceCards) {
      const lc = levelColor(c.opportunityLevel);
      contentHtml += `<div style="margin:6px 0;padding:10px 12px;background:#fff;border-radius:6px;border-left:3px solid ${lc};border:1px solid ${GRAY200}"><strong style="font-size:12px;color:${BLACK}">${h(c.name)}</strong> <span style="font-size:11px;font-weight:700;color:${lc}">[${c.opportunityLevel}]</span><br><span style="font-size:13px;color:${GRAY600}">${h(c.whyItMatters)}</span><br><span style="font-size:12px;color:${PURPLE}">Action: ${h(c.suggestedAction)}</span></div>`;
    }
    // Channels
    contentHtml += sectionHeader('Channel Strategy');
    for (const c of output.channelStrategy) {
      contentHtml += `<div style="margin:3px 0;padding:6px 10px;background:${NEAR_WHITE};border-radius:4px"><strong style="font-size:13px;color:${BLACK}">${h(c.channel)}</strong> <span style="font-size:12px;color:${GRAY600}">— ${h(c.role)} — ${h(c.messageAngle)}</span></div>`;
    }
    // Scenario
    contentHtml += sectionHeader(output.scenarioCore.title);
    for (const s of output.scenarioCore.sections) {
      contentHtml += `<div style="margin:6px 0"><strong style="font-size:13px;color:${PURPLE}">${h(s.label)}</strong><div style="font-size:13px;color:${GRAY600};margin-top:2px;line-height:1.4">${h(s.content)}</div></div>`;
    }
    // KPIs
    contentHtml += sectionHeader('KPI Framework');
    contentHtml += `<table style="width:100%;border-collapse:collapse">`;
    for (const k of output.kpiFramework) {
      contentHtml += `<tr style="border-bottom:1px solid ${GRAY200}"><td style="padding:6px 8px;font-size:11px;font-weight:700;color:${PURPLE}">${h(k.type)}</td><td style="padding:6px 8px;font-size:13px;font-weight:700;color:${DEEP_BLUE}">${h(k.name)}</td><td style="padding:6px 8px;font-size:12px;color:${GRAY600}">${h(k.note)}</td></tr>`;
    }
    contentHtml += '</table>';
    // Actions
    contentHtml += sectionHeader('Recommended Next Actions');
    for (const [i, a] of output.nextActions.entries()) {
      const pc = priorityColor(a.priority);
      contentHtml += `<div style="margin:4px 0;font-size:13px;color:${GRAY600}"><span style="display:inline-block;width:18px;height:18px;border-radius:50%;background:${PURPLE};color:#fff;font-size:11px;font-weight:700;text-align:center;line-height:18px;margin-right:6px">${i + 1}</span>${h(a.action)} <span style="font-size:11px;font-weight:700;color:${pc}">[${a.priority}]</span></div>`;
    }
  } else if (wfStepHistory && wfStepHistory.length > 0) {
    for (const [i, step] of wfStepHistory.entries()) {
      // Step card
      contentHtml += `<div style="margin:16px 0;padding:16px;background:#fff;border-radius:8px;border:1px solid ${GRAY200}">`;
      // Step header
      contentHtml += `<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid ${GRAY200}">`;
      contentHtml += `<span style="display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:6px;background:${PURPLE};color:#fff;font-size:13px;font-weight:700">${i + 1}</span>`;
      contentHtml += `<span style="font-size:14px;font-weight:700;color:${BLACK}">${h(step.stepDef.label)}</span>`;
      contentHtml += `<span style="font-size:11px;font-weight:700;color:${PURPLE};background:${PINK_LIGHT};padding:1px 5px;border-radius:3px">${h(step.stepDef.stepType.toUpperCase())}</span>`;
      contentHtml += `</div>`;
      // Headline
      if (step.output && typeof step.output.headline === 'string') {
        contentHtml += `<div style="font-size:13px;font-weight:700;color:${DEEP_BLUE};margin-bottom:6px">${h(step.output.headline)}</div>`;
      }
      // Impact statement
      if (step.output && typeof step.output.impactStatement === 'string') {
        contentHtml += `<div style="padding:8px 12px;background:${PINK_LIGHT};border-radius:4px;font-size:12px;color:${PURPLE};margin-bottom:10px;line-height:1.4">${h(step.output.impactStatement as string)}</div>`;
      }
      // Step-type-specific content
      if (step.output) {
        const renderer = stepEmailRenderers[step.stepDef.stepType];
        if (renderer) {
          contentHtml += renderer(step.output);
        } else if (step.summary) {
          contentHtml += `<div style="font-size:13px;color:${GRAY600};line-height:1.4">${h(step.summary)}</div>`;
        }
      } else if (step.summary) {
        contentHtml += `<div style="font-size:13px;color:${GRAY600};line-height:1.4">${h(step.summary)}</div>`;
      }
      contentHtml += '</div>';
    }
  }

  // Banner
  let bannerHtml = '';
  if (output) {
    bannerHtml = `<div style="background:${NEAR_WHITE};border-radius:8px;padding:16px;margin:0 0 16px;border-left:3px solid ${PURPLE}"><div style="font-size:15px;font-weight:700;color:${DEEP_BLUE};margin-bottom:4px">${h(output.summaryBanner.topRecommendation)}</div><div style="font-size:12px;color:${GRAY600};margin-bottom:4px">Goal: ${h(output.summaryBanner.goal)} | Audience: ${h(output.summaryBanner.audience)}</div><div style="font-size:12px;color:${PURPLE}">${h(output.summaryBanner.impactFraming)}</div></div>${sectionHeader('Executive Summary')}<div style="font-size:12px;color:${GRAY600};line-height:1.6">${h(output.executiveSummary)}</div>`;
  } else if (wfStepHistory && wfStepHistory.length > 0) {
    const firstOut = wfStepHistory[0].output;
    const headline = (firstOut && typeof firstOut.headline === 'string') ? firstOut.headline : wfStepHistory[0].summary;
    bannerHtml = `<div style="background:${NEAR_WHITE};border-radius:8px;padding:16px;margin:0 0 16px;border-left:3px solid ${PURPLE}"><div style="font-size:15px;font-weight:700;color:${DEEP_BLUE};margin-bottom:4px">${h(headline)}</div><div style="font-size:12px;color:${PURPLE}">${wfStepHistory.length}-step workflow analysis completed</div></div>`;
  }

  // Full email
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;background:${NEAR_WHITE};color:${BLACK}"><div style="background:linear-gradient(135deg,${PEACH_LIGHT},${PINK_LIGHT},#D4E4FF);padding:32px 24px;text-align:center"><div style="color:${DEEP_BLUE};font-size:14px;font-weight:700;margin-bottom:6px">Treasure AI</div><div style="color:${BLACK};font-size:22px;font-weight:700;margin-bottom:4px">Experience Center</div><div style="color:${GRAY600};font-size:12px">Analysis Recap</div></div><div style="height:3px;background:linear-gradient(90deg,${PURPLE},${ORCHID},${SKY_BLUE})"></div><div style="background:#fff;border-radius:12px;margin:20px auto;max-width:600px;padding:24px;box-shadow:0 1px 4px rgba(0,0,0,0.06)">${bannerHtml}${contentHtml}</div><div style="text-align:center;padding:20px;color:${GRAY400};font-size:12px">Generated by <a href="https://experience.treasuredata.com" style="color:${PURPLE};text-decoration:none">Treasure AI Experience Center</a><br>Powered by Treasure Data CDP + AI</div></body></html>`;
}

export async function sendEmail(
  toAddress: string,
  output?: OutputData | null,
  wfStepHistory?: WfStep[],
): Promise<{ success: boolean; error?: string }> {
  const apiKey = storage.getItem('ai-suites-tdx-api-key') || '';

  try {
    const response = await fetch(`${API_BASE}/engage/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { 'x-api-key': apiKey } : {}),
      },
      body: JSON.stringify({
        data: {
          toAddresses: [toAddress],
          type: 'campaigns',
          id: 'ec-recap',
          attributes: {
            name: 'Experience Center Recap',
            connectorConfig: { emailSenderId: SENDER_ID },
            emailContent: {
              subjectTemplate: 'Your Treasure AI Experience Center Recap',
              htmlTemplate: buildEmailHtml(output, wfStepHistory),
            },
            workspaceId: WORKSPACE_ID,
          },
        },
      }),
    });

    if (response.ok) {
      return { success: true };
    }

    const body = await response.text();
    let errorMsg = `HTTP ${response.status}`;
    try {
      const json = JSON.parse(body);
      if (json.error) errorMsg = json.error;
      else if (json.errors?.[0]?.detail) errorMsg = json.errors[0].detail;
    } catch { /* use status code */ }

    return { success: false, error: errorMsg };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Network error' };
  }
}
