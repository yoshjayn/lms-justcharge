// Fix existing users script - run this once to clean up existing data
// Save this as scripts/fixExistingUsers.js

import mongoose from 'mongoose';
import User from '../models/User.js';
import 'dotenv/config';

const fixUsersWithNullNames = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI + '/lms');
        console.log('Connected to database');

        // Find all users
        const allUsers = await User.find({});
        console.log(`Found ${allUsers.length} total users`);

        let usersFixed = 0;
        let usersWithNullInName = [];

        for (const user of allUsers) {
            let needsUpdate = false;
            let newName = user.name;

            if (user.name) {
                // Check if name contains "null" (case insensitive)
                if (user.name.toLowerCase().includes('null')) {
                    usersWithNullInName.push({
                        id: user._id,
                        email: user.email,
                        originalName: user.name
                    });

                    // Clean up the name
                    newName = user.name
                        .replace(/\s+null\s*/gi, '') // Remove " null " or " null"
                        .replace(/null\s+/gi, '')    // Remove "null "
                        .replace(/\s+null$/gi, '')   // Remove " null" at end
                        .replace(/^null\s+/gi, '')   // Remove "null " at start
                        .replace(/^null$/gi, '')     // Remove standalone "null"
                        .trim();

                    // If name becomes empty after cleaning, unset it
                    if (!newName || newName === '') {
                        newName = undefined;
                    }

                    needsUpdate = true;
                }

                // Check for other patterns like "undefined" or multiple spaces
                if (user.name.includes('undefined') || /\s{2,}/.test(user.name)) {
                    newName = user.name
                        .replace(/undefined/gi, '')
                        .replace(/\s{2,}/g, ' ')  // Replace multiple spaces with single space
                        .trim();

                    if (!newName || newName === '') {
                        newName = undefined;
                    }

                    needsUpdate = true;
                }
            }

            if (needsUpdate) {
                try {
                    if (newName === undefined) {
                        // Remove the name field entirely
                        await User.findByIdAndUpdate(user._id, { $unset: { name: "" } });
                        console.log(`✅ Removed name field for user ${user.email} (was: "${user.name}")`);
                    } else {
                        // Update with cleaned name
                        await User.findByIdAndUpdate(user._id, { name: newName });
                        console.log(`✅ Fixed user ${user.email}: "${user.name}" → "${newName}"`);
                    }
                    usersFixed++;
                } catch (error) {
                    console.error(`❌ Failed to update user ${user.email}:`, error);
                }
            }
        }

        console.log('\n📊 Cleanup Summary:');
        console.log(`Total users: ${allUsers.length}`);
        console.log(`Users with "null" in name: ${usersWithNullInName.length}`);
        console.log(`Users fixed: ${usersFixed}`);
        
        if (usersWithNullInName.length > 0) {
            console.log('\n👥 Users that had "null" in their names:');
            usersWithNullInName.forEach(user => {
                console.log(`- ${user.email}: "${user.originalName}"`);
            });
        }

        if (usersFixed === 0) {
            console.log('✅ All user names are clean!');
        }

    } catch (error) {
        console.error('❌ Cleanup failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from database');
    }
};

// Alternative function to just find users with problematic names
const findUsersWithProblematicNames = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI + '/lms');
        
        const problematicUsers = await User.find({
            $or: [
                { name: /null/i },
                { name: /undefined/i },
                { name: /^\s*$/ }, // Empty or only whitespace
                { name: /\s{2,}/ }  // Multiple consecutive spaces
            ]
        });
        
        console.log(`Found ${problematicUsers.length} users with problematic names:`);
        problematicUsers.forEach(user => {
            console.log(`- ${user.email}: "${user.name}"`);
        });
        
        await mongoose.disconnect();
        return problematicUsers;
    } catch (error) {
        console.error('Search failed:', error);
        await mongoose.disconnect();
    }
};

// Run the cleanup
fixUsersWithNullNames();

// Export for use in other scripts
export { fixUsersWithNullNames, findUsersWithProblematicNames };