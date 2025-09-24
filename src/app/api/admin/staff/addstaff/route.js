// API route for staff operations (GET, POST)
import dbConnect from '@/lib/DBconnection';
import Staff from '@/models/staff';
import { getClientIP } from '@/lib/ipUtils';

export async function GET() {
  await dbConnect();
  
  try {
    const staff = await Staff.find({}).select('-password');
    return Response.json({ success: true, data: staff });
  } catch (error) {
    return Response.json({ success: false, error: 'Error fetching staff' }, { status: 500 });
  }
}

export async function POST(req) {
  await dbConnect();
  
  try {
    const { name, email, password, allowedIps } = await req.json();
    
    // Validate required fields
    if (!name || !email || !password) {
      return Response.json({ 
        success: false, 
        error: 'Name, email, and password are required' 
      }, { status: 400 });
    }
    
    // Check if staff already exists
    const existingStaff = await Staff.findOne({ email });
    if (existingStaff) {
      return Response.json({ 
        success: false, 
        error: 'Staff member with this email already exists' 
      }, { status: 400 });
    }

    // Get the IP address of the network used to create the staff
    const creatorIP = getClientIP(req);
    
    // Process allowed IPs - include creator's IP automatically
    let processedIps = [];
    
    // Add creator's IP first
    if (creatorIP) {
      processedIps.push(creatorIP);
    }
    
    // Add any additional IPs provided by the admin
    if (allowedIps && allowedIps.trim() !== '') {
      const additionalIps = allowedIps.split(',').map(ip => ip.trim()).filter(ip => ip !== '');
      // Avoid duplicates
      additionalIps.forEach(ip => {
        if (!processedIps.includes(ip)) {
          processedIps.push(ip);
        }
      });
    }

    const staff = new Staff({
      name,
      email,
      password,
      allowedIps: processedIps,
      createdFromIP: creatorIP // Store for reference
    });

    await staff.save();
    
    // Return staff without password
    const { password: _, ...staffWithoutPassword } = staff.toObject();
    return Response.json({ 
      success: true, 
      data: staffWithoutPassword,
      message: `Staff member created successfully. Office network IP (${creatorIP}) has been added to allowed IPs.`
    }, { status: 201 });
  } catch (error) {
    return Response.json({ 
      success: false, 
      error: 'Error creating staff member' 
    }, { status: 500 });
  }
}