// API route to get current network information
import { getClientIP } from '@/lib/ipUtils';

export async function GET(req) {
  try {
    const clientIP = getClientIP(req);
    
    return Response.json({
      success: true,
      data: {
        clientIP,
        timestamp: new Date().toISOString(),
        userAgent: req.headers.get('user-agent') || 'Unknown',
        forwardedFor: req.headers.get('x-forwarded-for') || null,
        realIP: req.headers.get('x-real-ip') || null,
        cfConnectingIP: req.headers.get('cf-connecting-ip') || null
      }
    });
  } catch (error) {
    console.error('Error getting network info:', error);
    return Response.json({ 
      success: false, 
      error: 'Error getting network information' 
    }, { status: 500 });
  }
}
