import en from '../en.json';
import ne from '../ne.json';

export const translations = {
  en,
  ne,
} as const;

export type SupportedLanguage = 'en' | 'ne';

export type TranslationKeys = typeof en;

export { en, ne };

export default translations;
