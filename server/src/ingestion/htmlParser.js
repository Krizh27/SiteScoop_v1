import * as cheerio from 'cheerio';

export const parseHtml = (html, baseUrl) => {
  const $ = cheerio.load(html);
  return {
    title: $('title').text() || '',
    description: $('meta[name="description"]').attr('content') || '',
    lang: $('html').attr('lang') || '',
    viewport: $('meta[name="viewport"]').attr('content') || '',
    canonical: $('link[rel="canonical"]').attr('href') || ''
  };
};
