import Staff from '@/models/staff';
import connectDB from '@/lib/DBconnection';
import { getClientIP } from '@/lib/ipUtils';

export async function POST(req) {
  try {
    await connectDB();
    const { email, password } = await req.json();

    console.log('Staff login attempt for email:', email);

    // Find staff by email
    const staff = await Staff.findOne({ email });

    if (!staff) {
      console.log('Staff not found for email:', email);
      return Response.json({ 
        success: false, 
        error: 'Invalid email or password' 
      }, { status: 401 });
    }

    console.log('Staff found:', staff.name, staff.email);

    // Check password
    const isPasswordValid = await staff.matchPassword(password);
    console.log('Password validation result:', isPasswordValid);
    if (!isPasswordValid) {
      console.log('Invalid password for staff:', staff.email);
      return Response.json({ 
        success: false, 
        error: 'Invalid email or password' 
      }, { status: 401 });
    }

    // Get client IP and network info
    const clientIP = getClientIP(req);
    const networkInfo = {
      clientIP,
      loginTime: new Date().toISOString(),
      userAgent: req.headers.get('user-agent') || 'Unknown',
      forwardedFor: req.headers.get('x-forwarded-for') || null,
      realIP: req.headers.get('x-real-ip') || null,
      cfConnectingIP: req.headers.get('cf-connecting-ip') || null
    };

    // Check if IP is allowed (if allowedIps is configured)
    if (staff.allowedIps && staff.allowedIps.length > 0) {
      const isIPAllowed = staff.allowedIps.includes(clientIP);
      if (!isIPAllowed) {
        return Response.json({ 
          success: false, 
          error: 'Access denied from this IP address' 
        }, { status: 403 });
      }
    }

    // Return staff info without password
    const { password: _, ...staffWithoutPassword } = staff.toObject();

    return Response.json({
      success: true,
      staff: staffWithoutPassword,
      networkInfo
    });

  } catch (error) {
    console.error('Staff login error:', error);
    return Response.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
