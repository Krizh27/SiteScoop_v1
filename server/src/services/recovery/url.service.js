import net from 'net';

export const isAllowedUrl = (urlString) => {
  try {
    const url = new URL(urlString);
    
    // Protocol check
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return false;
    }

    // SSRF checks
    const hostname = url.hostname;
    
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0') {
      return false;
    }

    if (hostname.endsWith('.local') || hostname.endsWith('.internal')) {
      return false;
    }

    // Check if it's an IP address and if it's private
    if (net.isIPv4(hostname)) {
      const parts = hostname.split('.');
      if (
        parts[0] === '10' || 
        (parts[0] === '172' && parseInt(parts[1], 10) >= 16 && parseInt(parts[1], 10) <= 31) ||
        (parts[0] === '192' && parts[1] === '168') ||
        (parts[0] === '169' && parts[1] === '254') // Link-local
      ) {
        return false;
      }
    }
    
    if (net.isIPv6(hostname)) {
      // Basic IPv6 private blocks check
      if (hostname.startsWith('fc00:') || hostname.startsWith('fd00:') || hostname.startsWith('fe80:')) {
        return false;
      }
      if (hostname === '::1' || hostname === '0:0:0:0:0:0:0:1') {
        return false;
      }
    }

    return true;
  } catch (error) {
    return false;
  }
};

export const resolveUrl = (baseUrl, href) => {
  try {
    if (!href || href.startsWith('data:')) return null;
    return new URL(href, baseUrl).href;
  } catch (err) {
    return null;
  }
};

export const sanitizeFilename = (name) => {
  if (!name) return 'asset';
  return name.replace(/[^a-zA-Z0-9.\-_]/g, '_').substring(0, 100);
};
