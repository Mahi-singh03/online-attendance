// API route for individual staff operations (GET, PUT, DELETE)
import dbConnect from '@/lib/DBconnection';
import Staff from '@/models/staff';

export async function GET(req, { params }) {
  await dbConnect();
  
  const { id } = params;

  if (!id) {
    return Response.json({ success: false, error: 'Staff ID is required' }, { status: 400 });
  }

  try {
    const staff = await Staff.findById(id).select('-password');
    if (!staff) {
      return Response.json({ 
        success: false, 
        error: 'Staff member not found' 
      }, { status: 404 });
    }
    return Response.json({ success: true, data: staff });
  } catch (error) {
    return Response.json({ success: false, error: 'Error fetching staff member' }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  await dbConnect();
  
  const { id } = params;

  if (!id) {
    return Response.json({ success: false, error: 'Staff ID is required' }, { status: 400 });
  }

  try {
    const { name, email, password, allowedIps } = await req.json();
    
    // Check if staff exists
    const existingStaff = await Staff.findById(id);
    if (!existingStaff) {
      return Response.json({ 
        success: false, 
        error: 'Staff member not found' 
      }, { status: 404 });
    }

    // Validate email format if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return Response.json({ 
          success: false, 
          error: 'Please provide a valid email address' 
        }, { status: 400 });
      }
    }

    // Validate password strength if provided
    if (password && password.length < 6) {
      return Response.json({ 
        success: false, 
        error: 'Password must be at least 6 characters long' 
      }, { status: 400 });
    }

    // Check if email is being changed and if it already exists
    if (email && email !== existingStaff.email) {
      const emailExists = await Staff.findOne({ email, _id: { $ne: id } });
      if (emailExists) {
        return Response.json({ 
          success: false, 
          error: 'Email already exists for another staff member' 
        }, { status: 400 });
      }
    }

    // Prepare update data
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (password) {
      // Password will be hashed by the pre-save hook in the model
      updateData.password = password;
    }
    if (allowedIps !== undefined) {
      if (allowedIps && allowedIps.trim() !== '') {
        const additionalIps = allowedIps.split(',').map(ip => ip.trim()).filter(ip => ip !== '');
        
        // Validate IP addresses
        const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^(?:(?:[0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|(?:[0-9a-fA-F]{1,4}:){1,7}:|(?:[0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|(?:[0-9a-fA-F]{1,4}:){1,5}(?::[0-9a-fA-F]{1,4}){1,2}|(?:[0-9a-fA-F]{1,4}:){1,4}(?::[0-9a-fA-F]{1,4}){1,3}|(?:[0-9a-fA-F]{1,4}:){1,3}(?::[0-9a-fA-F]{1,4}){1,4}|(?:[0-9a-fA-F]{1,4}:){1,2}(?::[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:(?::[0-9a-fA-F]{1,4}){1,6}|:(?::[0-9a-fA-F]{1,4}){1,7}|:)$/;
        
        const validIps = additionalIps.filter(ip => {
          // Allow CIDR notation and wildcards
          if (ip.includes('/') || ip.includes('*')) return true;
          return ipRegex.test(ip);
        });
        
        updateData.allowedIps = validIps;
      } else {
        updateData.allowedIps = [];
      }
    }

    const updatedStaff = await Staff.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true, runValidators: true }
    ).select('-password');

    return Response.json({ 
      success: true, 
      data: updatedStaff,
      message: 'Staff member updated successfully' 
    });
  } catch (error) {
    console.error('Error updating staff member:', error);
    return Response.json({ 
      success: false, 
      error: 'Error updating staff member',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  await dbConnect();
  
  const { id } = params;

  if (!id) {
    return Response.json({ success: false, error: 'Staff ID is required' }, { status: 400 });
  }

  try {
    const staff = await Staff.findById(id);
    if (!staff) {
      return Response.json({ 
        success: false, 
        error: 'Staff member not found' 
      }, { status: 404 });
    }

    await Staff.findByIdAndDelete(id);
    return Response.json({ 
      success: true, 
      message: 'Staff member deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting staff member:', error);
    return Response.json({ 
      success: false, 
      error: 'Error deleting staff member',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}
