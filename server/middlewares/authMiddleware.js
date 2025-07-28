

import { clerkClient } from "@clerk/express"

// Middleware to Protect User Routes (Basic Authentication) - DEBUG VERSION
export const protectUser = async (req, res, next) => {
    try {
        console.log('🔍 Debug - Auth headers:', req.headers.authorization);
        console.log('🔍 Debug - Full req.auth object:', req.auth);
        console.log('🔍 Debug - req.auth.userId:', req.auth?.userId);
        
        const userId = req.auth?.userId;
        
        if (!userId) {
            console.log('❌ No userId found in req.auth');
            console.log('🔍 Available properties in req.auth:', Object.keys(req.auth || {}));
            
            return res.json({ 
                success: false, 
                message: 'Unauthorized Access',
                debug: {
                    hasAuth: !!req.auth,
                    authKeys: Object.keys(req.auth || {}),
                    authObject: req.auth
                }
            });
        }
        
        console.log('✅ UserId found:', userId);
        next();
    } catch (error) {
        console.log('❌ Error in protectUser:', error);
        res.json({ success: false, message: error.message });
    }
};

// Middleware to Protect Educator Routes (Educators are now the admin)
export const protectEducator = async (req, res, next) => {
    try {
        const userId = req.auth.userId;
        
        const response = await clerkClient.users.getUser(userId);

        if (response.publicMetadata.role !== 'educator') {
            return res.json({ success: false, message: 'Educator Access Required' });
        }
        
        next();

    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};