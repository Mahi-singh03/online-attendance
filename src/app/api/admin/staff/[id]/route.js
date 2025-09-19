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
    if (password) updateData.password = password;
    if (allowedIps !== undefined) {
      if (allowedIps && allowedIps.trim() !== '') {
        updateData.allowedIps = allowedIps.split(',').map(ip => ip.trim()).filter(ip => ip !== '');
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
    return Response.json({ 
      success: false, 
      error: 'Error updating staff member' 
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
    return Response.json({ 
      success: false, 
      error: 'Error deleting staff member' 
    }, { status: 500 });
  }
}
