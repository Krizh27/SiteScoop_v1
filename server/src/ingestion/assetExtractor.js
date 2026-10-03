import * as cheerio from 'cheerio';

export const extractAssets = (html, baseUrl) => {
  const $ = cheerio.load(html);
  const assets = [];
  
  const addAsset = (url, type) => {
    if (!url) return;
    try {
      const trimmedUrl = url.trim();
      if (trimmedUrl.startsWith('data:')) return;
      if (trimmedUrl.startsWith('blob:')) return;
      if (trimmedUrl.startsWith('javascript:')) return;
      if (trimmedUrl.startsWith('#')) return;

      const absoluteUrl = new URL(trimmedUrl, baseUrl).href;
      
      const parsed = new URL(absoluteUrl);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return;

      if (!assets.find(a => a.url === absoluteUrl)) {
        assets.push({ url: absoluteUrl, type });
      }
    } catch (e) {
      // Ignore malformed URLs
    }
  };

  $('link[rel="stylesheet"]').each((_, el) => addAsset($(el).attr('href'), 'stylesheet'));
  $('script[src]').each((_, el) => addAsset($(el).attr('src'), 'script'));
  $('img[src]').each((_, el) => addAsset($(el).attr('src'), 'image'));
  $('link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]').each((_, el) => addAsset($(el).attr('href'), 'image'));
  $('link[href$=".woff"], link[href$=".woff2"], link[href$=".ttf"]').each((_, el) => addAsset($(el).attr('href'), 'font'));

  return assets;
};
