import type { HtmlTagDescriptor, Plugin } from "vite";

export interface SiteHeadOptions {
  siteUrl: string;
  indexable: boolean;
  shareImage: { path: string; width: number; height: number; alt: string };
  enzuzoId?: string;
  gtmId?: string;
  gaMeasurementId?: string;
}

const patterns = {
  enzuzoId: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  gtmId: /^GTM-[A-Z0-9]+$/,
  gaMeasurementId: /^G-[A-Z0-9]+$/,
};

function valid(value: string | undefined, pattern: RegExp) {
  const trimmed = value?.trim();
  return trimmed && pattern.test(trimmed) ? trimmed : undefined;
}

function readHead(html: string) {
  const title = html.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.trim() ?? "";
  const description =
    html.match(/<meta\s+name="description"\s+content="([\s\S]*?)"\s*\/?>/)?.[1]?.replace(/\s+/g, " ").trim() ?? "";
  return { title, description };
}

const meta = (attrs: Record<string, string>): HtmlTagDescriptor => ({ tag: "meta", attrs, injectTo: "head" });

// Consent Mode v2 defaults must run before Enzuzo and Google tags so nothing is stored until the visitor opts in.
const consentDefaults = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('consent','default',{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',wait_for_update:500});`;

function analyticsTags(options: SiteHeadOptions): HtmlTagDescriptor[] {
  const enzuzoId = valid(options.enzuzoId, patterns.enzuzoId);
  const gtmId = valid(options.gtmId, patterns.gtmId);
  const gaId = valid(options.gaMeasurementId, patterns.gaMeasurementId);
  if (!enzuzoId && !gtmId && !gaId) return [];

  const tags: HtmlTagDescriptor[] = [
    { tag: "script", children: consentDefaults, injectTo: "head-prepend" },
  ];
  if (enzuzoId) {
    tags.push({
      tag: "script",
      attrs: { src: `https://app.enzuzo.com/scripts/cookiebar/${enzuzoId}` },
      injectTo: "head-prepend",
    });
  }
  if (gtmId) {
    tags.push({
      tag: "script",
      children: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');`,
      injectTo: "head",
    });
  }
  // Tag Manager carries GA itself, so loading GA as well would count every view twice.
  if (gaId && !gtmId) {
    tags.push(
      { tag: "script", attrs: { async: true, src: `https://www.googletagmanager.com/gtag/js?id=${gaId}` }, injectTo: "head" },
      { tag: "script", children: `gtag('js',new Date());gtag('config','${gaId}');`, injectTo: "head" },
    );
  }
  return tags;
}

export function siteHead(options: SiteHeadOptions): Plugin {
  const siteUrl = options.siteUrl.replace(/\/+$/, "");
  const pageUrl = `${siteUrl}/`;
  const image = `${siteUrl}${options.shareImage.path}`;

  return {
    name: "gamerie-site-head",
    transformIndexHtml(html) {
      const { title, description } = readHead(html);
      return [
        meta({
          name: "robots",
          content: options.indexable ? "index, follow, max-image-preview:large" : "noindex, nofollow",
        }),
        { tag: "link", attrs: { rel: "canonical", href: pageUrl }, injectTo: "head" },
        meta({ property: "og:type", content: "website" }),
        meta({ property: "og:site_name", content: "Gamerie" }),
        meta({ property: "og:locale", content: "en_NG" }),
        meta({ property: "og:url", content: pageUrl }),
        meta({ property: "og:title", content: title }),
        meta({ property: "og:description", content: description }),
        meta({ property: "og:image", content: image }),
        meta({ property: "og:image:width", content: String(options.shareImage.width) }),
        meta({ property: "og:image:height", content: String(options.shareImage.height) }),
        meta({ property: "og:image:alt", content: options.shareImage.alt }),
        meta({ name: "twitter:card", content: "summary_large_image" }),
        meta({ name: "twitter:title", content: title }),
        meta({ name: "twitter:description", content: description }),
        meta({ name: "twitter:image", content: image }),
        ...analyticsTags(options),
      ];
    },
    generateBundle() {
      this.emitFile({
        type: "asset",
        fileName: "robots.txt",
        source: options.indexable
          ? `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`
          : "User-agent: *\nDisallow: /\n",
      });
      if (!options.indexable) return;
      this.emitFile({
        type: "asset",
        fileName: "sitemap.xml",
        source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>${pageUrl}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>1.0</priority>\n  </url>\n</urlset>\n`,
      });
    },
  };
}
