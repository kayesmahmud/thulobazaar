/**
 * Listing rules for online/digital offers, in two tiers:
 *
 *  - PROHIBITED (blocked at submit): selling game IDs / accounts and social
 *    media accounts or channels. Not allowed at all, so the seller is told
 *    immediately rather than waiting on an editor.
 *  - RATE-LIMITED (allowed, but only a couple per seller): follower/like
 *    boosting services and shared subscription logins. These are legal to
 *    offer here, they just must not flood the marketplace.
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


/* ------------------------------------------------------------------ *
 * Tier 2: allowed, but capped per seller so they cannot flood the site
 * ------------------------------------------------------------------ */

/** Paid-subscription services people resell logins to. */
const SUBSCRIPTION_SERVICES = [
  'netflix', 'spotify', 'prime video', 'amazon prime', 'disney', 'hotstar',
  'zee5', 'crunchyroll', 'chatgpt', 'openai', 'claude', 'gemini', 'canva',
  'grammarly', 'coursera', 'udemy', 'youtube premium', 'office 365',
];

/** Words that turn a brand mention into "a login/plan is being sold". */
const SUBSCRIPTION_TERMS = [
  'subscription', 'subscriptions', 'account', 'accounts', 'acc', 'login',
  'premium', 'plan', 'screen', 'month', 'months', 'yearly', 'shared',
];

/** Engagement-boosting terms specific enough to stand on their own. */
const ENGAGEMENT_TERMS = [
  'followers', 'follower', 'subscribers', 'subscriber', 'smm', 'smm panel',
];

/** Vaguer terms — only count alongside a platform, since property ads say
 * "mountain views" and anything can be "liked". */
const WEAK_ENGAGEMENT_TERMS = ['likes', 'views', 'boosting', 'boost'];

/**
 * True when the title offers a follower/like service or a shared subscription
 * login. These are permitted, but [MAX_LIMITED_DIGITAL_ADS_PER_USER] caps how
 * many one seller may have live at once.
 */
export function isLimitedDigitalService(title: string): boolean {
  if (!title) return false;
  const text = title.toLowerCase();

  if (firstMatch(text, ENGAGEMENT_TERMS)) return true;

  const platform =
    firstMatch(text, SOCIAL_PLATFORMS) ?? firstMatch(text, GAME_PLATFORMS);
  if (platform && firstMatch(text, WEAK_ENGAGEMENT_TERMS)) return true;

  // "Netflix account 1 month" is a resold login; "Smart TV with Netflix" is a TV.
  if (firstMatch(text, SUBSCRIPTION_SERVICES) && firstMatch(text, SUBSCRIPTION_TERMS)) {
    return true;
  }

  return false;
}

/** How many follower-service / subscription-login ads one seller may have live. */
export const MAX_LIMITED_DIGITAL_ADS_PER_USER = 2;

export const LIMITED_DIGITAL_ADS_MESSAGE =
  `You already have ${MAX_LIMITED_DIGITAL_ADS_PER_USER} active listings of this kind. ` +
  'Thulo Bazaar allows only a few follower/subscription service ads per seller — ' +
  'please remove or let an existing one expire before posting another.';
