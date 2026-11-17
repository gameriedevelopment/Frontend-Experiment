import { type PlayerCardModel, type PlayerCardStat, type PlayerCardStatTone } from "./playerCard";

// Fixed 4:5 portrait, the size social apps show without cropping. The card is laid out in the same
// CSS pixels as on screen (400 wide), then scaled to fit and centered on a dark stage.
const width = 1080;
const height = 1350;
const cardWidth = 400;
const pad = 24;
const inner = cardWidth - pad * 2;

const palette = {
  ink950: "#0a0710",
  ink900: "#110c19",
  lavender200: "#dfd0ff",
  lavender300: "#d1b9ff",
  lavender400: "#c6a3ff",
  lavender500: "#aa82e8",
  lavender600: "#8967bd",
  signal: "#d4ff5a",
  mist50: "#f7f3fc",
  mist100: "#ebe5f2",
  mist300: "#b9b1c6",
  mist400: "#8e869b",
  mist500: "#676072",
  tile: "rgba(255,255,255,0.035)",
  line: "rgba(255,255,255,0.06)",
  ring: "rgba(255,255,255,0.1)",
};

const display = '"Archivo Variable", "Archivo", sans-serif';
const sans = '"Archivo Variable", "Archivo", ui-sans-serif, sans-serif';
const mono = '"Geist Mono Variable", "Geist Mono", ui-monospace, monospace';

const toneColor = (tone: PlayerCardStatTone) =>
  tone === "achievement" ? palette.signal : tone === "brand" ? palette.lavender300 : palette.mist50;

async function loadFonts() {
  await Promise.all(
    [`800 32px ${display}`, `600 16px ${sans}`, `500 11px ${mono}`].map((font) => document.fonts?.load(font).catch(() => undefined)),
  );
  await document.fonts?.ready;
}

function loadImage(source?: string): Promise<HTMLImageElement | null> {
  if (!source) return Promise.resolve(null);
  return new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = source;
  });
}

type TextOptions = {
  font: string;
  color: string;
  align?: CanvasTextAlign;
  maxWidth?: number;
  stretch?: CanvasFontStretch;
  tracking?: number;
};

/** Draws one line of text, shortened with an ellipsis until it fits. Returns the drawn width. */
function text(context: CanvasRenderingContext2D, value: string, x: number, y: number, options: TextOptions) {
  context.font = options.font;
  if ("fontStretch" in context) context.fontStretch = options.stretch ?? "normal";
  if ("letterSpacing" in context) context.letterSpacing = `${options.tracking ?? 0}px`;
  context.fillStyle = options.color;
  context.textAlign = options.align ?? "left";
  let line = value;
  if (options.maxWidth && context.measureText(line).width > options.maxWidth) {
    while (line.length > 1 && context.measureText(`${line}…`).width > options.maxWidth) line = line.slice(0, -1);
    line = `${line}…`;
  }
  context.fillText(line, x, y);
  return context.measureText(line).width;
}

function label(context: CanvasRenderingContext2D, value: string, x: number, y: number, color: string, align: CanvasTextAlign = "left") {
  return text(context, value.toUpperCase(), x, y, { font: `500 11px ${mono}`, color, align, tracking: 1.76 });
}

function initials(name: string) {
  return (name.trim() || "G").slice(0, 2).toUpperCase();
}

function tokenMark(context: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) {
  // The Gamerie token: a round head over a capsule body, 32 by 100 in its own units.
  const unit = size / 100;
  context.fillStyle = color;
  context.beginPath();
  context.arc(x + 16 * unit, y + 16 * unit, 16 * unit, 0, Math.PI * 2);
  context.fill();
  context.beginPath();
  context.roundRect(x, y + 35 * unit, 32 * unit, 65 * unit, 16 * unit);
  context.fill();
}

/** The halftone dot field, fading out from the top-right corner like the on-screen header. */
function halftone(context: CanvasRenderingContext2D, w: number, h: number) {
  const step = 6;
  context.fillStyle = palette.ink950;
  for (let py = step / 2; py < h; py += step) {
    for (let px = step / 2; px < w; px += step) {
      const strength = 1 - Math.hypot((w - px) / w, py / h) / 0.92;
      if (strength <= 0) continue;
      context.globalAlpha = Math.min(1, strength) * 0.2;
      context.beginPath();
      context.arc(px, py, 1.05, 0, Math.PI * 2);
      context.fill();
    }
  }
  context.globalAlpha = 1;
}

function tileHeight(count: number) {
  const rows = count > 1 ? Math.ceil(count / 2) : count;
  return rows ? rows * 92 + (rows - 1) * 10 : 0;
}

function layout(model: PlayerCardModel) {
  const level = model.stats.find((stat) => stat.key === "gamerie-level");
  const stats = model.stats.filter((stat) => stat !== level);
  const sections = [
    model.game?.identity ? 58 : 42,
    level ? 70 : 0,
    stats.length ? tileHeight(stats.length) : model.stats.length ? 0 : 62,
    model.strengths.length ? 23 + model.strengths.length * 20 + (model.strengths.length - 1) * 10 : 0,
  ].filter(Boolean);
  const body = 20 + sections.reduce((sum, value) => sum + value, 0) + (sections.length - 1) * 24 + 24;
  return { level, stats, header: 143, body, footer: 48, total: 143 + body + 48 };
}

function drawStat(context: CanvasRenderingContext2D, stat: PlayerCardStat, x: number, y: number, w: number) {
  context.fillStyle = palette.tile;
  context.strokeStyle = palette.line;
  context.lineWidth = 1;
  context.beginPath();
  context.roundRect(x + 0.5, y + 0.5, w - 1, 91, 16);
  context.fill();
  context.stroke();
  const valueWidth = text(context, stat.value, x + 14, y + 36, {
    font: `800 22px ${display}`,
    color: toneColor(stat.tone),
    stretch: "expanded",
    maxWidth: w - 28,
  });
  if (stat.unit) {
    text(context, stat.unit.toUpperCase(), x + 14 + valueWidth + (stat.unit === "%" ? 2 : 4), y + 36, {
      font: `800 12px ${display}`,
      color: toneColor(stat.tone),
      stretch: "expanded",
    });
  }
  text(context, stat.label, x + 14, y + 62, { font: `600 12px ${sans}`, color: palette.mist100, maxWidth: w - 28 });
  text(context, stat.context, x + 14, y + 78, { font: `400 11px ${sans}`, color: palette.mist500, maxWidth: w - 28 });
}

function drawCheck(context: CanvasRenderingContext2D, x: number, y: number, endorsed: boolean) {
  const color = endorsed ? palette.lavender300 : palette.mist500;
  context.fillStyle = endorsed ? "rgba(209,185,255,0.18)" : "rgba(103,96,114,0.18)";
  context.strokeStyle = color;
  context.lineWidth = 1.4;
  context.beginPath();
  context.arc(x + 9, y + 9, 7.5, 0, Math.PI * 2);
  context.fill();
  context.stroke();
  context.beginPath();
  context.moveTo(x + 5.6, y + 9.2);
  context.lineTo(x + 8, y + 11.6);
  context.lineTo(x + 12.6, y + 6.8);
  context.stroke();
}

/** Draws the Player Card as a PNG for downloading and sharing. */
export async function renderPlayerCardPng(model: PlayerCardModel): Promise<Blob> {
  await loadFonts();
  const avatar = await loadImage(model.profileImage);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas isn't available in this browser.");
  context.textBaseline = "alphabetic";

  const card = layout(model);
  const scale = Math.min((width - 260) / cardWidth, (height - 150) / card.total);
  const originX = (width - cardWidth * scale) / 2;
  const originY = (height - card.total * scale) / 2;

  // Stage
  context.fillStyle = palette.ink950;
  context.fillRect(0, 0, width, height);
  const glow = context.createRadialGradient(width / 2, height * 0.45, 0, width / 2, height * 0.45, width * 0.7);
  glow.addColorStop(0, "rgba(198,163,255,0.2)");
  glow.addColorStop(1, "rgba(198,163,255,0)");
  context.fillStyle = glow;
  context.fillRect(0, 0, width, height);

  context.setTransform(scale, 0, 0, scale, originX, originY);

  // Card body and shadow
  context.save();
  context.shadowColor = "rgba(0,0,0,0.75)";
  context.shadowBlur = 60;
  context.shadowOffsetY = 30;
  context.fillStyle = palette.ink900;
  context.beginPath();
  context.roundRect(0, 0, cardWidth, card.total, 28);
  context.fill();
  context.restore();

  context.save();
  context.beginPath();
  context.roundRect(0, 0, cardWidth, card.total, 28);
  context.clip();

  // Header
  const header = context.createLinearGradient(0, 0, cardWidth, card.header);
  header.addColorStop(0, palette.lavender200);
  header.addColorStop(0.45, palette.lavender400);
  header.addColorStop(1, palette.lavender500);
  context.fillStyle = header;
  context.fillRect(0, 0, cardWidth, card.header);
  halftone(context, cardWidth, card.header);
  const sheen = context.createLinearGradient(40, 0, 260, card.header);
  sheen.addColorStop(0, "rgba(255,255,255,0)");
  sheen.addColorStop(0.5, "rgba(255,255,255,0.22)");
  sheen.addColorStop(1, "rgba(255,255,255,0)");
  context.fillStyle = sheen;
  context.fillRect(0, 0, cardWidth, card.header);

  label(context, "Player ID", pad, 29, palette.ink950);
  if (model.gamerieId) label(context, model.gamerieId, cardWidth - pad, 29, "rgba(10,7,16,0.6)", "right");

  const avatarX = pad + 28;
  const avatarY = 91;
  context.fillStyle = palette.ink950;
  context.beginPath();
  context.arc(avatarX, avatarY, 31, 0, Math.PI * 2);
  context.fill();
  context.save();
  context.beginPath();
  context.arc(avatarX, avatarY, 28, 0, Math.PI * 2);
  context.clip();
  if (avatar) {
    const ratio = Math.max(56 / avatar.naturalWidth, 56 / avatar.naturalHeight);
    const w = avatar.naturalWidth * ratio;
    const h = avatar.naturalHeight * ratio;
    context.drawImage(avatar, avatarX - w / 2, avatarY - h / 2, w, h);
  } else {
    text(context, initials(model.username), avatarX, avatarY + 6, { font: `700 16px ${sans}`, color: palette.lavender300, align: "center" });
  }
  context.restore();

  const nameX = pad + 56 + 16;
  const nameWidth = cardWidth - nameX - pad;
  text(context, model.username.toUpperCase(), nameX, 86, {
    font: `800 30px ${display}`,
    color: palette.ink950,
    stretch: "expanded",
    tracking: -0.6,
    maxWidth: nameWidth,
  });
  text(context, [model.title, model.region].filter(Boolean).join("  ·  "), nameX, 115, {
    font: `500 14px ${sans}`,
    color: "rgba(10,7,16,0.7)",
    maxWidth: nameWidth,
  });

  // Main game and standing
  let y = card.header + 20;
  label(context, "Main game", pad, y + 9, palette.mist500);
  let pillWidth = 0;
  if (model.game?.standing) {
    context.font = `600 12px ${sans}`;
    if ("letterSpacing" in context) context.letterSpacing = "0px";
    pillWidth = Math.min(inner * 0.45, context.measureText(model.game.standing).width + 24);
    const pillY = y + (model.game.identity ? 15 : 7);
    context.fillStyle = "rgba(198,163,255,0.12)";
    context.strokeStyle = "rgba(198,163,255,0.25)";
    context.beginPath();
    context.roundRect(cardWidth - pad - pillWidth + 0.5, pillY + 0.5, pillWidth - 1, 27, 14);
    context.fill();
    context.stroke();
    text(context, model.game.standing, cardWidth - pad - pillWidth / 2, pillY + 18, {
      font: `600 12px ${sans}`,
      color: palette.lavender200,
      align: "center",
      maxWidth: pillWidth - 20,
    });
  }
  const gameWidth = inner - (pillWidth ? pillWidth + 16 : 0);
  text(context, model.game?.name || "No game shared yet", pad, y + 36, { font: `600 16px ${sans}`, color: palette.mist50, maxWidth: gameWidth });
  if (model.game?.identity) text(context, model.game.identity, pad, y + 54, { font: `400 12px ${sans}`, color: palette.mist400, maxWidth: gameWidth });
  y += (model.game?.identity ? 58 : 42) + 24;

  // Level and progress
  if (card.level) {
    label(context, card.level.label, pad, y + 20, palette.mist300);
    const unitWidth = card.level.unit
      ? text(context, card.level.unit.toUpperCase(), cardWidth - pad, y + 20, { font: `800 12px ${display}`, color: palette.lavender300, align: "right", stretch: "expanded" }) + 4
      : 0;
    text(context, card.level.value, cardWidth - pad - unitWidth, y + 20, {
      font: `800 22px ${display}`,
      color: palette.lavender300,
      align: "right",
      stretch: "expanded",
    });
    if (model.levelProgress !== undefined) {
      context.fillStyle = "rgba(255,255,255,0.08)";
      context.beginPath();
      context.roundRect(pad, y + 34, inner, 6, 3);
      context.fill();
      const fill = context.createLinearGradient(pad, 0, pad + inner, 0);
      fill.addColorStop(0, palette.lavender600);
      fill.addColorStop(1, palette.lavender300);
      context.fillStyle = fill;
      context.beginPath();
      context.roundRect(pad, y + 34, Math.max(6, (inner * Math.max(2, model.levelProgress)) / 100), 6, 3);
      context.fill();
    }
    text(context, card.level.context, pad, y + 62, { font: `400 12px ${sans}`, color: palette.mist500 });
    y += 70 + 24;
  }

  // Stat tiles, two to a row; a third spans the row
  if (card.stats.length) {
    const half = (inner - 10) / 2;
    card.stats.forEach((stat, index) => {
      const full = card.stats.length === 1 || (card.stats.length === 3 && index === 2);
      const row = Math.floor(index / 2);
      drawStat(context, stat, pad + (full ? 0 : (index % 2) * (half + 10)), y + row * 102, full ? inner : half);
    });
    y += tileHeight(card.stats.length) + 24;
  } else if (!model.stats.length) {
    context.fillStyle = palette.tile;
    context.beginPath();
    context.roundRect(pad, y, inner, 62, 16);
    context.fill();
    text(context, "No competitive statistics recorded yet.", cardWidth / 2, y + 36, { font: `400 14px ${sans}`, color: palette.mist400, align: "center" });
    y += 62 + 24;
  }

  // Top skills
  if (model.strengths.length) {
    label(context, "Top skills", pad, y + 9, palette.mist500);
    y += 23;
    for (const strength of model.strengths) {
      drawCheck(context, pad, y + 1, strength.endorsementCount > 0);
      const note = strength.endorsementCount ? `${strength.endorsementCount} endorsed` : "Player listed";
      const noteWidth = text(context, note, cardWidth - pad, y + 15, { font: `400 12px ${sans}`, color: palette.mist500, align: "right" });
      text(context, strength.name, pad + 30, y + 15, { font: `500 14px ${sans}`, color: palette.mist50, maxWidth: inner - 30 - noteWidth - 12 });
      y += 30;
    }
  }

  // Footer
  const footerY = card.total - card.footer;
  context.fillStyle = "rgba(10,7,16,0.4)";
  context.fillRect(0, footerY, cardWidth, card.footer);
  context.fillStyle = palette.line;
  context.fillRect(0, footerY, cardWidth, 1);
  tokenMark(context, pad, footerY + 17, 14, palette.lavender400);
  label(context, "gamerie.gg", pad + 13, footerY + 28, palette.mist500);
  label(context, "Player card", cardWidth - pad, footerY + 28, palette.mist500, "right");

  // Top edge highlight and outline
  const edge = context.createLinearGradient(40, 0, cardWidth - 40, 0);
  edge.addColorStop(0, "rgba(255,255,255,0)");
  edge.addColorStop(0.5, "rgba(255,255,255,0.7)");
  edge.addColorStop(1, "rgba(255,255,255,0)");
  context.fillStyle = edge;
  context.fillRect(40, 0, cardWidth - 80, 1);
  context.restore();

  context.strokeStyle = palette.ring;
  context.lineWidth = 1;
  context.beginPath();
  context.roundRect(0.5, 0.5, cardWidth - 1, card.total - 1, 28);
  context.stroke();

  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("The card couldn't be drawn."))), "image/png"),
  );
}
