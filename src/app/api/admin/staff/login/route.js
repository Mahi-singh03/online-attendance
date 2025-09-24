import dbConnect from '@/lib/DBconnection';
import Staff from '@/models/staff';
import { getClientIP, validateIP } from '@/lib/ipUtils';

export async function POST(req) {
  try {
    await dbConnect();

    const { email, password } = await req.json();
    if (!email || !password) {
      return new Response(JSON.stringify({ message: 'Email and password are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const staff = await Staff.findOne({ email });
    if (!staff) {
      return new Response(JSON.stringify({ message: 'Invalid email or password' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const passwordMatches = await staff.matchPassword(password);
    if (!passwordMatches) {
      return new Response(JSON.stringify({ message: 'Invalid email or password' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const clientIP = getClientIP(req);
    const isAllowed = validateIP(clientIP, staff.allowedIps);
    if (!isAllowed) {
      return new Response(
        JSON.stringify({ message: 'Login not allowed from this network', clientIP }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // If you need JWT for staff, generate here similarly to admin.
    // For now, return basic info.
    return new Response(
      JSON.stringify({ id: staff._id, name: staff.name, email: staff.email }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(JSON.stringify({ message: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}


