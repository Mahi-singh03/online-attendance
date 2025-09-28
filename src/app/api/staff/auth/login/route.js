import dbConnect from '@/lib/DBconnection';
import Staff from '@/models/staff';
import { getClientIP, validateIP } from '@/lib/ipUtils';

export async function POST(req) {
  try {
    await dbConnect();

    const { email, password } = await req.json();
    
    if (!email || !password) {
      return new Response(JSON.stringify({ 
        success: false,
        message: 'Email and password are required' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Find staff by email
    const staff = await Staff.findOne({ email: email.toLowerCase() });
    if (!staff) {
      return new Response(JSON.stringify({ 
        success: false,
        message: 'Invalid email or password' 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verify password
    const isPasswordValid = await staff.matchPassword(password);
    if (!isPasswordValid) {
      return new Response(JSON.stringify({ 
        success: false,
        message: 'Invalid email or password' 
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const clientIP = getClientIP(req);
    
    // Check if staff has IP restrictions
    if (staff.allowedIps && staff.allowedIps.length > 0) {
      const isAllowed = validateIP(clientIP, staff.allowedIps);
      if (!isAllowed) {
        return new Response(JSON.stringify({ 
          success: false,
          message: 'Login not allowed from this network',
          clientIP 
        }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    // Return staff information (without password)
    return new Response(JSON.stringify({
      success: true,
      message: 'Login successful',
      staff: {
        id: staff._id,
        name: staff.name,
        email: staff.email,
        allowedIps: staff.allowedIps,
        createdAt: staff.createdAt
      },
      clientIP
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Staff authentication error:', error);
    return new Response(JSON.stringify({ 
      success: false,
      message: 'Internal server error',
      error: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
