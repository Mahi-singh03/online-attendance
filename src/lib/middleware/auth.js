// lib/middleware/auth.js
import { verifyToken } from '../jwt.js';
import Admin from '@/models/admin';
import Staff from '@/models/staff';

export async function authMiddleware(req) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return { error: 'No token provided', status: 401 };
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return { error: 'Invalid token', status: 401 };
    }

    // Check if user exists in either Admin or Staff collection
    let user = await Admin.findById(decoded.id);
    let userType = 'Admin';
    
    if (!user) {
      user = await Staff.findById(decoded.id);
      userType = 'Staff';
    }
    
    if (!user) {
      return { error: 'User not found', status: 401 };
    }

    return { user: { id: user._id, type: userType, ...user.toObject() } };
  } catch (error) {
    return { error: 'Authentication failed', status: 401 };
  }
}

export async function adminAuthMiddleware(req) {
  const authResult = await authMiddleware(req);
  if (authResult.error) return authResult;

  if (authResult.user.type !== 'Admin') {
    return { error: 'Admin access required', status: 403 };
  }

  return authResult;
}

export async function staffAuthMiddleware(req) {
  const authResult = await authMiddleware(req);
  if (authResult.error) return authResult;

  if (authResult.user.type !== 'Staff') {
    return { error: 'Staff access required', status: 403 };
  }

  return authResult;
}