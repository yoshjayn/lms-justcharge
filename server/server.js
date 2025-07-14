import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import connectDB from './configs/mongodb.js'
import connectCloudinary from './configs/cloudinary.js'
import userRouter from './routes/userRoutes.js'
import { clerkMiddleware } from '@clerk/express'
import { clerkWebhooks, stripeWebhooks } from './controllers/webhooks.js'
import educatorRouter from './routes/educatorRoutes.js'
import courseRouter from './routes/courseRoute.js'

import adminRoutes from './routes/adminRoutes.js';


// Initialize Express
const app = express()

// Connect to database
await connectDB()
await connectCloudinary()

// Middlewares
app.use(cors())
app.use(clerkMiddleware())

app.use(express.json()) // Move this here as global middleware

// Routes
app.use('/api/admin', adminRoutes);
app.get('/', (req, res) => res.send("API Working"))
app.post('/clerk', clerkWebhooks)  // Remove duplicate express.json()
app.post('/stripe', express.raw({ type: 'application/json' }), stripeWebhooks)
app.use('/api/educator', educatorRouter)  // Remove duplicate express.json()
app.use('/api/course', courseRouter)      // Remove duplicate express.json()
app.use('/api/user', userRouter)          // Remove duplicate express.json()

// Port
const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
})