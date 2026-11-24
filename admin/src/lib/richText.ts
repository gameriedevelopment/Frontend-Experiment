import DOMPurify from "dompurify";
import MarkdownIt from "markdown-it";

const markdown: MarkdownIt = new MarkdownIt({ breaks: true, html: false, linkify: true, typographer: true });

// A trailing "\" is a markdown line break, but at the end of a paragraph there is no line left to break,
// so markdown prints it. Drop it there.
markdown.core.ruler.after("inline", "trailing_break", (state) => {
  for (const token of state.tokens) {
    const last = token.type === "inline" ? token.children?.at(-1) : undefined;
    if (last?.type === "text" && last.content.endsWith("\\")) last.content = last.content.slice(0, -1).trimEnd();
  }
});

markdown.renderer.rules.link_open = (tokens, index, options, _environment, renderer) => {
  tokens[index].attrSet("target", "_blank");
  tokens[index].attrSet("rel", "noopener noreferrer nofollow");
  return renderer.renderToken(tokens, index, options);
};

/** Older editors saved breaks, paragraphs and mention links as HTML. */
function legacyHtml(text: string) {
  return text
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<p\b[^>]*>/gi, "")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<a\b[^>]*?\bhref="([^"]*)"[^>]*>(.*?)<\/a>/gi, (_match: string, href: string, label: string) =>
      label.startsWith("@") || !/^https?:\/\//i.test(href) ? label : `[${label}](<${href}>)`,
    );
}

/**
 * One editor ended every line with "\" and wrote a lone "\" for an empty line. Turn those into plain
 * markdown, leaving fenced and inline code exactly as written.
 */
function normalize(source: string) {
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

/** Post or comment text as safe HTML, the way players saw it. */
export function renderRichText(content: unknown) {
  const source = normalize(String(content ?? "")).trim();
  if (!source) return "";
  return DOMPurify.sanitize(markdown.render(source), { ADD_ATTR: ["target"], FORBID_TAGS: ["form", "style", "img"] });
}

/** The same text flattened to one line, for previews. */
export function plainText(content: unknown) {
  const html = renderRichText(content);
  if (!html) return "";
  return (new DOMParser().parseFromString(html, "text/html").body.textContent ?? "").replace(/\s+/g, " ").trim();
}
