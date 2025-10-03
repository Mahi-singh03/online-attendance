// API route for staff CRUD operations
import dbConnect from '@/lib/DBconnection';
import Staff from '@/models/staff';
import { getClientIP } from '@/lib/ipUtils';
import { uploadToCloudinary } from '@/app/utils/cloudinaryUtils';

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
    const formData = await req.formData();
    
    const name = formData.get('name');
    const email = formData.get('email');
    const password = formData.get('password');
    const allowedIps = formData.get('allowedIps');
    const profilePhoto = formData.get('profilePhoto');
    
    // Validate required fields
    if (!name || !email || !password) {
      return Response.json({ 
        success: false, 
        error: 'Name, email, and password are required' 
      }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return Response.json({ 
        success: false, 
        error: 'Please provide a valid email address' 
      }, { status: 400 });
    }

    // Validate password strength
    if (password.length < 6) {
      return Response.json({ 
        success: false, 
        error: 'Password must be at least 6 characters long' 
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
      
      // Validate IP addresses
      const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^(?:(?:[0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|(?:[0-9a-fA-F]{1,4}:){1,7}:|(?:[0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|(?:[0-9a-fA-F]{1,4}:){1,5}(?::[0-9a-fA-F]{1,4}){1,2}|(?:[0-9a-fA-F]{1,4}:){1,4}(?::[0-9a-fA-F]{1,4}){1,3}|(?:[0-9a-fA-F]{1,4}:){1,3}(?::[0-9a-fA-F]{1,4}){1,4}|(?:[0-9a-fA-F]{1,4}:){1,2}(?::[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:(?::[0-9a-fA-F]{1,4}){1,6}|:(?::[0-9a-fA-F]{1,4}){1,7}|:)$/;
      
      const validIps = additionalIps.filter(ip => {
        // Allow CIDR notation and wildcards
        if (ip.includes('/') || ip.includes('*')) return true;
        return ipRegex.test(ip);
      });
      
      // Avoid duplicates
      validIps.forEach(ip => {
        if (!processedIps.includes(ip)) {
          processedIps.push(ip);
        }
      });
    }

    // Handle profile photo upload
    let profilePhotoData = null;
    if (profilePhoto && profilePhoto instanceof File) {
      // Convert file to base64 for Cloudinary
      const bytes = await profilePhoto.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const base64Image = `data:${profilePhoto.type};base64,${buffer.toString('base64')}`;
      
      profilePhotoData = await uploadToCloudinary(base64Image);
    }

    const staffData = {
      name,
      email,
      password,
      allowedIps: processedIps,
      createdFromIP: creatorIP
    };

    // Add profile photo data if available
    if (profilePhotoData) {
      staffData.profilePhoto = profilePhotoData;
    }

    const staff = new Staff(staffData);
    await staff.save();
    
    // Return staff without password
    const { password: _, ...staffWithoutPassword } = staff.toObject();
    return Response.json({ 
      success: true, 
      data: staffWithoutPassword,
      message: `Staff member created successfully. Office network IP (${creatorIP}) has been added to allowed IPs.`
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating staff member:', error);
    return Response.json({ 
      success: false, 
      error: 'Error creating staff member',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}