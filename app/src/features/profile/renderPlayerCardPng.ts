import type { PlayerCardModel, PlayerCardStatTone } from "./playerCard";

// Fixed 4:5 portrait, the size social apps show without cropping.
const width = 1080;
const height = 1350;
const pad = 88;

const palette = {
  ink950: "#0a0710",
  ink900: "#110c19",
  ink800: "#1c1528",
  lavender: "#c6a3ff",
  lavender300: "#d9c3ff",
  signal: "#d4ff5a",
  mist50: "#f7f3fc",
  mist300: "#b9b1c6",
  mist500: "#676072",
  line: "rgba(255,255,255,0.08)",
};

const display = '"Archivo Variable", "Archivo", sans-serif';
const mono = '"Geist Mono Variable", "Geist Mono", ui-monospace, monospace';

async function loadFonts() {
  await Promise.all(
    [`800 64px ${display}`, `600 32px ${display}`, `500 24px ${mono}`].map((font) => document.fonts?.load(font).catch(() => undefined)),
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

function setFont(context: CanvasRenderingContext2D, font: string, stretch: CanvasFontStretch = "normal") {
  context.font = font;
  if ("fontStretch" in context) context.fontStretch = stretch;
}

/** Shortens text with an ellipsis until it fits the width. */
function fit(context: CanvasRenderingContext2D, text: string, maxWidth: number) {
  if (context.measureText(text).width <= maxWidth) return text;
  let value = text;
  while (value.length > 1 && context.measureText(`${value}…`).width > maxWidth) value = value.slice(0, -1);
  return `${value}…`;
}

function label(context: CanvasRenderingContext2D, text: string, x: number, y: number, color: string, align: CanvasTextAlign = "left") {
  setFont(context, `500 22px ${mono}`);
  context.fillStyle = color;
  context.textAlign = align;
  // Canvas has no letter-spacing everywhere yet; spacing the characters keeps the tracked look.
  const spaced = text.toUpperCase().split("").join(" ");
  context.fillText(spaced, x, y);
  context.textAlign = "left";
}

function roundedRect(context: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  context.beginPath();
  context.roundRect(x, y, w, h, r);
}

/** The halftone dot field from the app, fading out from the top-right corner. */
function halftone(context: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
  const step = 18;
  for (let row = 0; row < h / step; row++) {
    for (let col = 0; col < w / step; col++) {
      const px = x + col * step + (row % 2 ? step / 2 : 0);
      const py = y + row * step;
      const distance = Math.hypot((x + w - px) / w, (py - y) / h);
      const strength = Math.max(0, 1 - distance * 1.25);
      if (strength <= 0.02) continue;
      context.globalAlpha = strength * 0.55;
      context.fillStyle = color;
      context.beginPath();
      context.arc(px, py, 2.6 * strength + 0.6, 0, Math.PI * 2);
      context.fill();
    }
  }
  context.globalAlpha = 1;
}

function initials(name: string) {
  return (
    name
      .split(/[\s._-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "G"
  );
}

function tokenMark(context: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) {
  // The Gamerie token: a round head over a capsule body.
  context.fillStyle = color;
  context.beginPath();
  context.arc(x + size * 0.5, y + size * 0.2, size * 0.2, 0, Math.PI * 2);
  context.fill();
  roundedRect(context, x + size * 0.3, y + size * 0.46, size * 0.4, size * 0.54, size * 0.2);
  context.fill();
}

const toneColor = (tone: PlayerCardStatTone) => (tone === "achievement" ? palette.signal : tone === "brand" ? palette.lavender300 : palette.mist50);

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

  context.fillStyle = palette.ink900;
  context.fillRect(0, 0, width, height);

  // Lavender header
  const headerHeight = 470;
  context.fillStyle = palette.lavender;
  context.fillRect(0, 0, width, headerHeight);
  halftone(context, 0, 0, width, headerHeight, palette.ink950);
  label(context, "Player ID", pad, pad + 6, palette.ink950);
  if (model.gamerieId) label(context, model.gamerieId, width - pad, pad + 6, "rgba(10,7,16,0.6)", "right");

  const avatarSize = 176;
  const avatarY = headerHeight - pad - avatarSize + 24;
  context.save();
  context.beginPath();
  context.arc(pad + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
  context.closePath();
  context.fillStyle = palette.ink950;
  context.fill();
  context.clip();
  if (avatar) {
    const ratio = Math.max(avatarSize / avatar.naturalWidth, avatarSize / avatar.naturalHeight);
    const w = avatar.naturalWidth * ratio;
    const h = avatar.naturalHeight * ratio;
    context.drawImage(avatar, pad + (avatarSize - w) / 2, avatarY + (avatarSize - h) / 2, w, h);
  } else {
    setFont(context, `800 64px ${display}`, "expanded");
    context.fillStyle = palette.lavender300;
    context.textAlign = "center";
    context.fillText(initials(model.username), pad + avatarSize / 2, avatarY + avatarSize / 2 + 22);
    context.textAlign = "left";
  }
  context.restore();

  const textX = pad + avatarSize + 40;
  const textWidth = width - textX - pad;
  setFont(context, `800 72px ${display}`, "expanded");
  context.fillStyle = palette.ink950;
  context.fillText(fit(context, model.username.toUpperCase(), textWidth), textX, avatarY + 104);
  setFont(context, `600 30px ${display}`);
  context.fillStyle = "rgba(10,7,16,0.7)";
  context.fillText(fit(context, [model.title, model.region].filter(Boolean).join(" · "), textWidth), textX, avatarY + 152);

  // Game and standing
  let y = headerHeight + 96;
  const half = (width - pad * 2) / 2;
  label(context, "Game", pad, y, palette.mist500);
  label(context, "Standing", pad + half, y, palette.mist500);
  setFont(context, `600 38px ${display}`);
  context.fillStyle = palette.mist50;
  context.fillText(fit(context, model.game?.name ?? "Not shared", half - 24), pad, y + 56);
  context.fillText(fit(context, model.game?.standing ?? "Not recorded", half - 24), pad + half, y + 56);
  if (model.game?.identity) {
    setFont(context, `500 26px ${display}`);
    context.fillStyle = palette.mist300;
    context.fillText(fit(context, model.game.identity, half - 24), pad, y + 96);
  }

  y += 140;
  context.fillStyle = palette.line;
  context.fillRect(pad, y, width - pad * 2, 2);

  // Stats as label and value rows
  y += 70;
  for (const stat of model.stats.slice(0, 4)) {
    setFont(context, `600 32px ${display}`);
    context.fillStyle = palette.mist50;
    context.fillText(fit(context, stat.label, width - pad * 2 - 260), pad, y);
    setFont(context, `500 24px ${display}`);
    context.fillStyle = palette.mist500;
    context.fillText(fit(context, stat.context, width - pad * 2 - 260), pad, y + 36);
    setFont(context, `800 52px ${display}`, "expanded");
    context.fillStyle = toneColor(stat.tone);
    context.textAlign = "right";
    context.fillText(stat.value, width - pad, y + 24);
    context.textAlign = "left";
    y += 104;
  }
  if (!model.stats.length) {
    setFont(context, `500 30px ${display}`);
    context.fillStyle = palette.mist500;
    context.fillText("No competitive statistics recorded yet.", pad, y);
    y += 80;
  }

  // Endorsed strengths, as many as fit above the footer
  const footerY = height - 120;
  const strengths = model.strengths.filter((strength) => strength.name);
  if (strengths.length && y < footerY - 120) {
    context.fillStyle = palette.line;
    context.fillRect(pad, y - 34, width - pad * 2, 2);
    y += 26;
    for (const strength of strengths) {
      if (y > footerY - 60) break;
      context.fillStyle = strength.endorsementCount ? palette.lavender300 : palette.mist500;
      context.beginPath();
      context.arc(pad + 10, y - 10, 8, 0, Math.PI * 2);
      context.fill();
      setFont(context, `600 30px ${display}`);
      context.fillStyle = palette.mist50;
      context.fillText(fit(context, strength.name, width - pad * 2 - 320), pad + 40, y);
      setFont(context, `500 24px ${display}`);
      context.fillStyle = palette.mist500;
      context.textAlign = "right";
      context.fillText(strength.endorsementCount ? `${strength.endorsementCount} endorsed` : "Player listed", width - pad, y);
      context.textAlign = "left";
      y += 56;
    }
  }

  // Footer
  context.fillStyle = palette.ink950;
  context.fillRect(0, footerY, width, height - footerY);
  context.fillStyle = palette.line;
  context.fillRect(0, footerY, width, 2);
  tokenMark(context, pad, footerY + 40, 40, palette.lavender);
  label(context, "gamerie.gg", pad + 60, footerY + 70, palette.mist300);
  label(context, "Player card", width - pad, footerY + 70, palette.mist500, "right");

  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("The card couldn't be drawn."))), "image/png"),
  );
}
