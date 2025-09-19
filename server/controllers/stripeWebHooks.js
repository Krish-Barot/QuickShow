import stripe from 'stripe';
import Booking from '../models/Booking.js';

export const stripeWebHooks = async (req, res) => {
    console.log('Webhook received');
    console.log('Headers:', req.headers);
    
    const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);
    const sig = req.headers['stripe-signature'];
    
    if (!sig) {
        console.error('No Stripe signature found in headers');
        return res.status(400).send('No Stripe signature found');
    }

    let event;
    
    try {
        // Use the raw request body that Express.raw() provides
        event = stripeInstance.webhooks.constructEvent(
            req.body, // This should be the raw body buffer
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
        
        console.log(`Received event type: ${event.type}`);
        
    } catch (error) {
        console.error('Webhook signature verification failed:', error.message);
        return res.status(400).send(`Webhook Error: ${error.message}`);
    }

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object;
                const bookingId = session?.metadata?.bookingId;
                console.log('checkout.session.completed received, bookingId=', bookingId);
                
                if (bookingId) {
                    const updated = await Booking.findByIdAndUpdate(
                        bookingId,
                        { isPaid: true, paymentLink: '' },
                        { new: true }
                    );
                    console.log('Booking updated:', updated ? 'success' : 'failed');
                } else {
                    console.warn('No bookingId in session.metadata', session);
                }
                break;
            }

            case 'payment_intent.succeeded': {
                const paymentIntent = event.data.object;
                console.log('Processing payment_intent.succeeded for:', paymentIntent.id);
                
                try {
                    const sessionList = await stripeInstance.checkout.sessions.list({
                        payment_intent: paymentIntent.id,
                        limit: 1,
                    });

                    const session = sessionList?.data?.[0];
                    const bookingId = session?.metadata?.bookingId;
                    
                    console.log('payment_intent.succeeded, bookingId=', bookingId);
                    
                    if (bookingId) {
                        await Booking.findByIdAndUpdate(
                            bookingId, 
                            { isPaid: true, paymentLink: '' },
                            { new: true }
                        );
                        console.log(`Successfully updated booking ${bookingId}`);
                    } else {
                        console.warn('No bookingId found for payment_intent', paymentIntent.id);
                    }
                } catch (err) {
                    console.error('Error processing payment_intent.succeeded:', err);
                    // Don't return error response here as Stripe will retry
                }
                break;
            }

            default:
                console.log('Unhandled event type:', event.type);
        }

        // Return a 200 response to acknowledge receipt of the event
        res.json({ received: true });

    } catch (error) {
        console.error('Webhook processing error:', error);
        // Return a 200 response anyway to prevent Stripe from retrying
        res.status(200).json({ error: 'Webhook handler failed' });
    }
};