// API route for staff CRUD operations
import dbConnect from '@/lib/DBconnection';
import Staff from '@/models/staff';

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

    // Process allowed IPs
    let processedIps = [];
    if (allowedIps && allowedIps.trim() !== '') {
      processedIps = allowedIps.split(',').map(ip => ip.trim()).filter(ip => ip !== '');
    }

    const staff = new Staff({
      name,
      email,
      password,
      allowedIps: processedIps
    });

    await staff.save();
    
    // Return staff without password
    const { password: _, ...staffWithoutPassword } = staff.toObject();
    return Response.json({ 
      success: true, 
      data: staffWithoutPassword,
      message: 'Staff member created successfully' 
    }, { status: 201 });
  } catch (error) {
    return Response.json({ 
      success: false, 
      error: 'Error creating staff member' 
    }, { status: 500 });
  }
}
