import { URL } from 'url';
import dns from 'dns/promises';
import ipaddr from 'ipaddr.js';

/**
 * Known cloud metadata hostnames and IPs that must be blocked unconditionally.
 */
const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'localhost.localdomain',
  'metadata.google.internal',
  'metadata.internal',
  'instance-data',
  '169.254.169.254'
]);

/**
 * Check if an IP address string is private, loopback, link-local, or otherwise reserved.
 * @param {string} ip - IPv4 or IPv6 string
 * @returns {boolean} - true if IP is private/blocked, false if public
 */
export function isPrivateOrBlockedIp(ip) {
  try {
    if (!ipaddr.isValid(ip)) {
      return true; // Malformed IP is treated as unsafe
    }

    let parsed = ipaddr.parse(ip);

    // Convert IPv4-mapped IPv6 address (::ffff:192.168.1.1) to pure IPv4
    if (parsed.kind() === 'ipv6' && parsed.isIPv4MappedAddress()) {
      parsed = parsed.toIPv4Address();
    }

    const range = parsed.range();

    // Blocked IPv4 ranges
    const blockedIpv4Ranges = [
      'unspecified',         // 0.0.0.0/8
      'broadcast',           // 255.255.255.255/32
      'linkLocal',           // 169.254.0.0/16
      'loopback',            // 127.0.0.0/8
      'private',             // 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16
      'reserved',            // 240.0.0.0/4
      'carrierGradeNat'      // 100.64.0.0/10
    ];

    // Blocked IPv6 ranges
    const blockedIpv6Ranges = [
      'unspecified',         // ::/128
      'linkLocal',           // fe80::/10
      'multicast',           // ff00::/8
      'loopback',            // ::1/128
      'uniqueLocal',         // fc00::/7
      'ipv4Mapped',
      'rfc6145',
      'rfc6052',
      '6to4',
      'teredo',
      'reserved'
    ];

    if (parsed.kind() === 'ipv4' && blockedIpv4Ranges.includes(range)) {
      return true;
    }

    if (parsed.kind() === 'ipv6' && blockedIpv6Ranges.includes(range)) {
      return true;
    }

    // Explicit check for cloud metadata IP: 169.254.169.254
    if (ip === '169.254.169.254') {
      return true;
    }

    return false;
  } catch {
    return true;
  }
}

/**
 * Validate syntax and security constraints of a target URL.
 * Resolves DNS and ensures that all resolved IP addresses are public.
 *
 * @param {string} inputUrl - The URL to validate
 * @returns {Promise<{ valid: boolean, parsedUrl: URL, resolvedIps: string[] }>}
 * @throws {Error} if URL is invalid, uses prohibited protocols, or points to private/loopback/cloud metadata IPs
 */
export async function validateUrl(inputUrl) {
  if (!inputUrl || typeof inputUrl !== 'string') {
    throw new Error('A valid URL string is required');
  }

  const trimmed = inputUrl.trim();

  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error(`Malformed URL: "${trimmed}"`);
  }

  // Enforce HTTP / HTTPS protocols only
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error(`Invalid protocol "${parsed.protocol}". Only "http:" and "https:" are allowed.`);
  }

  // Reject embedded credentials (e.g. http://user:pass@host)
  if (parsed.username || parsed.password) {
    throw new Error('URLs with embedded credentials (username/password) are prohibited for security.');
  }

  // Extract hostname and lowercase it
  const hostname = parsed.hostname.toLowerCase();

  if (!hostname || hostname.length === 0) {
    throw new Error('URL hostname cannot be empty.');
  }

  // Block localhost, .local, .internal, cloud metadata hostnames
  if (
    BLOCKED_HOSTNAMES.has(hostname) ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal')
  ) {
    throw new Error(`Access to private or internal host "${hostname}" is blocked.`);
  }

  // If hostname is directly an IP literal (e.g. 127.0.0.1 or [::1])
  if (ipaddr.isValid(hostname)) {
    if (isPrivateOrBlockedIp(hostname)) {
      throw new Error(`Access to private, loopback, or reserved IP "${hostname}" is blocked.`);
    }
    return {
      valid: true,
      parsedUrl: parsed,
      resolvedIps: [hostname]
    };
  }

  // Resolve DNS to verify all corresponding IP addresses
  let resolvedAddresses = [];
  try {
    resolvedAddresses = await dns.lookup(hostname, { all: true });
  } catch (dnsErr) {
    throw new Error(`Failed to resolve DNS for host "${hostname}": ${dnsErr.message}`);
  }

  if (!resolvedAddresses || resolvedAddresses.length === 0) {
    throw new Error(`No IP addresses found for host "${hostname}".`);
  }

  const resolvedIps = resolvedAddresses.map(addr => addr.address);

  // Verify EVERY resolved IP address against blocked ranges (prevent DNS rebinding & SSRF)
  for (const ip of resolvedIps) {
    if (isPrivateOrBlockedIp(ip)) {
      throw new Error(`Host "${hostname}" resolved to blocked/private IP address "${ip}". Access denied.`);
    }
  }

  return {
    valid: true,
    parsedUrl: parsed,
    resolvedIps
  };
}
