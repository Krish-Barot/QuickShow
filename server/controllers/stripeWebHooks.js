import stripe from 'stripe';
import Booking from '../models/Booking.js';
import { inngest } from '../inngest/index.js';

export const stripeWebHooks = async (req, res) => {
    
    const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);
    const sig = req.headers['stripe-signature'];
    
    if (!sig) {
        console.error('No Stripe signature found in headers');
        return res.status(400).send('No Stripe signature found');
    }

    let event;
    const secretsEnv = process.env.STRIPE_WEBHOOK_SECRET || '';

    event = stripeInstance.webhooks.constructEvent(
                req.body,
                sig,
                secretsEnv
            )

    if (!event) {
        console.error('Webhook signature verification failed for all provided secrets.');
        return res.status(400).send('Webhook Error: signature verification failed');
    }

    try {
        switch (event.type) {

            case 'payment_intent.succeeded': {
                const paymentIntent = event.data.object;
                
                try {
                    const sessionList = await stripeInstance.checkout.sessions.list({
                        payment_intent: paymentIntent.id,
                        limit: 1,
                    });

                    const session = sessionList?.data?.[0];
                    const bookingId = session?.metadata?.bookingId;
                    
                    
                    if (bookingId) {
                        await Booking.findByIdAndUpdate(
                            bookingId, 
                            { isPaid: true, paymentLink: '' },
                            { new: true }
                        );


                        // Send Confirmation Email
                        await inngest.send({
                            name: 'app/show.booked',
                            data: {bookingId}
                        })
                        
                    } else {
                        console.warn('No bookingId found for payment_intent', paymentIntent.id);
                    }
                } catch (err) {
                    console.error('Error processing payment_intent.succeeded:', err);
                }
                break;
            }

            default:
                console.log('Unhandled event type:', event.type);
        }

        res.json({ received: true });

    } catch (error) {
        console.error('Webhook processing error:', error);
        res.status(200).json({ error: 'Webhook handler failed' });
    }
};