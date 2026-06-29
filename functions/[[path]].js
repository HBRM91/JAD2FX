/**
 * Cloudflare Pages Function — proxies /sitemap.xml, /rss/*.xml, /og-image
 * to the Cloudflare Worker which serves them with proper KV-backed data.
 */
export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const workerBase = context.env.CORS_PROXY_URL
    || 'https://jad2fx-yahoo-proxy.hamzaelbouhali.workers.dev';

  const targets = ['/sitemap.xml', '/rss/briefing.xml', '/rss.xml', '/feed.xml', '/og-image'];
  const matched = targets.find((t) => url.pathname === t || url.pathname.startsWith(t + '?') || (t === '/og-image' && url.pathname.startsWith(t + '?')));

  if (matched) {
    const targetUrl = workerBase.replace(/\/$/, '') + url.pathname + url.search;
    try {
      const upstream = await fetch(targetUrl, {
        headers: { 'Accept': '*/*' },
      });
      const body = await upstream.arrayBuffer();
      return new Response(body, {
        status: upstream.status,
        headers: {
          'Content-Type': upstream.headers.get('Content-Type') || 'application/octet-stream',
          'Cache-Control': upstream.headers.get('Cache-Control') || 'public, max-age=600',
        },
      });
    } catch (err) {
      return new Response('Worker unavailable', { status: 502 });
    }
  }

  return context.next();
}
