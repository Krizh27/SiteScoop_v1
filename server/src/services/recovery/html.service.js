import * as cheerio from 'cheerio';
import { resolveUrl } from './url.service.js';

export const parseHtml = (htmlContent, baseUrl) => {
  const $ = cheerio.load(htmlContent);
  const resources = [];

  // Find stylesheets
  $('link[rel="stylesheet"]').each((_, el) => {
    const href = $(el).attr('href');
    const resolved = resolveUrl(baseUrl, href);
    if (resolved) {
      resources.push({ type: 'css', original: href, resolved, element: el, attr: 'href' });
    }
  });

  // Find scripts
  $('script[src]').each((_, el) => {
    const src = $(el).attr('src');
    const resolved = resolveUrl(baseUrl, src);
    if (resolved) {
      resources.push({ type: 'javascript', original: src, resolved, element: el, attr: 'src' });
    }
  });

  // Find images
  $('img[src]').each((_, el) => {
    const src = $(el).attr('src');
    const resolved = resolveUrl(baseUrl, src);
    if (resolved) {
      resources.push({ type: 'image', original: src, resolved, element: el, attr: 'src' });
    }
  });

  // Other assets like fonts could be linked or in styles, but we handle link icons here
  $('link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]').each((_, el) => {
    const href = $(el).attr('href');
    const resolved = resolveUrl(baseUrl, href);
    if (resolved) {
      resources.push({ type: 'image', original: href, resolved, element: el, attr: 'href' });
    }
  });

  const getUpdatedHtml = () => $.html();

  const updateReference = (element, attr, newPath) => {
    $(element).attr(attr, newPath);
  };

  return { resources, getUpdatedHtml, updateReference };
};
