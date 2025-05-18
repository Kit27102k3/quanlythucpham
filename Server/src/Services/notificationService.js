import webpush from 'web-push';
import dotenv from 'dotenv';
import User from '../Model/Register.js'; // Import User model if notifications are for users
import Admin from '../Model/adminModel.js'; // Import Admin model if notifications are for admins

dotenv.config();

// Configure web-push with VAPID keys
const vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY,
  privateKey: process.env.VAPID_PRIVATE_KEY,
};

webpush.setVapidDetails(
  'mailto:your_email@example.com', // TODO: Replace with a valid email address
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

// Function to send a push notification to a single subscription
export const sendPushNotification = async (userId, subscription, payload) => {
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
    console.log('Push notification sent successfully for user:', userId);
  } catch (error) {
    console.error('Error sending push notification for user:', userId, ':', error);

    // Handle cases where the subscription is no longer valid
    if (error.statusCode === 404 || error.statusCode === 410) {
      console.log('Subscription expired or no longer valid for user:', userId, '. Removing...');
      // Implement logic to remove the expired/invalid subscription from the database
      try {
        await User.findByIdAndUpdate(
          userId,
          { $pull: { pushSubscriptions: { endpoint: subscription.endpoint } } },
          { new: true }
        );
        console.log('Removed invalid subscription for user:', userId, ':', subscription.endpoint);
      } catch (dbError) {
        console.error('Error removing invalid subscription from database for user:', userId, ':', dbError);
      }

    } else {
      // Handle other errors
      console.error('Failed to send push notification for user:', userId, ':', error);
    }
    // Optionally, you might not want to re-throw the error if it was just an invalid subscription
    // throw error; // Re-throw the error for calling function to handle if needed
  }
};

// TODO: Add more functions here as needed, e.g., to send notification to all subscriptions of a user 