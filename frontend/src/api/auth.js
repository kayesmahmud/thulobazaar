/**
 * Authentication API
 *
 * Handles all authentication and user profile operations
 */

import { get, post, put, del } from './client.js';

/**
 * Login user
 */
export async function login(email, password) {
  const data = await post('/auth/login', { email, password });
  return data.data;
}

/**
 * Register new user
 */
export async function register(userData) {
  const data = await post('/auth/register', userData);
  return data.data;
}

/**
 * Get user profile
 */
export async function getProfile() {
  const data = await get('/profile', true);
  return data.data;
}

/**
 * Update user profile
 */
export async function updateProfile(profileData) {
  const data = await put('/profile', profileData, true);
  return data;
}

/**
 * Upload avatar
 */
export async function uploadAvatar(file) {
  const formData = new FormData();
  formData.append('avatar', file);

  const data = await post('/profile/avatar', formData, true);
  return data;
}

/**
 * Upload cover photo
 */
export async function uploadCoverPhoto(file) {
  const formData = new FormData();
  formData.append('cover', file);

  const data = await post('/profile/cover', formData, true);
  return data;
}

/**
 * Remove avatar
 */
export async function removeAvatar() {
  const data = await del('/profile/avatar', true);
  return data;
}

/**
 * Remove cover photo
 */
export async function removeCoverPhoto() {
  const data = await del('/profile/cover', true);
  return data;
}

// Default export
export default {
  login,
  register,
  getProfile,
  updateProfile,
  uploadAvatar,
  uploadCoverPhoto,
  removeAvatar,
  removeCoverPhoto
};
