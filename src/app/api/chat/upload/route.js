import { authMiddleware } from '@/lib/middleware/auth';
import { uploadToCloudinary } from '@/app/utils/cloudinaryUtils';

export async function POST(request) {
  try {
    const authResult = await authMiddleware(request);
    if (authResult.error) {
      return Response.json({ message: authResult.error }, { status: authResult.status });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    
    if (!file) {
      return Response.json({ message: 'No file provided' }, { status: 400 });
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return Response.json({ message: 'File size too large. Maximum 10MB allowed.' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      return Response.json({ message: 'File type not allowed' }, { status: 400 });
    }

    // Convert file to base64 for Cloudinary
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64File = `data:${file.type};base64,${buffer.toString('base64')}`;
    
    // Upload to Cloudinary
    const uploadResult = await uploadToCloudinary(base64File);
    
    return Response.json({
      success: true,
      data: {
        fileUrl: uploadResult.url,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      }
    });

  } catch (error) {
    console.error('File upload error:', error);
    return Response.json({ 
      success: false,
      message: 'File upload failed',
      error: error.message 
    }, { status: 500 });
  }
}




