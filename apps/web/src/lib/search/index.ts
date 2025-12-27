/**
 * Search module - Typesense integration
 */

export {
  typesenseClient,
  COLLECTION_NAME,
  adsCollectionSchema,
  initializeCollection,
  indexAd,
  removeAdFromIndex,
  bulkIndexAds,
  buildFilterQuery,
  type TypesenseAdDocument,
} from './typesense';
