import cloudinary from '@/lib/cloudinary';

export const uploadToCloudinary = async (file) => {
  try {
    // Convert base64 to buffer if needed, or handle file upload
    const uploadResponse = await cloudinary.uploader.upload(file, {
      folder: 'staff-profiles',
      resource_type: 'image',
      transformation: [
        { width: 500, height: 500, crop: 'limit', quality: 'auto' }
      ]
    });
    
    return {
      public_id: uploadResponse.public_id,
      url: uploadResponse.secure_url
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload image');
  }
};

export const deleteFromCloudinary = async (publicId) => {
  try {
    if (publicId) {
      await cloudinary.uploader.destroy(publicId);
    }
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw new Error('Failed to delete image');
  }
};