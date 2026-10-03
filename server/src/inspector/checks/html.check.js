import fs from 'fs/promises';
import path from 'path';
import * as cheerio from 'cheerio';

/**
 * Deterministic check on index.html and other HTML markup.
 */
export async function runHtmlCheck(projectDir) {
  const htmlPath = path.join(projectDir, 'index.html');
  const results = {
    category: 'html',
    hasHtml: false,
    missingTitle: false,
    missingViewport: false,
    missingLocalReferences: [],
    duplicateIds: []
  };

  try {
    const content = await fs.readFile(htmlPath, 'utf-8');
    results.hasHtml = true;

    const $ = cheerio.load(content);

    // 1. Title check
    const titleText = $('title').text().trim();
    if (!titleText) {
      results.missingTitle = true;
    }

    // 2. Viewport check
    const viewport = $('meta[name="viewport"]').attr('content');
    if (!viewport) {
      results.missingViewport = true;
    }

    // 3. Duplicate IDs check
    const idCounts = {};
    $('[id]').each((_, el) => {
      const id = $(el).attr('id');
      if (id) {
        idCounts[id] = (idCounts[id] || 0) + 1;
      }
    });
    for (const [id, count] of Object.entries(idCounts)) {
      if (count > 1) {
        results.duplicateIds.push({ id, count });
      }
    }

    // 4. Verify local referenced resources
    const localRefs = [];

    // Script tags
    $('script[src]').each((_, el) => {
      const src = $(el).attr('src');
      if (src && !isExternalUrl(src)) localRefs.push(src);
    });

    // Stylesheet links
    $('link[rel="stylesheet"][href]').each((_, el) => {
      const href = $(el).attr('href');
      if (href && !isExternalUrl(href)) localRefs.push(href);
    });

    // Check presence on disk
    for (const ref of localRefs) {
      // Clean path query or hash
      const cleanRef = ref.split('?')[0].split('#')[0];
      const normalizedRelative = cleanRef.startsWith('/') ? cleanRef.slice(1) : cleanRef;
      const targetDiskPath = path.join(projectDir, normalizedRelative);

      try {
        await fs.access(targetDiskPath);
      } catch {
        results.missingLocalReferences.push({
          sourceTag: ref,
          normalizedPath: normalizedRelative
        });
      }
    }

    return results;
  } catch {
    return results;
  }
}

function isExternalUrl(url) {
  return /^(https?:|\/\/|data:|blob:)/i.test(url);
}
