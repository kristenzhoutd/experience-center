/**
 * PPTX generator — Treasure AI 2026 branded slides.
 *
 * Colors from official "2026 Treasure AI Official Template" theme2:
 *   dk2=#2D40AA  accent1=#847BF2  accent2=#C466D4  accent3=#80B3FA
 *   accent4=#F3CCF2  accent5=#FFE2BD  accent6=#FDB893  lt2=#F9FEFF
 */

import PptxGenJS from 'pptxgenjs';
import type { DeckData, Slide } from '../experience-center/output-formats/slides/types';

// ── Official Treasure AI 2026 palette ──
const C = {
  deepBlue: '2D40AA',    // dk2
  purple: '847BF2',      // accent1
  orchid: 'C466D4',      // accent2
  skyBlue: '80B3FA',     // accent3
  pinkLight: 'F3CCF2',   // accent4
  peachLight: 'FFE2BD',  // accent5
  peach: 'FDB893',       // accent6
  nearWhite: 'F9FEFF',   // lt2
  black: '000000',
  gray800: '1F2937',
  gray600: '4B5563',
  gray400: '9CA3AF',
  gray200: 'E5E7EB',
  white: 'FFFFFF',
};

const FONT = 'Arial';
const W = 13.33;
const H = 7.5;
const MX = 0.6;
const CW = W - 2 * MX;

// ── Helpers ──

function addSlideHeader(s: PptxGenJS.Slide, stepNum: number, label: string, stepType: string) {
  // Purple number pill
  s.addShape('roundRect', { x: MX, y: 0.3, w: 0.4, h: 0.4, fill: { color: C.purple }, rectRadius: 0.1 });
  s.addText(`${stepNum}`, { x: MX, y: 0.3, w: 0.4, h: 0.4, fontSize: 13, fontFace: FONT, bold: true, color: C.white, align: 'center', valign: 'middle' });
  // Title
  s.addText(label, { x: MX + 0.55, y: 0.28, w: CW - 0.6, h: 0.45, fontSize: 18, fontFace: FONT, bold: true, color: C.black });
  // Step type in orchid
  s.addShape('roundRect', { x: MX + 0.55, y: 0.72, w: 1.2, h: 0.22, fill: { color: C.pinkLight }, rectRadius: 0.06 });
  s.addText(stepType.toUpperCase(), { x: MX + 0.55, y: 0.72, w: 1.2, h: 0.22, fontSize: 7, fontFace: FONT, bold: true, color: C.orchid, align: 'center', valign: 'middle' });
  // Bottom accent — gradient-like strip using multiple colors
  const segW = CW / 4;
  [C.peach, C.pinkLight, C.purple, C.skyBlue].forEach((c, i) => {
    s.addShape('rect', { x: MX + i * segW, y: H - 0.06, w: segW, h: 0.06, fill: { color: c } });
  });
}

function addMetricsRow(s: PptxGenJS.Slide, metrics: Array<{ label: string; value: string }>, y: number) {
  const count = Math.min(metrics.length, 4);
  const mW = CW / count;
  const accents = [C.deepBlue, C.purple, C.orchid, C.skyBlue];
  for (const [i, m] of metrics.slice(0, 4).entries()) {
    const mx = MX + i * mW;
    s.addShape('roundRect', { x: mx + 0.05, y, w: mW - 0.1, h: 0.85, fill: { color: C.nearWhite }, rectRadius: 0.08 });
    s.addShape('rect', { x: mx + 0.05, y, w: 0.04, h: 0.85, fill: { color: accents[i] } });
    // Use smaller font for long values, wrap text
    const valLen = (m.value || '').length;
    const valFont = valLen > 12 ? 10 : valLen > 8 ? 12 : 16;
    s.addText(m.value || '', { x: mx + 0.15, y: y + 0.03, w: mW - 0.3, h: 0.45, fontSize: valFont, fontFace: FONT, bold: true, color: C.deepBlue, align: 'center', valign: 'middle', shrinkText: true });
    s.addText(m.label || '', { x: mx + 0.15, y: y + 0.5, w: mW - 0.3, h: 0.3, fontSize: 6, fontFace: FONT, color: C.gray600, align: 'center', valign: 'top', shrinkText: true });
  }
}

// ── Workflow step renderers ──

type Out = Record<string, unknown>;

function renderAnalyze(s: PptxGenJS.Slide, out: Out) {
  let y = 1.15;
  if (typeof out.headline === 'string') {
    s.addText(out.headline, { x: MX, y, w: CW, h: 0.5, fontSize: 14, fontFace: FONT, bold: true, color: C.black });
    y += 0.55;
  }
  if (typeof out.impactStatement === 'string') {
    s.addShape('roundRect', { x: MX, y, w: CW, h: 0.35, fill: { color: C.peachLight }, rectRadius: 0.06 });
    s.addText(out.impactStatement, { x: MX + 0.15, y, w: CW - 0.3, h: 0.35, fontSize: 9, fontFace: FONT, color: C.deepBlue, valign: 'middle' });
    y += 0.5;
  }
  if (Array.isArray(out.findings)) {
    const levelColors: Record<string, string> = { High: C.purple, Medium: C.skyBlue, Low: C.gray400 };
    const levelBg: Record<string, string> = { High: C.pinkLight, Medium: 'E0EDFF', Low: C.gray200 };
    for (const f of out.findings as Array<{ name: string; insight: string; level: string }>) {
      if (y > 5.5) break;
      const color = levelColors[f.level] || C.gray400;
      s.addShape('roundRect', { x: MX, y, w: CW, h: 0.65, fill: { color: C.nearWhite }, rectRadius: 0.06 });
      s.addShape('rect', { x: MX, y, w: 0.04, h: 0.65, fill: { color } });
      s.addText(f.name || '', { x: MX + 0.2, y: y + 0.04, w: CW * 0.6, h: 0.25, fontSize: 10, fontFace: FONT, bold: true, color: C.gray800 });
      s.addShape('roundRect', { x: MX + CW - 0.8, y: y + 0.06, w: 0.6, h: 0.2, fill: { color: levelBg[f.level] || C.gray200 }, rectRadius: 0.05 });
      s.addText(f.level || '', { x: MX + CW - 0.8, y: y + 0.06, w: 0.6, h: 0.2, fontSize: 7, fontFace: FONT, bold: true, color, align: 'center', valign: 'middle' });
      s.addText(f.insight || '', { x: MX + 0.2, y: y + 0.32, w: CW - 0.4, h: 0.25, fontSize: 8, fontFace: FONT, color: C.gray600 });
      y += 0.75;
    }
  }
  if (Array.isArray(out.metrics)) {
    addMetricsRow(s, out.metrics as Array<{ label: string; value: string }>, Math.max(y + 0.1, 5.8));
  }
  if (typeof out.rationale === 'string' && y < 5.5) {
    s.addText(out.rationale, { x: MX, y: Math.max(y + 0.1, 5.0), w: CW, h: 0.5, fontSize: 8, fontFace: FONT, italic: true, color: C.gray400 });
  }
}

function renderInspect(s: PptxGenJS.Slide, out: Out) {
  let y = 1.15;
  if (typeof out.headline === 'string') {
    s.addText(out.headline, { x: MX, y, w: CW, h: 0.5, fontSize: 14, fontFace: FONT, bold: true, color: C.black });
    y += 0.55;
  }
  if (Array.isArray(out.profiles)) {
    const levelColors: Record<string, string> = { High: C.purple, Medium: C.skyBlue, Low: C.gray400 };
    for (const p of out.profiles as Array<{ name: string; level: string; behavior: string; action: string }>) {
      if (y > 5.8) break;
      s.addShape('roundRect', { x: MX, y, w: CW, h: 0.85, fill: { color: C.nearWhite }, rectRadius: 0.08 });
      s.addText(p.name || '', { x: MX + 0.15, y: y + 0.05, w: 4, h: 0.25, fontSize: 11, fontFace: FONT, bold: true, color: C.gray800 });
      const lc = levelColors[p.level] || C.gray400;
      s.addShape('roundRect', { x: MX + 4.3, y: y + 0.07, w: 0.6, h: 0.2, fill: { color: C.pinkLight }, rectRadius: 0.05 });
      s.addText(p.level, { x: MX + 4.3, y: y + 0.07, w: 0.6, h: 0.2, fontSize: 7, fontFace: FONT, bold: true, color: lc, align: 'center', valign: 'middle' });
      s.addText(p.behavior || '', { x: MX + 0.15, y: y + 0.32, w: CW - 0.3, h: 0.22, fontSize: 8, fontFace: FONT, color: C.gray600 });
      s.addText(`Action: ${p.action || ''}`, { x: MX + 0.15, y: y + 0.56, w: CW - 0.3, h: 0.22, fontSize: 8, fontFace: FONT, color: C.orchid });
      y += 0.95;
    }
  }
  if (Array.isArray(out.sections)) {
    for (const sec of out.sections as Array<{ label: string; content: string }>) {
      if (y > 6.0) break;
      s.addText(sec.label || '', { x: MX, y, w: CW, h: 0.22, fontSize: 9, fontFace: FONT, bold: true, color: C.purple });
      y += 0.25;
      s.addText(sec.content || '', { x: MX, y, w: CW, h: 0.35, fontSize: 8, fontFace: FONT, color: C.gray600 });
      y += 0.45;
    }
  }
}

function renderCreate(s: PptxGenJS.Slide, out: Out) {
  let y = 1.15;
  if (typeof out.headline === 'string') {
    s.addText(out.headline, { x: MX, y, w: CW, h: 0.5, fontSize: 14, fontFace: FONT, bold: true, color: C.black });
    y += 0.55;
  }
  if (Array.isArray(out.sections)) {
    for (const sec of out.sections as Array<{ label: string; content: string }>) {
      if (y > 4.5) break;
      s.addText(sec.label || '', { x: MX, y, w: CW, h: 0.22, fontSize: 9, fontFace: FONT, bold: true, color: C.purple });
      y += 0.25;
      s.addText(sec.content || '', { x: MX, y, w: CW, h: 0.4, fontSize: 8, fontFace: FONT, color: C.gray600 });
      y += 0.5;
    }
  }
  if (Array.isArray(out.channels)) {
    s.addText('CHANNELS', { x: MX, y, w: CW, h: 0.22, fontSize: 8, fontFace: FONT, bold: true, color: C.gray400 });
    y += 0.28;
    for (const ch of out.channels as Array<{ name: string; role: string }>) {
      if (y > 5.8) break;
      s.addShape('roundRect', { x: MX, y, w: CW, h: 0.35, fill: { color: C.nearWhite }, rectRadius: 0.06 });
      s.addText(ch.name || '', { x: MX + 0.15, y, w: 2, h: 0.35, fontSize: 9, fontFace: FONT, bold: true, color: C.gray800, valign: 'middle' });
      s.addText(ch.role || '', { x: MX + 2.3, y, w: CW - 2.6, h: 0.35, fontSize: 8, fontFace: FONT, color: C.gray600, valign: 'middle' });
      y += 0.4;
    }
  }
  if (Array.isArray(out.nextSteps)) {
    y = Math.max(y + 0.1, 5.5);
    const pc: Record<string, string> = { 'Do now': C.deepBlue, 'Test next': C.purple, 'Scale later': C.gray400 };
    for (const [i, a] of (out.nextSteps as Array<{ action: string; priority: string }>).entries()) {
      if (y > 6.8) break;
      s.addText(`${i + 1}. ${a.action || ''}`, { x: MX, y, w: CW - 1.5, h: 0.25, fontSize: 8, fontFace: FONT, color: C.gray600 });
      s.addText(a.priority || '', { x: MX + CW - 1.2, y, w: 1, h: 0.25, fontSize: 7, fontFace: FONT, bold: true, color: pc[a.priority] || C.gray400, align: 'right' });
      y += 0.3;
    }
  }
}

function renderCompare(s: PptxGenJS.Slide, out: Out) {
  let y = 1.15;
  if (typeof out.headline === 'string') {
    s.addText(out.headline, { x: MX, y, w: CW, h: 0.5, fontSize: 14, fontFace: FONT, bold: true, color: C.black });
    y += 0.6;
  }
  if (Array.isArray(out.options)) {
    const opts = out.options as Array<{ name: string; description: string; score: string; recommended: boolean }>;
    const optW = CW / opts.length;
    for (const [i, opt] of opts.entries()) {
      const ox = MX + i * optW;
      const borderColor = opt.recommended ? C.purple : C.gray200;
      s.addShape('roundRect', { x: ox + 0.05, y, w: optW - 0.1, h: 2.5, fill: { color: C.white }, line: { color: borderColor, width: opt.recommended ? 2 : 0.5 }, rectRadius: 0.1 });
      if (opt.recommended) {
        s.addShape('roundRect', { x: ox + optW - 1.3, y: y + 0.1, w: 1.1, h: 0.2, fill: { color: C.purple }, rectRadius: 0.05 });
        s.addText('RECOMMENDED', { x: ox + optW - 1.3, y: y + 0.1, w: 1.1, h: 0.2, fontSize: 6, fontFace: FONT, bold: true, color: C.white, align: 'center', valign: 'middle' });
      }
      s.addText(opt.name || '', { x: ox + 0.2, y: y + 0.15, w: optW - 0.4, h: 0.3, fontSize: 11, fontFace: FONT, bold: true, color: C.gray800, shrinkText: true });
      s.addText(opt.description || '', { x: ox + 0.2, y: y + 0.5, w: optW - 0.4, h: 1.3, fontSize: 7, fontFace: FONT, color: C.gray600, valign: 'top', shrinkText: true });
      s.addText(opt.score || '', { x: ox + 0.2, y: y + 1.9, w: optW - 0.4, h: 0.4, fontSize: 16, fontFace: FONT, bold: true, color: C.deepBlue, align: 'center', shrinkText: true });
    }
  }
  if (Array.isArray(out.metrics)) addMetricsRow(s, out.metrics as Array<{ label: string; value: string }>, 5.8);
}

function renderActivate(s: PptxGenJS.Slide, out: Out) {
  let y = 1.15;
  if (typeof out.headline === 'string') {
    s.addText(out.headline, { x: MX, y, w: CW, h: 0.5, fontSize: 14, fontFace: FONT, bold: true, color: C.black });
    y += 0.55;
  }
  if (typeof out.summary === 'string') {
    s.addText(out.summary, { x: MX, y, w: CW, h: 0.5, fontSize: 9, fontFace: FONT, color: C.gray600 });
    y += 0.6;
  }
  if (Array.isArray(out.destinations)) {
    for (const d of out.destinations as Array<{ channel: string; role: string; detail: string }>) {
      if (y > 5.0) break;
      s.addShape('roundRect', { x: MX, y, w: CW, h: 0.7, fill: { color: C.nearWhite }, rectRadius: 0.06 });
      s.addText(d.channel || '', { x: MX + 0.15, y: y + 0.05, w: 2.5, h: 0.25, fontSize: 10, fontFace: FONT, bold: true, color: C.gray800 });
      s.addText(d.role || '', { x: MX + 2.8, y: y + 0.05, w: CW - 3.1, h: 0.25, fontSize: 8, fontFace: FONT, color: C.orchid });
      s.addText(d.detail || '', { x: MX + 0.15, y: y + 0.35, w: CW - 0.3, h: 0.25, fontSize: 8, fontFace: FONT, color: C.gray600 });
      y += 0.8;
    }
  }
  if (Array.isArray(out.sections)) {
    for (const sec of out.sections as Array<{ label: string; content: string }>) {
      if (y > 6.0) break;
      s.addText(sec.label || '', { x: MX, y, w: CW, h: 0.22, fontSize: 9, fontFace: FONT, bold: true, color: C.purple });
      y += 0.25;
      s.addText(sec.content || '', { x: MX, y, w: CW, h: 0.4, fontSize: 8, fontFace: FONT, color: C.gray600 });
      y += 0.5;
    }
  }
}

function renderOptimize(s: PptxGenJS.Slide, out: Out) {
  let y = 1.15;
  if (typeof out.headline === 'string') {
    s.addText(out.headline, { x: MX, y, w: CW, h: 0.5, fontSize: 14, fontFace: FONT, bold: true, color: C.black });
    y += 0.55;
  }
  if (typeof out.rationale === 'string') {
    s.addText(out.rationale, { x: MX, y, w: CW, h: 0.5, fontSize: 9, fontFace: FONT, italic: true, color: C.gray600 });
    y += 0.6;
  }
  if (Array.isArray(out.changes)) {
    const pc: Record<string, string> = { 'Do now': C.deepBlue, 'Test next': C.purple, 'Scale later': C.gray400 };
    for (const [i, ch] of (out.changes as Array<{ action: string; priority: string }>).entries()) {
      if (y > 5.5) break;
      s.addShape('roundRect', { x: MX, y, w: CW, h: 0.4, fill: { color: C.white }, line: { color: C.gray200, width: 0.5 }, rectRadius: 0.06 });
      s.addShape('roundRect', { x: MX + 0.1, y: y + 0.08, w: 0.25, h: 0.25, fill: { color: C.purple }, rectRadius: 0.06 });
      s.addText(`${i + 1}`, { x: MX + 0.1, y: y + 0.08, w: 0.25, h: 0.25, fontSize: 9, fontFace: FONT, bold: true, color: C.white, align: 'center', valign: 'middle' });
      s.addText(ch.action || '', { x: MX + 0.5, y, w: CW - 2, h: 0.4, fontSize: 9, fontFace: FONT, color: C.gray600, valign: 'middle' });
      s.addText(ch.priority || '', { x: MX + CW - 1.2, y, w: 1, h: 0.4, fontSize: 8, fontFace: FONT, bold: true, color: pc[ch.priority] || C.gray400, align: 'right', valign: 'middle' });
      y += 0.48;
    }
  }
  if (Array.isArray(out.metrics)) addMetricsRow(s, out.metrics as Array<{ label: string; value: string }>, Math.max(y + 0.2, 5.8));
}

function renderGeneric(s: PptxGenJS.Slide, out: Out, summary: string) {
  let y = 1.15;
  if (typeof out.headline === 'string') {
    s.addText(out.headline, { x: MX, y, w: CW, h: 0.5, fontSize: 14, fontFace: FONT, bold: true, color: C.black });
    y += 0.6;
  }
  if (typeof out.impactStatement === 'string') {
    s.addShape('roundRect', { x: MX, y, w: CW, h: 0.35, fill: { color: C.peachLight }, rectRadius: 0.06 });
    s.addText(out.impactStatement, { x: MX + 0.15, y, w: CW - 0.3, h: 0.35, fontSize: 9, fontFace: FONT, color: C.deepBlue, valign: 'middle' });
    y += 0.5;
  }
  if (summary) {
    s.addText(summary, { x: MX, y, w: CW, h: 1.5, fontSize: 10, fontFace: FONT, color: C.gray600, valign: 'top' });
    y += 1.6;
  }
  if (Array.isArray(out.metrics)) addMetricsRow(s, out.metrics as Array<{ label: string; value: string }>, Math.max(y, 5.8));
}

const stepRenderers: Record<string, (s: PptxGenJS.Slide, out: Out, summary: string) => void> = {
  analyze: (s, out) => renderAnalyze(s, out),
  inspect: (s, out) => renderInspect(s, out),
  create: (s, out) => renderCreate(s, out),
  compare: (s, out) => renderCompare(s, out),
  activate: (s, out) => renderActivate(s, out),
  optimize: (s, out) => renderOptimize(s, out),
};

// ── DeckData layout builders ──

const builders: Record<string, (ps: PptxGenJS.Slide, sl: Slide) => void> = {
  cover: (ps, sl) => {
    // Soft gradient-like background using layered shapes (pink→lavender→blue)
    ps.background = { fill: C.nearWhite };
    ps.addShape('rect', { x: 0, y: 0, w: W, h: H, fill: { color: C.pinkLight } });
    ps.addShape('ellipse', { x: -2, y: -1, w: 8, h: 8, fill: { color: C.peachLight } });
    ps.addShape('ellipse', { x: 6, y: -2, w: 10, h: 10, fill: { color: C.pinkLight } });
    ps.addShape('ellipse', { x: 8, y: 2, w: 8, h: 8, fill: { color: 'D4E4FF' } });
    // Branding
    ps.addText('Treasure AI', { x: MX, y: 0.5, w: 4, h: 0.4, fontSize: 14, fontFace: FONT, bold: true, color: C.deepBlue });
    // Title
    ps.addText(sl.title, { x: MX, y: 2.5, w: CW * 0.7, h: 1.5, fontSize: 32, fontFace: FONT, bold: true, color: C.black });
    if (sl.subtitle) ps.addText(sl.subtitle, { x: MX, y: 4.2, w: CW * 0.7, h: 0.6, fontSize: 13, fontFace: FONT, color: C.gray600 });
  },
  hero: (ps, sl) => {
    ps.addText(sl.title, { x: MX, y: 0.3, w: CW, h: 0.5, fontSize: 16, fontFace: FONT, bold: true, color: C.black });
    let y = 0.9;
    if (sl.stat) {
      ps.addShape('roundRect', { x: MX, y, w: 3, h: 0.7, fill: { color: C.peachLight }, rectRadius: 0.08 });
      ps.addText(sl.stat, { x: MX + 0.15, y, w: 2.7, h: 0.45, fontSize: 18, fontFace: FONT, bold: true, color: C.deepBlue });
      if (sl.statLabel) ps.addText(sl.statLabel, { x: MX + 0.15, y: y + 0.42, w: 2.7, h: 0.2, fontSize: 7, fontFace: FONT, color: C.purple });
      y += 0.9;
    }
    if (sl.bullets?.length) {
      const bullets = sl.bullets.map(b => ({ text: b, options: { fontSize: 10, fontFace: FONT, color: C.gray600, bullet: { code: '25CF', color: C.purple }, indentLevel: 0 } }));
      ps.addText(bullets as PptxGenJS.TextProps[], { x: MX, y, w: CW, h: H - y - 0.5, valign: 'top', paraSpaceAfter: 6 });
    }
  },
  segments: (ps, sl) => {
    ps.addText(sl.title, { x: MX, y: 0.3, w: CW, h: 0.5, fontSize: 16, fontFace: FONT, bold: true, color: C.black });
    let y = 1.0;
    const levelColors: Record<string, string> = { High: C.purple, Medium: C.skyBlue, Low: C.gray400 };
    for (const [i, seg] of (sl.segments || []).entries()) {
      const color = levelColors[seg.level] || C.gray400;
      ps.addShape('roundRect', { x: MX, y, w: CW, h: 0.75, fill: { color: C.nearWhite }, rectRadius: 0.06 });
      ps.addShape('roundRect', { x: MX + 0.1, y: y + 0.15, w: 0.35, h: 0.35, fill: { color: C.purple }, rectRadius: 0.08 });
      ps.addText(`${i + 1}`, { x: MX + 0.1, y: y + 0.15, w: 0.35, h: 0.35, fontSize: 11, fontFace: FONT, bold: true, color: C.white, align: 'center', valign: 'middle' });
      ps.addText(seg.name, { x: MX + 0.6, y: y + 0.05, w: 4, h: 0.3, fontSize: 11, fontFace: FONT, bold: true, color: C.gray800 });
      ps.addText(seg.level, { x: MX + 4.8, y: y + 0.08, w: 0.7, h: 0.22, fontSize: 7, fontFace: FONT, bold: true, color, align: 'center' });
      ps.addText(seg.description, { x: MX + 0.6, y: y + 0.4, w: CW - 0.8, h: 0.25, fontSize: 8, fontFace: FONT, color: C.gray600 });
      y += 0.85;
    }
  },
  journey: (ps, sl) => {
    ps.addText(sl.title, { x: MX, y: 0.3, w: CW, h: 0.5, fontSize: 16, fontFace: FONT, bold: true, color: C.black });
    const stages = sl.stages || [];
    const stW = CW / (stages.length || 1);
    for (const [i, stage] of stages.entries()) {
      const x = MX + i * stW + stW / 2 - 0.2;
      ps.addShape('ellipse', { x, y: 1.2, w: 0.4, h: 0.4, fill: { color: C.pinkLight }, line: { color: C.purple, width: 1.5 } });
      ps.addText(`${i + 1}`, { x, y: 1.2, w: 0.4, h: 0.4, fontSize: 11, fontFace: FONT, bold: true, color: C.deepBlue, align: 'center', valign: 'middle' });
      if (i < stages.length - 1) ps.addShape('line', { x: x + 0.4, y: 1.4, w: stW - 0.4, h: 0, line: { color: C.purple, width: 1, dashType: 'dash' } });
      ps.addText(stage.name, { x: MX + i * stW, y: 1.75, w: stW, h: 0.3, fontSize: 9, fontFace: FONT, bold: true, color: C.gray800, align: 'center' });
      ps.addText(stage.description, { x: MX + i * stW, y: 2.08, w: stW, h: 0.6, fontSize: 7, fontFace: FONT, color: C.gray600, align: 'center' });
    }
  },
  kpi: (ps, sl) => {
    ps.addText(sl.title, { x: MX, y: 0.3, w: CW, h: 0.5, fontSize: 16, fontFace: FONT, bold: true, color: C.black });
    const accents = [C.deepBlue, C.purple, C.orchid, C.skyBlue];
    for (const [i, kpi] of (sl.kpis || []).entries()) {
      const col = i % 2; const row = Math.floor(i / 2);
      const x = MX + col * (CW / 2); const y = 1.0 + row * 1.4;
      const accent = accents[i % accents.length];
      ps.addShape('roundRect', { x, y, w: CW / 2 - 0.1, h: 1.1, fill: { color: C.nearWhite }, rectRadius: 0.08 });
      ps.addShape('rect', { x, y, w: 0.04, h: 1.1, fill: { color: accent } });
      ps.addText((kpi.name || '').toUpperCase(), { x: x + 0.2, y: y + 0.1, w: CW / 2 - 0.5, h: 0.2, fontSize: 7, fontFace: FONT, bold: true, color: accent });
      ps.addText(kpi.value || '', { x: x + 0.2, y: y + 0.35, w: CW / 2 - 0.5, h: 0.35, fontSize: 16, fontFace: FONT, bold: true, color: C.deepBlue });
      if (kpi.note) ps.addText(kpi.note, { x: x + 0.2, y: y + 0.75, w: CW / 2 - 0.5, h: 0.25, fontSize: 7, fontFace: FONT, color: C.gray600 });
    }
  },
  diagnosis: (ps, sl) => {
    ps.addText(sl.title, { x: MX, y: 0.3, w: CW, h: 0.5, fontSize: 16, fontFace: FONT, bold: true, color: C.black });
    const sevColors: Record<string, string> = { critical: 'EF4444', warning: C.peach, info: C.skyBlue };
    let y = 1.0;
    for (const f of sl.findings || []) {
      const color = sevColors[f.severity] || C.skyBlue;
      ps.addShape('roundRect', { x: MX, y, w: CW, h: 0.65, fill: { color: C.nearWhite }, rectRadius: 0.06 });
      ps.addShape('rect', { x: MX, y, w: 0.04, h: 0.65, fill: { color } });
      ps.addText(f.label, { x: MX + 0.2, y: y + 0.04, w: CW - 0.4, h: 0.25, fontSize: 10, fontFace: FONT, bold: true, color });
      ps.addText(f.detail, { x: MX + 0.2, y: y + 0.32, w: CW - 0.4, h: 0.25, fontSize: 8, fontFace: FONT, color: C.gray600 });
      y += 0.75;
    }
  },
  channels: (ps, sl) => {
    ps.addText(sl.title, { x: MX, y: 0.3, w: CW, h: 0.5, fontSize: 16, fontFace: FONT, bold: true, color: C.black });
    const colors = [C.deepBlue, C.purple, C.orchid, C.skyBlue, C.peach];
    let barX = MX;
    for (const [i, ch] of (sl.channels || []).entries()) {
      const segW = CW * (ch.percent / 100);
      ps.addShape('rect', { x: barX, y: 1.0, w: segW, h: 0.22, fill: { color: colors[i % colors.length] } });
      barX += segW;
    }
    let y = 1.5;
    for (const [i, ch] of (sl.channels || []).entries()) {
      ps.addShape('ellipse', { x: MX, y: y + 0.04, w: 0.14, h: 0.14, fill: { color: colors[i % colors.length] } });
      ps.addText(ch.name, { x: MX + 0.25, y, w: 2, h: 0.25, fontSize: 10, fontFace: FONT, bold: true, color: C.gray800 });
      ps.addText(ch.role, { x: MX + 2.5, y, w: CW - 4, h: 0.25, fontSize: 8, fontFace: FONT, color: C.gray600 });
      ps.addText(`${ch.percent}%`, { x: MX + CW - 1, y, w: 0.8, h: 0.25, fontSize: 10, fontFace: FONT, bold: true, color: C.deepBlue, align: 'right' });
      y += 0.35;
    }
  },
  strategy: (ps, sl) => {
    ps.addText(sl.title, { x: MX, y: 0.3, w: CW, h: 0.5, fontSize: 16, fontFace: FONT, bold: true, color: C.black });
    let y = 0.9;
    if (sl.highlight) {
      ps.addShape('roundRect', { x: MX, y, w: CW, h: 0.5, fill: { color: C.peachLight }, rectRadius: 0.06 });
      ps.addText(sl.highlight, { x: MX + 0.15, y, w: CW - 0.3, h: 0.5, fontSize: 10, fontFace: FONT, color: C.deepBlue, valign: 'middle' });
      y += 0.65;
    }
    if (sl.bullets?.length) {
      const bullets = sl.bullets.map(b => ({ text: b, options: { fontSize: 10, fontFace: FONT, color: C.gray600, bullet: { code: '25CF', color: C.purple }, indentLevel: 0 } }));
      ps.addText(bullets as PptxGenJS.TextProps[], { x: MX, y, w: CW, h: H - y - 0.5, valign: 'top', paraSpaceAfter: 6 });
    }
  },
  actions: (ps, sl) => {
    ps.addText(sl.title, { x: MX, y: 0.3, w: CW, h: 0.5, fontSize: 16, fontFace: FONT, bold: true, color: C.black });
    const pc: Record<string, string> = { 'Do now': C.deepBlue, 'Test next': C.purple, 'Scale later': C.gray400 };
    let y = 1.0;
    for (const [i, a] of (sl.actions || []).entries()) {
      const color = pc[a.priority] || C.gray400;
      ps.addShape('roundRect', { x: MX, y, w: CW, h: 0.4, fill: { color: C.white }, line: { color: C.gray200, width: 0.5 }, rectRadius: 0.06 });
      ps.addShape('roundRect', { x: MX + 0.1, y: y + 0.08, w: 0.25, h: 0.25, fill: { color: C.purple }, rectRadius: 0.06 });
      ps.addText(`${i + 1}`, { x: MX + 0.1, y: y + 0.08, w: 0.25, h: 0.25, fontSize: 9, fontFace: FONT, bold: true, color: C.white, align: 'center', valign: 'middle' });
      ps.addText(a.action, { x: MX + 0.5, y, w: CW - 2, h: 0.4, fontSize: 9, fontFace: FONT, color: C.gray600, valign: 'middle' });
      ps.addText(a.priority, { x: MX + CW - 1.2, y, w: 1, h: 0.4, fontSize: 8, fontFace: FONT, bold: true, color, align: 'right', valign: 'middle' });
      y += 0.48;
    }
  },
  impact: (ps, sl) => {
    ps.addText(sl.title, { x: MX, y: 0.3, w: CW, h: 0.5, fontSize: 16, fontFace: FONT, bold: true, color: C.black });
    let y = 1.0;
    if (sl.stat) {
      ps.addShape('roundRect', { x: MX, y, w: CW, h: 0.8, fill: { color: C.nearWhite }, rectRadius: 0.1 });
      ps.addText(sl.stat, { x: MX + 0.2, y: y + 0.05, w: CW - 0.4, h: 0.45, fontSize: 22, fontFace: FONT, bold: true, color: C.deepBlue });
      if (sl.statLabel) ps.addText(sl.statLabel, { x: MX + 0.2, y: y + 0.5, w: CW - 0.4, h: 0.2, fontSize: 7, fontFace: FONT, color: C.purple });
      y += 1.0;
    }
    if (sl.bullets?.length) {
      const bullets = sl.bullets.map(b => ({ text: b, options: { fontSize: 10, fontFace: FONT, color: C.gray600, bullet: { code: '2197', color: C.purple }, indentLevel: 0 } }));
      ps.addText(bullets as PptxGenJS.TextProps[], { x: MX, y, w: CW, h: H - y - 0.5, valign: 'top', paraSpaceAfter: 6 });
    }
  },
};

// ── Exports ──

export async function generatePptx(deck: DeckData): Promise<Blob> {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.author = 'Treasure AI Experience Center';
  pptx.title = deck.title;
  for (const slide of deck.slides) {
    const ps = pptx.addSlide();
    if (slide.layout !== 'cover') ps.background = { fill: C.white };
    (builders[slide.layout] || builders.strategy)(ps, slide);
    if (slide.speakerNotes) ps.addNotes(slide.speakerNotes);
  }
  return await pptx.write({ outputType: 'blob' }) as Blob;
}

type WfStep = { stepDef: { label: string; stepType: string; skillFamily?: string }; output: Record<string, unknown> | null; summary: string };

export async function generatePptxFromWorkflow(steps: WfStep[]): Promise<Blob> {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.author = 'Treasure AI Experience Center';
  pptx.title = 'Treasure AI Analysis';

  // Cover slide — soft gradient style
  const cover = pptx.addSlide();
  cover.background = { fill: C.nearWhite };
  cover.addShape('rect', { x: 0, y: 0, w: W, h: H, fill: { color: C.pinkLight } });
  cover.addShape('ellipse', { x: -2, y: -1, w: 8, h: 8, fill: { color: C.peachLight } });
  cover.addShape('ellipse', { x: 6, y: -2, w: 10, h: 10, fill: { color: C.pinkLight } });
  cover.addShape('ellipse', { x: 8, y: 2, w: 8, h: 8, fill: { color: 'D4E4FF' } });
  cover.addText('Treasure AI', { x: MX, y: 0.5, w: 4, h: 0.4, fontSize: 14, fontFace: FONT, bold: true, color: C.deepBlue });
  cover.addText('Experience Center Analysis', { x: MX, y: 2.5, w: CW * 0.7, h: 1.2, fontSize: 32, fontFace: FONT, bold: true, color: C.black });
  cover.addText(`${steps.length}-step workflow analysis`, { x: MX, y: 3.8, w: CW * 0.7, h: 0.5, fontSize: 13, fontFace: FONT, color: C.gray600 });

  for (const [i, step] of steps.entries()) {
    if (!step.output) continue;
    const s = pptx.addSlide();
    s.background = { fill: C.white };
    addSlideHeader(s, i + 1, step.stepDef.label, step.stepDef.stepType);
    const renderer = stepRenderers[step.stepDef.stepType] || renderGeneric;
    renderer(s, step.output, step.summary);
    s.addNotes(step.summary || step.stepDef.label);
  }

  return await pptx.write({ outputType: 'blob' }) as Blob;
}

export async function generatePptxFromOutput(output: import('../stores/experienceLabStore').OutputData): Promise<Blob> {
  const deck: DeckData = {
    title: output.summaryBanner.topRecommendation,
    subtitle: `${output.summaryBanner.goal} — ${output.summaryBanner.audience}`,
    slides: [
      { layout: 'cover', title: output.summaryBanner.topRecommendation, subtitle: `${output.summaryBanner.goal} | ${output.summaryBanner.audience}` },
      { layout: 'hero', title: 'Executive Summary', subtitle: output.summaryBanner.impactFraming, bullets: [output.executiveSummary] },
      { layout: 'segments', title: 'Audience Segments', segments: output.audienceCards.map(c => ({ name: c.name, score: c.opportunityLevel === 'High' ? 90 : c.opportunityLevel === 'Medium' ? 60 : 30, description: c.whyItMatters, level: c.opportunityLevel })) },
      { layout: 'channels', title: 'Channel Strategy', channels: output.channelStrategy.map(c => ({ name: c.channel, role: c.role, percent: Math.round(100 / output.channelStrategy.length) })) },
      { layout: 'kpi', title: 'KPI Framework', kpis: output.kpiFramework.map(k => ({ name: k.name, value: k.type, note: k.note })) },
      { layout: 'actions', title: 'Recommended Next Actions', actions: output.nextActions.map(a => ({ action: a.action, priority: a.priority })) },
    ],
  };
  return generatePptx(deck);
}
