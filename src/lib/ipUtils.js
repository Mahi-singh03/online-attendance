// IP detection and validation utilities,hjg
export function getClientIP(req) {
  // Check for various headers that might contain the real IP
  const forwarded = req.headers.get('x-forwarded-for');
  const realIP = req.headers.get('x-real-ip');
  const cfConnectingIP = req.headers.get('cf-connecting-ip');
  const xClientIP = req.headers.get('x-client-ip');
  
  // Get IP from connection if headers are not available (for Pages Router compatibility)
  const connectionIP = req.connection?.remoteAddress || 
                      req.socket?.remoteAddress || 
                      req.ip;

  // Parse x-forwarded-for header (can contain multiple IPs)
  if (forwarded) {
    const ips = forwarded.split(',').map(ip => ip.trim());
    return ips[0]; // Return the first IP (original client)
  }

  // Return the first available IP
  return realIP || cfConnectingIP || xClientIP || connectionIP || '127.0.0.1';
}

export function validateIP(clientIP, allowedIPs) {
  if (!allowedIPs || allowedIPs.length === 0) {
    return true; // No IP restrictions
  }

  // Check if client IP matches any allowed IP
  return allowedIPs.some(allowedIP => {
    // Handle CIDR notation (e.g., 192.168.1.0/24)
    if (allowedIP.includes('/')) {
      return isIPInCIDR(clientIP, allowedIP);
    }
    
    // Handle wildcard notation (e.g., 192.168.1.*)
    if (allowedIP.includes('*')) {
      const pattern = allowedIP.replace(/\*/g, '\\d+');
      const regex = new RegExp(`^${pattern}$`);
      return regex.test(clientIP);
    }
    
    // Exact match
    return clientIP === allowedIP;
  });
}

function isIPInCIDR(ip, cidr) {
  try {
    const [network, prefixLength] = cidr.split('/');
    const prefix = parseInt(prefixLength, 10);
    
    // Convert IPs to integers
    const ipInt = ipToInt(ip);
    const networkInt = ipToInt(network);
    
    // Calculate subnet mask
    const mask = (0xffffffff << (32 - prefix)) >>> 0;
    
    // Check if IP is in the subnet
    return (ipInt & mask) === (networkInt & mask);
  } catch (error) {
    console.error('Error checking CIDR:', error);
    return false;
  }
}

function ipToInt(ip) {
  return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
}

export function getCurrentNetworkInfo() {
  // This would typically be called from the frontend to get current network info
  return {
    timestamp: new Date().toISOString(),
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Server',
    // Note: Real IP detection should be done server-side
  };
}
