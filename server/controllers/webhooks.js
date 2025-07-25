import { Webhook } from "svix";
import User from "../models/User.js";
import stripe from "stripe";
import { Purchase } from "../models/Purchase.js";
import Course from "../models/Course.js";

// Helper function to safely construct full name
const sanitize = (value) => {
  if (!value) return '';
  const str = String(value).trim();
  return str === 'null' || str === 'undefined' ? '' : str;
};

const constructFullName = (firstName, lastName) => {
  const first = sanitize(firstName);
  const last = sanitize(lastName);
  
  if (first && last && first!=null && last!=null) {
    return `${first} ${last}`;
  } else if (first) {
    return first;
  } else if (last) {
    return last;
  } else {
    return undefined; // Don't set name field if both are missing
  }
};

// API Controller Function to Manage Clerk User with database
export const clerkWebhooks = async (req, res) => {
  try {
    // Create a Svix instance with clerk webhook secret.
    const whook = new Webhook(process.env.CLERK_WEBHOOK_SECRET)

    // Verifying Headers
    await whook.verify(JSON.stringify(req.body), {
      "svix-id": req.headers["svix-id"],
      "svix-timestamp": req.headers["svix-timestamp"],
      "svix-signature": req.headers["svix-signature"]
    })

    // Getting Data from request body
    const { data, type } = req.body

    // Switch Cases for different Events
    switch (type) {
      case 'user.created': {
        console.log('Clerk user.created webhook data:', {
          id: data.id,
          email: data.email_addresses[0]?.email_address,
          first_name: data.first_name,
          last_name: data.last_name,
          image_url: data.image_url
        });

        // Build userData object with proper name handling
        const userData = {
          _id: data.id,
          email: data.email_addresses[0].email_address,
          imageUrl: data.image_url
        }

        // Only add name if we can construct a valid one
        const fullName = constructFullName(data.first_name, data.last_name);
        if (fullName) {
          userData.name = fullName;
        }
        // If no valid name, the field will be undefined and won't be saved to DB

        console.log('Creating user with data:', userData);

        await User.create(userData)
        res.json({})
        break;
      }

      case 'user.updated': {
        console.log('Clerk user.updated webhook data:', {
          id: data.id,
          email: data.email_addresses[0]?.email_address,
          first_name: data.first_name,
          last_name: data.last_name,
          image_url: data.image_url
        });

        // Build update object with proper name handling
        const updateData = {
          email: data.email_addresses[0].email_address,
          imageUrl: data.image_url,
        }

        // Only update name if we can construct a valid one
        const fullName = constructFullName(data.first_name, data.last_name);
        if (fullName) {
          updateData.name = fullName;
        }
        // If no valid name, don't update the name field

        console.log('Updating user with data:', updateData);

        await User.findByIdAndUpdate(data.id, updateData)
        res.json({})
        break;
      }

      case 'user.deleted': {
        await User.findByIdAndDelete(data.id)
        res.json({})
        break;
      }
      default:
        console.log(`Unhandled webhook event type: ${type}`);
        break;
    }

  } catch (error) {
    console.error('Clerk webhook error:', error);
    res.json({ success: false, message: error.message })
  }
}

// Stripe Gateway Initialize
const stripeInstance = new stripe(process.env.STRIPE_SECRET_KEY)

// Stripe Webhooks to Manage Payments Action
export const stripeWebhooks = async (request, response) => {
  const sig = request.headers['stripe-signature'];

  let event;

  try {
    event = stripeInstance.webhooks.constructEvent(request.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  }
  catch (err) {
    response.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object;
      const paymentIntentId = paymentIntent.id;

      // Getting Session Metadata
      const session = await stripeInstance.checkout.sessions.list({
        payment_intent: paymentIntentId,
      });

      const { purchaseId } = session.data[0].metadata;

      const purchaseData = await Purchase.findById(purchaseId)
      const userData = await User.findById(purchaseData.userId)
      const courseData = await Course.findById(purchaseData.courseId.toString())

      courseData.enrolledStudents.push(userData)
      await courseData.save()

      userData.enrolledCourses.push(courseData._id)
      await userData.save()

      purchaseData.status = 'completed'
      await purchaseData.save()

      break;
    }
    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object;
      const paymentIntentId = paymentIntent.id;

      // Getting Session Metadata
      const session = await stripeInstance.checkout.sessions.list({
        payment_intent: paymentIntentId,
      });

      const { purchaseId } = session.data[0].metadata;

      const purchaseData = await Purchase.findById(purchaseId)
      purchaseData.status = 'failed'
      await purchaseData.save()

      break;
    }
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a response to acknowledge receipt of the event
  response.json({ received: true });
}