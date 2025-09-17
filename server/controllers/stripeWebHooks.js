import stripe from 'stripe';
import Booking from '../models/Booking.js';

export const stripeWebHooks = async (request, response) => {
    console.log('Webhook received');
    
    const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);
    const sig = request.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!sig) {
        console.error('No Stripe signature found in headers');
        return response.status(400).send('No Stripe signature found in headers');
    }

    let event;

    try {
        event = stripeInstance.webhooks.constructEvent(
            request.body,
            sig,
            endpointSecret
        );
        console.log(`Webhook event received: ${event.type}`);
    } catch (err) {
        console.error(`Webhook signature verification failed: ${err.message}`);
        return response.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
        switch (event.type) {
            case 'payment_intent.succeeded': {
                const paymentIntent = event.data.object;
                console.log('Payment intent succeeded', {
                    paymentIntentId: paymentIntent.id,
                    amount: paymentIntent.amount,
                    status: paymentIntent.status
                });

                // Try to find the checkout session for this payment intent
                try {
                    const sessions = await stripeInstance.checkout.sessions.list({
                        payment_intent: paymentIntent.id,
                        limit: 1,
                        expand: ['data.payment_intent']
                    });

                    const session = sessions.data[0];
                    if (session) {
                        const bookingId = session?.metadata?.bookingId;
                        console.log('Found checkout session for payment intent', {
                            sessionId: session.id,
                            bookingId: bookingId
                        });

                        if (bookingId) {
                            const updatedBooking = await Booking.findByIdAndUpdate(
                                bookingId,
                                { 
                                    isPaid: true, 
                                    paymentLink: '',
                                    paymentStatus: 'paid',
                                    paymentDate: new Date()
                                },
                                { new: true, runValidators: true }
                            );
                            
                            if (updatedBooking) {
                                console.log(`Successfully updated booking ${bookingId} from payment_intent`, updatedBooking);
                            } else {
                                console.error(`Failed to find booking with ID: ${bookingId}`);
                            }
                        }
                    }
                } catch (err) {
                    console.error('Error finding checkout session for payment intent:', err);
                }
                break;
            }

            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        response.json({ received: true });
    } catch (error) {
        console.error('Error processing webhook:', error);
        response.status(500).json({ error: 'Internal server error', message: error.message });
    }
};