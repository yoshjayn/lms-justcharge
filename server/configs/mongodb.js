import mongoose from "mongoose";

// Connect to the MongoDB database
const connectDB = async () => {
    try {
        console.log('Attempting to connect to MongoDB...');
        console.log(`Connection URI: ${process.env.MONGODB_URI}/lms`);
        
        // Set up connection event listeners
        mongoose.connection.on('connected', () => console.log('Database Connected Successfully'));
        mongoose.connection.on('error', (err) => console.error('MongoDB connection error:', err));
        mongoose.connection.on('disconnected', () => console.log('MongoDB disconnected'));
        
        // Connect to MongoDB
        await mongoose.connect(`${process.env.MONGODB_URI}`);
        console.log('MongoDB connection initialized');
    } catch (error) {
        console.error('Failed to connect to MongoDB:', error);
        process.exit(1); // Exit with failure
    }
}

export default connectDB