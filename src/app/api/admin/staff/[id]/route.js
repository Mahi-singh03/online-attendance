// API route for individual staff operations (GET, PUT, DELETE)
import dbConnect from '@/lib/DBconnection';
import Staff from '@/models/staff';
import { uploadToCloudinary, deleteFromCloudinary } from '@/app/utils/cloudinaryUtils';

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
    const formData = await req.formData();
    
    const name = formData.get('name');
    const email = formData.get('email');
    const password = formData.get('password');
    const allowedIps = formData.get('allowedIps');
    const profilePhoto = formData.get('profilePhoto');
    const removePhoto = formData.get('removePhoto');
    
    // Check if staff exists
    const existingStaff = await Staff.findById(id);
    if (!existingStaff) {
      return Response.json({ 
        success: false, 
        error: 'Staff member not found' 
      }, { status: 404 });
    }

    // Validate email format if provided and changed
    if (email && email !== existingStaff.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return Response.json({ 
          success: false, 
          error: 'Please provide a valid email address' 
        }, { status: 400 });
      }
      
      // Check if email already exists for another staff member
      const emailExists = await Staff.findOne({ email, _id: { $ne: id } });
      if (emailExists) {
        return Response.json({ 
          success: false, 
          error: 'Email already exists for another staff member' 
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

    // Handle profile photo updates
    let profilePhotoData = existingStaff.profilePhoto;
    
    if (removePhoto === 'true' && existingStaff.profilePhoto?.public_id) {
      // Delete existing photo from Cloudinary
      await deleteFromCloudinary(existingStaff.profilePhoto.public_id);
      profilePhotoData = null;
    } else if (profilePhoto && profilePhoto instanceof File && profilePhoto.size > 0) {
      // Delete old photo if exists
      if (existingStaff.profilePhoto?.public_id) {
        await deleteFromCloudinary(existingStaff.profilePhoto.public_id);
      }
      
      // Upload new photo
      const bytes = await profilePhoto.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const base64Image = `data:${profilePhoto.type};base64,${buffer.toString('base64')}`;
      
      profilePhotoData = await uploadToCloudinary(base64Image);
    }

    // Prepare update data - only include fields that are actually being updated
    const updateData = {};
    
    if (name && name !== existingStaff.name) updateData.name = name;
    if (email && email !== existingStaff.email) updateData.email = email;
    if (password) updateData.password = password;
    
    // Handle allowed IPs - only update if provided
    if (allowedIps !== null) {
      if (allowedIps.trim() === '') {
        // If empty string provided, keep existing IPs (don't clear)
        // Do nothing - preserve existing IPs
      } else {
        // Parse and validate new IPs
        const newIps = allowedIps.split(',').map(ip => ip.trim()).filter(ip => ip !== '');
        
        const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^(?:(?:[0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|(?:[0-9a-fA-F]{1,4}:){1,7}:|(?:[0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|(?:[0-9a-fA-F]{1,4}:){1,5}(?::[0-9a-fA-F]{1,4}){1,2}|(?:[0-9a-fA-F]{1,4}:){1,4}(?::[0-9a-fA-F]{1,4}){1,3}|(?:[0-9a-fA-F]{1,4}:){1,3}(?::[0-9a-fA-F]{1,4}){1,4}|(?:[0-9a-fA-F]{1,4}:){1,2}(?::[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:(?::[0-9a-fA-F]{1,4}){1,6}|:(?::[0-9a-fA-F]{1,4}){1,7}|:)$/;

        const validIps = newIps.filter(ip => {
          if (ip.includes('/') || ip.includes('*')) return true; // Allow CIDR notation and wildcards
          return ipRegex.test(ip);
        });

        // Only update if the IPs are different from existing
        const existingIpsString = Array.isArray(existingStaff.allowedIps) ? existingStaff.allowedIps.join(', ') : '';
        const newIpsString = validIps.join(', ');
        
        if (existingIpsString !== newIpsString) {
          updateData.allowedIps = validIps;
        }
      }
    }

    // Only update profile photo if it actually changed
    if (profilePhotoData !== existingStaff.profilePhoto) {
      updateData.profilePhoto = profilePhotoData;
    }

    // Only proceed with update if there are actual changes
    if (Object.keys(updateData).length === 0) {
      return Response.json({ 
        success: true, 
        data: existingStaff,
        message: 'No changes detected' 
      });
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

    // Delete profile photo from Cloudinary if exists
    if (staff.profilePhoto?.public_id) {
      await deleteFromCloudinary(staff.profilePhoto.public_id);
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