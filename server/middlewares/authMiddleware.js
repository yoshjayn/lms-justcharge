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

// Middleware to Protect Admin Routes
export const protectAdmin = async (req, res, next) => {
    try {
        const userId = req.auth.userId;
        
        const response = await clerkClient.users.getUser(userId);

        if (response.publicMetadata.role !== 'admin') {
            return res.json({ success: false, message: 'Admin Access Required' });
        }
        
        next();
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// Middleware ( Protect Educator Routes )
export const protectEducator = async (req,res,next) => {

    try {

        const userId = req.auth.userId
        
        const response = await clerkClient.users.getUser(userId)

        if (response.publicMetadata.role !== 'educator') {
            return res.json({success:false, message: 'Unauthorized Access'})
        }
        
        next ()

    } catch (error) {
        res.json({success:false, message: error.message})
    }

}