import stripe from 'stripe'
import Booking from '../models/Booking.js';

export const stripeWebHooks = async (request, response) => {
    const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);
    const sig = request.headers['stripe-signature'];

    let event;

    try {
        event = stripeInstance.webhooks.constructEvent(request.body, sig, process.env.STRIPE_WEBHOOK_SECRET);

    } catch (error) {
        return response.status(400).send(`Webhook error: ${error.message}`);
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
                    console.log('Booking updated:', !!updated);
                } else {
                    console.warn('No bookingId in session.metadata', session);
                }
                break;
            }

            case 'payment_intent.succeeded': {
                // fallback if you rely on payment_intent event
                const paymentIntent = event.data.object;
                const sessionList = await stripe.checkout.sessions.list({
                    payment_intent: paymentIntent.id,
                    limit: 1,
                });
                const session = sessionList.data[0];
                const bookingId = session?.metadata?.bookingId;
                console.log('payment_intent.succeeded, bookingId=', bookingId);
                if (bookingId) {
                    await Booking.findByIdAndUpdate(bookingId, { isPaid: true, paymentLink: '' });
                } else {
                    console.warn('No bookingId found for payment_intent', paymentIntent.id);
                }
                break;
            }

            default:
                console.log('Unhandled event type', event.type);
        }

        response.status(200).send('ok');
        response.json({ received: true });
    } catch (error) {
        console.log("Webhook processing error : ", error);
        response.status(500).send("Internal server error");
    }
}   