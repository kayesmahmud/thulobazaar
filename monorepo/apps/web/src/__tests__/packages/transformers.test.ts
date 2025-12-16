import { describe, it, expect } from 'vitest';
import {
  transformDbUserToApi,
  transformApiUserToDb,
  transformDbAdToApi,
  transformApiAdToDb,
  transformDbCategoryToApi,
  transformDbLocationToApi,
  transformDbUsersToApi,
  transformDbAdsToApi,
  transformDbCategoriesToApi,
  transformDbLocationsToApi,
  safeGet,
} from '@thulobazaar/types';
import type { DbUser, DbAd, DbCategory, DbLocation } from '@thulobazaar/types';

describe('Transformers', () => {
  // ==========================================
  // User Transformers
  // ==========================================
  describe('transformDbUserToApi', () => {
    const mockDbUser: DbUser = {
      id: 1,
      email: 'test@example.com',
      password_hash: 'hashedpassword',
      full_name: 'Test User',
      phone: '9800000001',
      location_id: 10,
      is_verified: true,
      is_active: true,
      created_at: new Date('2024-01-01'),
      updated_at: new Date('2024-01-15'),
      role: 'user',
      bio: 'Test bio',
      avatar: '/avatars/test.jpg',
      cover_photo: '/covers/test.jpg',
      verified_at: new Date('2024-01-05'),
      verified_by: 2,
      is_suspended: false,
      suspended_at: null,
      suspended_until: null,
      suspended_by: null,
      suspension_reason: null,
      account_type: 'individual',
      business_name: null,
      business_license_document: null,
      business_verification_status: null,
      business_verified_at: null,
      business_verified_by: null,
      individual_verified: true,
      shop_slug: 'test-user-shop',
    };

    it('should transform all fields correctly', () => {
      const result = transformDbUserToApi(mockDbUser);

      expect(result.id).toBe(1);
      expect(result.email).toBe('test@example.com');
      expect(result.fullName).toBe('Test User');
      expect(result.phone).toBe('9800000001');
      expect(result.avatar).toBe('/avatars/test.jpg');
      expect(result.role).toBe('user');
      expect(result.accountType).toBe('individual');
      expect(result.individualVerified).toBe(true);
      expect(result.shopSlug).toBe('test-user-shop');
      expect(result.isActive).toBe(true);
      expect(result.locationId).toBe(10);
      expect(result.createdAt).toEqual(new Date('2024-01-01'));
      expect(result.updatedAt).toEqual(new Date('2024-01-15'));
    });

    it('should handle null optional fields as undefined', () => {
      const userWithNulls: DbUser = {
        ...mockDbUser,
        phone: null,
        avatar: null,
        location_id: null,
        business_verification_status: null,
        shop_slug: null,
      };

      const result = transformDbUserToApi(userWithNulls);

      expect(result.phone).toBeUndefined();
      expect(result.avatar).toBeUndefined();
      expect(result.locationId).toBeUndefined();
      expect(result.businessVerificationStatus).toBeUndefined();
      expect(result.shopSlug).toBeUndefined();
    });

    it('should throw error for null input', () => {
      expect(() => transformDbUserToApi(null as any)).toThrow(
        'transformDbUserToApi: dbUser is null or undefined'
      );
    });

    it('should throw error for undefined input', () => {
      expect(() => transformDbUserToApi(undefined as any)).toThrow(
        'transformDbUserToApi: dbUser is null or undefined'
      );
    });

    it('should handle business user correctly', () => {
      const businessUser: DbUser = {
        ...mockDbUser,
        account_type: 'business',
        business_name: 'Test Business',
        business_verification_status: 'verified',
      };

      const result = transformDbUserToApi(businessUser);

      expect(result.accountType).toBe('business');
      expect(result.businessVerificationStatus).toBe('verified');
    });
  });

  describe('transformApiUserToDb', () => {
    it('should transform partial user data', () => {
      const partialUser = {
        email: 'updated@example.com',
        fullName: 'Updated Name',
        isActive: false,
      };

      const result = transformApiUserToDb(partialUser);

      expect(result.email).toBe('updated@example.com');
      expect(result.full_name).toBe('Updated Name');
      expect(result.is_active).toBe(false);
    });

    it('should only include defined fields', () => {
      const partialUser = {
        phone: '9800000002',
      };

      const result = transformApiUserToDb(partialUser);

      expect(result.phone).toBe('9800000002');
      expect(result.email).toBeUndefined();
      expect(result.full_name).toBeUndefined();
    });

    it('should handle empty object', () => {
      const result = transformApiUserToDb({});
      expect(Object.keys(result).length).toBe(0);
    });
  });

  // ==========================================
  // Ad Transformers
  // ==========================================
  describe('transformDbAdToApi', () => {
    const mockDbAd: DbAd = {
      id: 100,
      title: 'Test Ad',
      description: 'Test description',
      price: 1500,
      category_id: 5,
      subcategory_id: 10,
      location_id: 20,
      area_id: 25,
      seller_name: 'Test Seller',
      seller_phone: '9800000001',
      condition: 'negotiable',
      status: 'active',
      view_count: 150,
      is_featured: true,
      created_at: new Date('2024-01-01'),
      updated_at: new Date('2024-01-10'),
      user_id: 1,
      status_reason: null,
      reviewed_by: 2,
      reviewed_at: new Date('2024-01-02'),
      latitude: 27.7172,
      longitude: 85.324,
      deleted_at: null,
      deleted_by: null,
      deletion_reason: null,
      is_bumped: false,
      bump_expires_at: null,
      is_sticky: true,
      sticky_expires_at: new Date('2024-02-01'),
      is_urgent: false,
      urgent_expires_at: null,
      total_promotions: 3,
      last_promoted_at: new Date('2024-01-05'),
      slug: 'test-ad-slug',
      featured_until: new Date('2024-02-15'),
      urgent_until: null,
      sticky_until: new Date('2024-02-01'),
      promoted_at: new Date('2024-01-05'),
    };

    it('should transform all fields correctly', () => {
      const images = ['/images/1.jpg', '/images/2.jpg'];
      const result = transformDbAdToApi(mockDbAd, images);

      expect(result.id).toBe(100);
      expect(result.userId).toBe(1);
      expect(result.title).toBe('Test Ad');
      expect(result.description).toBe('Test description');
      expect(result.price).toBe(1500);
      expect(result.categoryId).toBe(5);
      expect(result.subcategoryId).toBe(10);
      expect(result.locationId).toBe(20);
      expect(result.areaId).toBe(25);
      expect(result.slug).toBe('test-ad-slug');
      expect(result.status).toBe('active');
      expect(result.images).toEqual(images);
      expect(result.thumbnail).toBe('/images/1.jpg');
      expect(result.latitude).toBe(27.7172);
      expect(result.longitude).toBe(85.324);
      expect(result.viewCount).toBe(150);
      expect(result.isNegotiable).toBe(true);
      expect(result.isFeatured).toBe(true);
      expect(result.isUrgent).toBe(false);
      expect(result.isSticky).toBe(true);
    });

    it('should handle null user_id', () => {
      const adWithoutUser: DbAd = {
        ...mockDbAd,
        user_id: null,
      };

      const result = transformDbAdToApi(adWithoutUser);
      expect(result.userId).toBe(0);
    });

    it('should handle empty images array', () => {
      const result = transformDbAdToApi(mockDbAd, []);
      expect(result.images).toEqual([]);
      expect(result.thumbnail).toBeUndefined();
    });

    it('should default images to empty array when not provided', () => {
      const result = transformDbAdToApi(mockDbAd);
      expect(result.images).toEqual([]);
    });

    it('should throw error for null input', () => {
      expect(() => transformDbAdToApi(null as any)).toThrow(
        'transformDbAdToApi: dbAd is null or undefined'
      );
    });

    it('should handle isNegotiable based on condition field', () => {
      const negotiableAd: DbAd = { ...mockDbAd, condition: 'negotiable' };
      expect(transformDbAdToApi(negotiableAd).isNegotiable).toBe(true);

      const fixedAd: DbAd = { ...mockDbAd, condition: 'fixed' };
      expect(transformDbAdToApi(fixedAd).isNegotiable).toBe(false);
    });

    it('should convert string price to number', () => {
      const adWithStringPrice: any = { ...mockDbAd, price: '2500' };
      const result = transformDbAdToApi(adWithStringPrice);
      expect(result.price).toBe(2500);
    });
  });

  describe('transformApiAdToDb', () => {
    it('should transform partial ad data', () => {
      const partialAd = {
        title: 'Updated Title',
        price: 2000,
        status: 'active' as const,
      };

      const result = transformApiAdToDb(partialAd);

      expect(result.title).toBe('Updated Title');
      expect(result.price).toBe(2000);
      expect(result.status).toBe('active');
    });

    it('should only include defined fields', () => {
      const partialAd = {
        title: 'New Title',
      };

      const result = transformApiAdToDb(partialAd);

      expect(result.title).toBe('New Title');
      expect(result.price).toBeUndefined();
      expect(result.description).toBeUndefined();
    });
  });

  // ==========================================
  // Category Transformers
  // ==========================================
  describe('transformDbCategoryToApi', () => {
    const mockDbCategory: DbCategory = {
      id: 1,
      name: 'Electronics',
      slug: 'electronics',
      icon: 'laptop',
      parent_id: null,
      is_active: true,
      sort_order: 1,
      created_at: new Date(),
      updated_at: new Date(),
    };

    it('should transform category correctly', () => {
      const result = transformDbCategoryToApi(mockDbCategory);

      expect(result.id).toBe(1);
      expect(result.name).toBe('Electronics');
      expect(result.slug).toBe('electronics');
      expect(result.icon).toBe('laptop');
      expect(result.parentId).toBeUndefined();
      expect(result.isActive).toBe(true);
      expect(result.sortOrder).toBe(1);
    });

    it('should handle subcategory with parent_id', () => {
      const subcategory: DbCategory = {
        ...mockDbCategory,
        id: 10,
        name: 'Laptops',
        parent_id: 1,
      };

      const result = transformDbCategoryToApi(subcategory);
      expect(result.parentId).toBe(1);
    });

    it('should throw error for null input', () => {
      expect(() => transformDbCategoryToApi(null as any)).toThrow(
        'transformDbCategoryToApi: dbCategory is null or undefined'
      );
    });
  });

  // ==========================================
  // Location Transformers
  // ==========================================
  describe('transformDbLocationToApi', () => {
    const mockDbLocation: DbLocation = {
      id: 1,
      name: 'Kathmandu',
      slug: 'kathmandu',
      type: 'city',
      parent_id: null,
      latitude: 27.7172,
      longitude: 85.324,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    };

    it('should transform location correctly', () => {
      const result = transformDbLocationToApi(mockDbLocation);

      expect(result.id).toBe(1);
      expect(result.name).toBe('Kathmandu');
      expect(result.slug).toBe('kathmandu');
      expect(result.type).toBe('city');
      expect(result.parentId).toBeUndefined();
      expect(result.latitude).toBe(27.7172);
      expect(result.longitude).toBe(85.324);
      expect(result.isActive).toBe(true);
    });

    it('should handle area with parent_id', () => {
      const area: DbLocation = {
        ...mockDbLocation,
        id: 10,
        name: 'Thamel',
        type: 'area',
        parent_id: 1,
      };

      const result = transformDbLocationToApi(area);
      expect(result.parentId).toBe(1);
    });

    it('should throw error for null input', () => {
      expect(() => transformDbLocationToApi(null as any)).toThrow(
        'transformDbLocationToApi: dbLocation is null or undefined'
      );
    });
  });

  // ==========================================
  // Batch Transformers
  // ==========================================
  describe('Batch Transformers', () => {
    describe('transformDbUsersToApi', () => {
      it('should transform array of users', () => {
        const mockUsers: DbUser[] = [
          {
            id: 1,
            email: 'user1@test.com',
            password_hash: 'hash1',
            full_name: 'User One',
            phone: '9800000001',
            location_id: 1,
            is_verified: true,
            is_active: true,
            created_at: new Date(),
            updated_at: new Date(),
            role: 'user',
            bio: null,
            avatar: null,
            cover_photo: null,
            verified_at: null,
            verified_by: null,
            is_suspended: false,
            suspended_at: null,
            suspended_until: null,
            suspended_by: null,
            suspension_reason: null,
            account_type: 'individual',
            business_name: null,
            business_license_document: null,
            business_verification_status: null,
            business_verified_at: null,
            business_verified_by: null,
            individual_verified: false,
            shop_slug: null,
          },
        ];

        const result = transformDbUsersToApi(mockUsers);

        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBe(1);
        expect(result[0].email).toBe('user1@test.com');
        expect(result[0].fullName).toBe('User One');
      });

      it('should return empty array for non-array input', () => {
        const result = transformDbUsersToApi(null as any);
        expect(result).toEqual([]);
      });
    });

    describe('transformDbAdsToApi', () => {
      it('should return empty array for non-array input', () => {
        const result = transformDbAdsToApi('not an array' as any);
        expect(result).toEqual([]);
      });
    });

    describe('transformDbCategoriesToApi', () => {
      it('should return empty array for non-array input', () => {
        const result = transformDbCategoriesToApi(undefined as any);
        expect(result).toEqual([]);
      });
    });

    describe('transformDbLocationsToApi', () => {
      it('should return empty array for non-array input', () => {
        const result = transformDbLocationsToApi({} as any);
        expect(result).toEqual([]);
      });
    });
  });

  // ==========================================
  // safeGet Helper
  // ==========================================
  describe('safeGet', () => {
    it('should return value when key exists', () => {
      const obj = { name: 'Test', value: 123 };
      const result = safeGet<string>(obj, 'name', 'test.name');
      expect(result).toBe('Test');
    });

    it('should return undefined for null object', () => {
      const result = safeGet<string>(null, 'name', 'test.name');
      expect(result).toBeUndefined();
    });

    it('should return undefined for missing key', () => {
      const obj = { name: 'Test' };
      const result = safeGet<string>(obj, 'missing', 'test.missing');
      expect(result).toBeUndefined();
    });

    it('should work with nested objects', () => {
      const obj = { user: { name: 'Test' } };
      const result = safeGet<{ name: string }>(obj, 'user', 'test.user');
      expect(result).toEqual({ name: 'Test' });
    });
  });
});
