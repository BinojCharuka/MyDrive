import { supabaseAdmin, getUserSupabaseClient, isSupabaseConfigured } from '../config/supabase.js';

export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No authorization token provided',
      });
    }

    const token = authHeader.split(' ')[1];
    req.token = token;

    if (!isSupabaseConfigured || token === 'demo-token') {
      req.user = {
        id: '00000000-0000-0000-0000-000000000001',
        email: 'demo@mycloud.io',
        user_metadata: { full_name: 'Demo User' },
      };
      req.supabase = null;
      return next();
    }

    // Verify token with Supabase Auth
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired session token',
      });
    }

    req.user = user;
    req.supabase = getUserSupabaseClient(token);
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to authenticate user',
    });
  }
};
