import { ingestSite } from '../ingestion/siteIngestor.js';

export const ingest = async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ success: false, error: 'URL is required.' });
    }
    
    const result = await ingestSite(url);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error(`[INGESTION] Error: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
};
