import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    name: { type: String, required: false, default: undefined },
    email: { type: String, required: true },
    imageUrl: { type: String, required: true },
    enrolledCourses: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Course'
        }
    ],
}, { timestamps: true ,
    // Don't save undefined fields to the database
    minimize: false,
    transform: function(doc, ret) {
        // Remove undefined values when converting to JSON
        Object.keys(ret).forEach(key => {
            if (ret[key] === undefined) {
                delete ret[key];
            }
        });
        return ret;
    }
});

// Pre-save middleware to clean up undefined values
userSchema.pre('save', function(next) {
    // Remove undefined fields before saving
    Object.keys(this.toObject()).forEach(key => {
        if (this[key] === undefined) {
            this.unset(key);
        }
    });
    next();
});

// Pre-update middleware to clean up undefined values
userSchema.pre(['findOneAndUpdate', 'updateOne', 'updateMany'], function(next) {
    const update = this.getUpdate();
    
    // Remove undefined fields from update operations
    if (update.$set) {
        Object.keys(update.$set).forEach(key => {
            if (update.$set[key] === undefined) {
                delete update.$set[key];
            }
        });
        
        // If $set is empty after cleaning, remove it
        if (Object.keys(update.$set).length === 0) {
            delete update.$set;
        }
    }
    
    next();
});

const User = mongoose.model("User", userSchema);

export default User;


