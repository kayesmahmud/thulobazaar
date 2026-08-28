/**
 * Prohibited listings: selling game IDs / accounts and social media accounts
 * or channels. Thulo Bazaar does not allow these at all — they are blocked at
 * submit rather than held for review, so the seller is told immediately.
 *
 * This runs on the TITLE only, on purpose. A description legitimately says
 * things like "follow us on Instagram" or "watch the demo on YouTube", and a
 * hard block must never fire on that. Anything worded around this check is
 * caught by the AI moderator, which reads the full ad and holds it.
 *
 * Shared by BOTH create paths — Express (mobile) and Next.js (web) — because
 * they are separate implementations and a rule in only one of them is a hole.
 */

/** Games whose accounts/IDs/currency are commonly resold. */
const GAME_PLATFORMS = [
  'free fire', 'freefire', 'garena', 'pubg', 'bgmi', 'mobile legends',
  'clash of clans', 'call of duty', 'cod mobile', 'valorant', 'genshin',
  'roblox', 'minecraft', 'efootball', 'fortnite', 'steam',
];

/** Social platforms whose accounts/channels/pages are commonly resold. */
const SOCIAL_PLATFORMS = [
  'tiktok', 'tik tok', 'youtube', 'you tube', 'instagram', 'facebook',
  'snapchat', 'telegram', 'twitter', 'threads', 'discord',
];

/** Words that turn a platform mention into "an account is being sold". */
const ACCOUNT_TERMS = [
  'id', 'ids', 'account', 'accounts', 'acc', 'uid',
  'channel', 'page', 'profile', 'login', 'username', 'handle',
];

/** In-game currency and items — only prohibited alongside a game platform. */
const GAME_CURRENCY_TERMS = [
  'diamond', 'diamonds', 'uc', 'top up', 'topup', 'recharge', 'skin', 'skins',
];

/**
 * Word-boundary match so "id" does not fire inside "android", "video" or
 * "paid" — the single most likely source of a false block.
 */
function containsTerm(haystack: string, term: string): boolean {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}\\b`, 'i').test(haystack);
}

function firstMatch(haystack: string, terms: string[]): string | null {
  return terms.find((term) => containsTerm(haystack, term)) ?? null;
}

/**
 * Returns the offending platform name when the title is selling a game or
 * social account, otherwise null. Requires a platform AND an account-ish word,
 * so "Samsung TV with YouTube" and "iPhone 13" stay postable.
 */
export function findProhibitedAccountSale(title: string): string | null {
  if (!title) return null;
  const text = title.toLowerCase();

  const game = firstMatch(text, GAME_PLATFORMS);
  const social = firstMatch(text, SOCIAL_PLATFORMS);
  if (!game && !social) return null;

  if (firstMatch(text, ACCOUNT_TERMS)) return game ?? social;
  // "Free Fire diamonds" is a sale of game currency; "YouTube diamonds" is not.
  if (game && firstMatch(text, GAME_CURRENCY_TERMS)) return game;

  return null;
}

/** Shown to the seller when the block fires. Kept in one place so web, mobile and tests agree. */
export const PROHIBITED_ACCOUNT_SALE_MESSAGE =
  'Sorry, this kind of listing is not allowed on Thulo Bazaar. Selling game IDs, social media accounts, channels or pages is prohibited.';
