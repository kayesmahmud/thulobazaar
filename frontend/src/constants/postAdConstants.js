/**
 * Constants for PostAd component
 * Centralized configuration for limits, timeouts, and messages
 */

// Character limits
export const CHAR_LIMITS = {
  TITLE: 100,
  DESCRIPTION: 1000
};

// Image upload
export const IMAGE_LIMITS = {
  MAX_IMAGES: 5
};

// UI timeouts (in milliseconds)
export const TIMEOUTS = {
  TOAST_DURATION: 3000,
  REDIRECT_DELAY: 1500
};

// Placeholder texts
export const PLACEHOLDERS = {
  TITLE: 'e.g., iPhone 14 Pro Max 256GB',
  DESCRIPTION: 'Describe your item in detail...',
  PRICE: 'e.g., 150000',
  SELLER_NAME: 'Your full name',
  SELLER_PHONE: '+977-9800000000',
  SELECT_MAIN_CATEGORY: 'Select Main Category',
  SELECT_SUBCATEGORY: 'Select Subcategory'
};

// Form messages
export const MESSAGES = {
  SUCCESS_TITLE: 'Success!',
  SUCCESS_MESSAGE: 'Your ad has been posted successfully!',
  POSTING: '⏳ Posting Ad...',
  POST_AD: '🚀 Post Ad',
  SELLER_NAME_LOCKED: 'Name is locked from your profile. Update in profile settings if needed.',
  SELLER_PHONE_EDITABLE: 'Phone from your profile. You can edit it if needed.'
};

// Form field labels
export const LABELS = {
  TITLE: 'Ad Title *',
  DESCRIPTION: 'Description *',
  PRICE: 'Price (NPR) *',
  MAIN_CATEGORY: 'Main Category *',
  SUBCATEGORY: 'Subcategory *',
  SELLER_NAME: 'Your Name * 🔒',
  SELLER_PHONE: 'Phone Number * ✏️'
};

// Section titles
export const SECTIONS = {
  POST_AD: 'Post Your Ad',
  POST_AD_SUBTITLE: 'Fill in the details below to post your ad',
  CATEGORY: 'Category',
  CONTACT_INFO: 'Contact Information'
};

// Price input constraints
export const PRICE_CONSTRAINTS = {
  MIN: 1,
  STEP: 0.01
};

// ARIA labels and IDs for accessibility
export const ARIA_IDS = {
  TITLE_COUNTER: 'title-char-counter',
  DESCRIPTION_COUNTER: 'description-char-counter',
  SELLER_NAME_HELP: 'seller-name-help-text',
  SELLER_PHONE_HELP: 'seller-phone-help-text',
  FORM_TITLE: 'post-ad-form-title',
  CATEGORY_SECTION: 'category-section-title',
  CONTACT_SECTION: 'contact-info-section-title'
};

export const ARIA_LABELS = {
  TITLE_INPUT: 'Enter advertisement title',
  DESCRIPTION_INPUT: 'Enter detailed description of your item',
  PRICE_INPUT: 'Enter price in Nepali Rupees',
  MAIN_CATEGORY_SELECT: 'Select the main category for your advertisement',
  SUBCATEGORY_SELECT: 'Select a specific subcategory',
  SELLER_NAME_INPUT: 'Your full name from profile',
  SELLER_PHONE_INPUT: 'Your contact phone number',
  SUBMIT_BUTTON: 'Submit advertisement for posting'
};
