/**
 * Ad Methods
 */

import type { AxiosInstance } from 'axios';
import type {
  Ad,
  AdWithDetails,
  AiDraft,
  ApiResponse,
  PaginatedResponse,
  SearchFilters,
  PostAdFormData,
  CrossPlatformFile,
} from '@thulobazaar/types';
import { appendFileToFormData } from '@thulobazaar/upload-utils';

export function createAdMethods(client: AxiosInstance) {
  return {
    async getAds(params?: {
      page?: number;
      limit?: number;
      category_id?: number;
      location_id?: number;
      sort_by?: string;
    }): Promise<PaginatedResponse<AdWithDetails>> {
      const response = await client.get('/api/ads', { params });
      return response.data;
    },

    async getAdById(id: number): Promise<ApiResponse<AdWithDetails>> {
      const response = await client.get(`/api/ads/${id}`);
      return response.data;
    },

    async getAdBySlug(slug: string): Promise<ApiResponse<AdWithDetails>> {
      const response = await client.get(`/api/ads/slug/${slug}`);
      return response.data;
    },

    async searchAds(filters: SearchFilters): Promise<PaginatedResponse<AdWithDetails>> {
      const response = await client.post('/api/ads/search', filters);
      return response.data;
    },

    async createAd(data: PostAdFormData): Promise<ApiResponse<Ad>> {
      const formData = new FormData();

      // Append basic fields
      formData.append('title', data.title);
      formData.append('description', data.description);
      formData.append('price', data.price.toString());
      formData.append('isNegotiable', data.isNegotiable.toString());
      formData.append('categoryId', data.categoryId.toString());

      if (data.subcategoryId) {
        formData.append('subcategoryId', data.subcategoryId.toString());
      }
      if (data.locationId) {
        formData.append('locationId', data.locationId.toString());
      }
      if (data.areaId) {
        formData.append('areaId', data.areaId.toString());
      }
      if (data.latitude) {
        formData.append('latitude', data.latitude.toString());
      }
      if (data.longitude) {
        formData.append('longitude', data.longitude.toString());
      }
      if (data.googleMapsLink) {
        formData.append('googleMapsLink', data.googleMapsLink);
      }
      if (data.attributes) {
        formData.append('attributes', JSON.stringify(data.attributes));
      }

      if (data.stagedImageIds && data.stagedImageIds.length > 0) {
        // Background-staged photos: ids only, no file bytes — Post Ad is instant
        formData.append('stagedImages', JSON.stringify(data.stagedImageIds));
      } else {
        // Append images - handle File, CrossPlatformFile, and string (existing URLs)
        data.images.forEach((image) => {
          if (typeof image === 'string') {
            // Skip strings (these are existing image URLs, handled differently)
            return;
          }
          if (image instanceof File) {
            formData.append('images', image);
          } else if ('uri' in image) {
            // CrossPlatformFile (React Native)
            appendFileToFormData(formData, 'images', image);
          }
        });
      }

      const response = await client.post('/api/ads', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    },

    /**
     * Background-stage one ad photo the moment it is picked. The returned
     * stagedId goes into createAd's stagedImageIds. Fail-open: on any error
     * the client simply falls back to classic file upload at submit.
     */
    async stageAdImage(image: File | CrossPlatformFile): Promise<ApiResponse<{ stagedId: string }>> {
      const formData = new FormData();
      if (image instanceof File) {
        formData.append('image', image);
      } else if ('uri' in image) {
        appendFileToFormData(formData, 'image', image);
      }
      const response = await client.post('/api/ads/stage-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    },

    /**
     * AI autofill: draft a listing from up to 3 photos. Returns data: null when
     * the feature is off/unavailable — callers must treat that as "no suggestions".
     */
    async getAiDraft(images: (File | CrossPlatformFile)[]): Promise<ApiResponse<AiDraft | null>> {
      const formData = new FormData();
      images.slice(0, 3).forEach((image) => {
        if (image instanceof File) {
          formData.append('images', image);
        } else if ('uri' in image) {
          appendFileToFormData(formData, 'images', image);
        }
      });
      const response = await client.post('/api/ads/ai-draft', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    },

    /**
     * Pre-post AI check on manually-typed fields. Advisory only — an empty
     * warnings array (including on any server/AI trouble) means post as usual.
     */
    async precheckAd(input: {
      title: string;
      description?: string | null;
      categoryName?: string | null;
      price?: number | null;
    }): Promise<
      ApiResponse<{
        warnings: Array<
          | { code: 'category_mismatch'; suggestedCategory: string | null }
          | { code: 'spelling'; correctedTitle: string | null }
        >;
      }>
    > {
      const response = await client.post('/api/ads/ai-precheck', input);
      return response.data;
    },

    async getAdEditContext(
      id: number
    ): Promise<ApiResponse<{
      status: string;
      aiHeld: boolean;
      aiReasonCode: string | null;
      aiSuggestedCategory: string | null;
      canDirectPublish: boolean;
      willGoToPending: boolean;
      editLimit: number;
      editsUsed: number;
      editsRemaining: number;
    }>> {
      const response = await client.get(`/api/ads/${id}/edit-context`);
      return response.data;
    },

    async getMyAdEditHistory(
      id: number
    ): Promise<ApiResponse<Array<{
      id: number;
      resulting_status: string;
      previous_data: Record<string, unknown>;
      created_at: string;
    }>>> {
      const response = await client.get(`/api/ads/${id}/edit-history`);
      return response.data;
    },

    async updateAd(
      id: number,
      data: Partial<PostAdFormData> & { existingImages?: string[] }
    ): Promise<ApiResponse<Ad> & { resultingStatus?: string }> {
      const formData = new FormData();

      // Append text fields
      if (data.title) {
        formData.append('title', data.title);
      }
      if (data.description) {
        formData.append('description', data.description);
      }
      if (data.price !== undefined) {
        formData.append('price', data.price.toString());
      }
      if (data.isNegotiable !== undefined) {
        formData.append('isNegotiable', data.isNegotiable.toString());
      }
      if (data.categoryId) {
        formData.append('categoryId', data.categoryId.toString());
      }
      if (data.subcategoryId) {
        formData.append('subcategoryId', data.subcategoryId.toString());
      }
      if (data.locationId) {
        formData.append('locationId', data.locationId.toString());
      }
      if (data.areaId) {
        formData.append('areaId', data.areaId.toString());
      }
      if (data.latitude) {
        formData.append('latitude', data.latitude.toString());
      }
      if (data.longitude) {
        formData.append('longitude', data.longitude.toString());
      }
      if (data.googleMapsLink) {
        formData.append('googleMapsLink', data.googleMapsLink);
      }
      if (data.attributes) {
        formData.append('attributes', JSON.stringify(data.attributes));
      }
      // Append existing images as JSON array (paths to keep)
      if (data.existingImages) {
        formData.append('existingImages', JSON.stringify(data.existingImages));
      }

      // Append new image files - handle File, CrossPlatformFile, and string
      if (data.images && Array.isArray(data.images)) {
        data.images.forEach((image) => {
          if (typeof image === 'string') {
            // Skip strings (existing image URLs are handled via existingImages)
            return;
          }
          if (image instanceof File) {
            formData.append('images', image);
          } else if ('uri' in image) {
            // CrossPlatformFile (React Native)
            appendFileToFormData(formData, 'images', image);
          }
        });
      }

      const response = await client.put(`/api/ads/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      return response.data;
    },

    async deleteAd(id: number): Promise<ApiResponse<void>> {
      const response = await client.delete(`/api/ads/${id}`);
      return response.data;
    },

    async incrementAdView(id: number): Promise<ApiResponse<void>> {
      const response = await client.post(`/api/ads/${id}/view`);
      return response.data;
    },

    async getUserAds(): Promise<ApiResponse<AdWithDetails[]>> {
      const response = await client.get('/api/ads/my-ads');
      return response.data;
    },
  };
}
