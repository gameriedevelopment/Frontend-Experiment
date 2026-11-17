import type { HtmlTagDescriptor, Plugin } from "vite";

const patterns = {
  enzuzoId: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  gtmId: /^GTM-[A-Z0-9]+$/,
  gaMeasurementId: /^G-[A-Z0-9]+$/,
};

function valid(value: string | undefined, pattern: RegExp) {
  const trimmed = value?.trim();
  return trimmed && pattern.test(trimmed) ? trimmed : undefined;
}

// Consent Mode v2 defaults run first, so nothing is stored until the visitor opts in through Enzuzo.
const consentDefaults = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('consent','default',{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',wait_for_update:500});`;

/**
 * The same consent and analytics tags as the website, so one cookie choice covers both. GA loads directly
 * only when there's no Tag Manager container. The app is a single page, so GA's automatic page view is off
 * and `trackPageView` reports each route instead.
 */
export function analytics(options: { enzuzoId?: string; gtmId?: string; gaMeasurementId?: string }): Plugin {
  return {
    name: "gamerie-app-analytics",
    transformIndexHtml() {
      const enzuzoId = valid(options.enzuzoId, patterns.enzuzoId);
      const gtmId = valid(options.gtmId, patterns.gtmId);
      const gaId = valid(options.gaMeasurementId, patterns.gaMeasurementId);
      if (!enzuzoId && !gtmId && !gaId) return [];
      const tags: HtmlTagDescriptor[] = [{ tag: "script", children: consentDefaults, injectTo: "head-prepend" }];
      if (enzuzoId) tags.push({ tag: "script", attrs: { src: `https://app.enzuzo.com/scripts/cookiebar/${enzuzoId}` }, injectTo: "head-prepend" });
      if (gtmId)
        tags.push({
          tag: "script",
          children: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');`,
          injectTo: "head",
        });
      // Tag Manager carries GA itself, so loading GA as well would count every view twice.
      if (gaId && !gtmId)
        tags.push(
          { tag: "script", attrs: { async: true, src: `https://www.googletagmanager.com/gtag/js?id=${gaId}` }, injectTo: "head" },
          { tag: "script", children: `gtag('js',new Date());gtag('config','${gaId}',{send_page_view:false});`, injectTo: "head" },
        );
      return tags;
    },
  };
}
