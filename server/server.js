import express from 'express';
import cors from 'cors';
import connectDB from './configs/db.js';
import { clerkMiddleware } from '@clerk/express';
import { serve } from "inngest/express";
import { inngest, functions } from "./inngest/index.js";
import showRouter from './routes/showRoutes.js';
import bookingRouter from './routes/bookingRoutes.js';
import adminRouter from './routes/adminRoutes.js';
import userRouter from './routes/userRoutes.js';
import { stripeWebHooks } from './controllers/stripeWebHooks.js';


const app = express();
const PORT = 3000;


// Database Connection
await connectDB();

// Middleware for parsing JSON (for all other routes)
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Stripe Webhooks Route - Must be before other middleware to get raw body
app.post(
    '/api/stripe', 
    express.raw({ 
        type: 'application/json',
        limit: '50mb'  // Adjust the limit as needed
    }), 
    stripeWebHooks
);
app.use(clerkMiddleware());


// API Routes
app.get('/', (req, res) => {
    res.send("Server is Live !!");
});

app.use('/api/inngest', serve({ client: inngest, functions }));

app.use('/api/show', showRouter);

app.use('/api/booking', bookingRouter);

app.use('/api/admin', adminRouter);

app.use('/api/users', userRouter);

app.listen(PORT, () => {
    console.log(`Server running at port ${PORT}`);
})