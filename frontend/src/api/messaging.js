/**
 * Messaging API
 *
 * Handles all messaging and reporting operations
 */

import { get, post } from './client.js';

/**
 * Contact seller
 */
export async function contactSeller(contactData) {
  const data = await post('/contact-seller', contactData, true);
  return data;
}

/**
 * Report ad
 */
export async function reportAd(reportData) {
  const data = await post('/report-ad', reportData, true);
  return data;
}

/**
 * Get contact messages
 */
export async function getContactMessages(type = 'received') {
  const data = await get(`/user/contact-messages?type=${type}`, true);
  return data.data;
}

/**
 * Reply to message
 */
export async function replyToMessage(originalMessageId, replyMessage) {
  const data = await post('/reply-message', {
    originalMessageId,
    replyMessage
  }, true);
  return data;
}

// Default export
export default {
  contactSeller,
  reportAd,
  getContactMessages,
  replyToMessage
};
