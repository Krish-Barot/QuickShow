import stripe from 'stripe';
import Booking from '../models/Booking.js';

export const stripeWebHooks = async (req, res) => {
    
    const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);
    const sig = req.headers['stripe-signature'];
    
    if (!sig) {
        console.error('No Stripe signature found in headers');
        return res.status(400).send('No Stripe signature found');
    }

    let event;
    const secretsEnv = process.env.STRIPE_WEBHOOK_SECRET || '';

    const secrets = secretsEnv.split(',').map(s => s.trim()).filter(Boolean);
    let verifiedWithIndex = -1;

    for (let i = 0; i < secrets.length; i++) {
        const secret = secrets[i];
        try {
            event = stripeInstance.webhooks.constructEvent(
                req.body,
                sig,
                secret
            );
            verifiedWithIndex = i;
            break; 
        } catch (err) {
            continue;
        }
    }

    if (!event) {
        console.error('Webhook signature verification failed for all provided secrets. Count =', secrets.length);
        const masked = secrets.map(s => (s && s.length >= 8) ? (s.slice(0, 7) + '***') : 'invalid');
        console.error('Provided secrets (masked):', masked);
        return res.status(400).send('Webhook Error: signature verification failed');
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