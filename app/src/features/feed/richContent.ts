import DOMPurify from "dompurify";
import hljs from "highlight.js/lib/core";
import bash from "highlight.js/lib/languages/bash";
import css from "highlight.js/lib/languages/css";
import javascript from "highlight.js/lib/languages/javascript";
import json from "highlight.js/lib/languages/json";
import typescript from "highlight.js/lib/languages/typescript";
import xml from "highlight.js/lib/languages/xml";
import MarkdownIt from "markdown-it";
import { full as emoji } from "markdown-it-emoji";
import footnote from "markdown-it-footnote";
import sub from "markdown-it-sub";
import sup from "markdown-it-sup";
import taskLists from "markdown-it-task-lists";

type RenderRule = NonNullable<MarkdownIt["renderer"]["rules"]["text"]>;

hljs.registerLanguage("bash", bash);
hljs.registerLanguage("css", css);
hljs.registerLanguage("html", xml);
hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("js", javascript);
hljs.registerLanguage("json", json);
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("ts", typescript);

const markdown: MarkdownIt = new MarkdownIt({
  breaks: true,
  html: false,
  linkify: true,
  typographer: true,
  highlight(code: string, language: string): string {
    if (language && hljs.getLanguage(language))
      return `<pre class="hljs"><code>${hljs.highlight(code, { language }).value}</code></pre>`;
    return `<pre class="hljs"><code>${markdown.utils.escapeHtml(code)}</code></pre>`;
  },
})
  .use(emoji)
  .use(taskLists)
  .use(footnote)
  .use(sub)
  .use(sup);

// A trailing "\" is a markdown line break, but at the end of a paragraph or list item there is no line
// left to break, so markdown prints it. Drop it there. Escaped "\\" is a separate token and stays.
markdown.core.ruler.after("inline", "trailing_break", (state) => {
  for (const token of state.tokens) {
    const last = token.type === "inline" ? token.children?.at(-1) : undefined;
    if (last?.type === "text" && last.content.endsWith("\\")) last.content = last.content.slice(0, -1).trimEnd();
  }
});

const defaultLinkOpen: RenderRule =
  markdown.renderer.rules.link_open ??
  ((tokens, index, options, _environment, renderer) =>
    renderer.renderToken(tokens, index, options));
markdown.renderer.rules.link_open = (tokens, index, options, environment, renderer) => {
  const token = tokens[index];
  const href = token.attrGet("href") ?? "";
  if (/^https?:\/\//i.test(href)) {
    token.attrSet("target", "_blank");
    token.attrSet("rel", "noopener noreferrer");
  }
  return defaultLinkOpen(tokens, index, options, environment, renderer);
};

const defaultText: RenderRule =
  markdown.renderer.rules.text ??
  ((tokens, index) => markdown.utils.escapeHtml(tokens[index].content));
markdown.renderer.rules.text = (tokens, index, options, environment, renderer) => {
  let linkDepth = 0;
  for (let tokenIndex = 0; tokenIndex < index; tokenIndex += 1) {
    if (tokens[tokenIndex].type === "link_open") linkDepth += 1;
    if (tokens[tokenIndex].type === "link_close") linkDepth -= 1;
  }
  if (linkDepth > 0) return defaultText(tokens, index, options, environment, renderer);
  return markdown.utils
    .escapeHtml(tokens[index].content)
    .replace(
      /(^|\s)#([\p{L}\p{N}_-]+)/gu,
      (_match: string, spacing: string, tag: string) =>
        `${spacing}<a href="/search?tag=${encodeURIComponent(tag)}" class="rich-content__tag">#${tag}</a>`,
    )
    .replace(/(^|\s|\()@([a-z0-9_][a-z0-9_.-]{1,29})/gi, (_match: string, spacing: string, raw: string) => {
      const username = raw.replace(/[.-]+$/, "");
      const trailing = raw.slice(username.length);
      return `${spacing}<a href="/profile/${encodeURIComponent(username)}" class="rich-content__mention">@${username}</a>${trailing}`;
    });
};

/** Legacy editors saved paragraphs, breaks and mentions as HTML. Rewrite those few tags as markdown. */
function legacyHtml(text: string) {
  return text
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<p\b[^>]*>/gi, "")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<a\b[^>]*?\bhref="([^"]*)"[^>]*>(.*?)<\/a>/gi, (_match: string, href: string, label: string) => {
      if (label.startsWith("@")) return label;
      return /^(https?:\/\/|\/(?!\/))/i.test(href) ? `[${label}](<${href}>)` : label;
    });
}

/**
 * Brings older post formats in line with markdown: one editor ended every line with "\" and wrote a lone
 * "\" for an empty line, which would otherwise pull the next paragraph into a preceding list. Fenced
 * code and inline code are left exactly as written.
 */
function normalizeSource(source: string) {
  let fence = "";
  return source
    .replace(/\r\n?|\u2028|\u2029/g, "\n")
    .split("\n")
    .map((line) => {
      const marker = line.match(/^ {0,3}(`{3,}|~{3,})/)?.[1];
      if (fence) {
        if (marker && marker[0] === fence[0] && marker.length >= fence.length && !line.trim().slice(marker.length)) fence = "";
        return line;
      }
      if (marker) {
        fence = marker;
        return line;
      }
      if (/^[ \t]*\\[ \t]*$/.test(line)) return "";
      return line
        .split(/(`+[^`]*`+)/)
        .map((part, index) => (index % 2 ? part : legacyHtml(part)))
        .join("");
    })
    .join("\n");
}

export function renderRichContent(content: unknown) {
  const source = normalizeSource(String(content ?? "")).trim();
  if (!source) return "";
  return DOMPurify.sanitize(markdown.render(source), {
    ADD_ATTR: ["checked", "target"],
    FORBID_TAGS: ["form", "style"],
  });
}

export function plainTextPreview(content: unknown): string {
  const source = String(content ?? "");
  if (!source.trim()) return "";
  // Content can mix raw HTML (legacy mention anchors) and markdown. For a compact
  // preview we only want readable text: unwrap anchors to their label, drop any
  // other tags and markdown markers, and remove hard-break backslashes before decoding.
  // Markers are stripped before unescaping so an escaped \* stays literal.
  const withoutTags = source
    .replace(/<a\b[^>]*>(.*?)<\/a>/gis, "$1")
    .replace(/<\/?[^>]+>/g, "")
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^[ \t]{0,3}(?:#{1,6}[ \t]+|>[ \t]?|[-*+][ \t]+|\d+\.[ \t]+)/gm, "")
    .replace(/(\*\*|~~)(.+?)\1/g, "$2")
    .replace(/(^|[^\w*\\])\*(?=\S)([^*\n]+?)\*(?!\w)/g, "$1$2")
    .replace(/(^|[^\w\\])_(?=\S)([^_\n]+?)_(?!\w)/g, "$1$2")
    .replace(/`([^`\n]+)`/g, "$1")
    .replace(/\\(\r?\n)/g, "$1")
    .replace(/\\(?=[\s!-/:-@[-`{-~]|$)/g, "");
  const decoded = new DOMParser().parseFromString(withoutTags, "text/html").body.textContent ?? "";
  return decoded.replace(/\s+/g, " ").trim();
}

export function firstContentUrl(content: string) {
  const match = content.match(/https?:\/\/[^\s<>"']+/i)?.[0];
  return match?.replace(/[.,!?\])]+$/, "") ?? null;
}
