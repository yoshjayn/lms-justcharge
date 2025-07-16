import { clerkClient } from "@clerk/express"

// Middleware to Protect User Routes (Basic Authentication)
export const protectUser = async (req, res, next) => {
    try {
        const userId = req.auth.userId;
        
        if (!userId) {
            return res.json({ success: false, message: 'Unauthorized Access' });
        }
        
        next();
    } catch (error) {
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