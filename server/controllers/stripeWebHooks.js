import stripe from 'stripe'
import Booking from '../models/Booking.js';


export const stripeWebHooks = async (req, res) => {
    console.log("hello")
    console.log(req.headers)
    const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY);
    const sig = req.headers['stripe-signature'];
    console.log(sig)
    let event
    try {
        event = stripeInstance.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);

    } catch (error) {
        return res.status(400).send(`Webhook error: ${error.message}`);
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
                console.log("1")
                const paymentIntent = event.data.object;
                const sessionList = await stripeInstance.checkout.sessions.list({
                    payment_intent: paymentIntent.id,
                    limit: 1,
                });

                console.log("2")
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

        return res.status(200).json({ received: true });

    } catch (error) {
        console.log("Webhook processing error : ", error);
        res.status(500).send("Internal server error");
    }
}   