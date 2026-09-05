# AI Posting Rollout — Copy & Feedback Audit

**Compiled 2026-09-05** from the working tree on `feat/signboard-generator` and live production data.
Every file path and line number below was read, not inferred.

---

## Verdict

1. **The copy problem is real and bigger than expected.** 14 user-facing strings are now factually
   wrong, and three of them publish *contradictory* delivery promises on the same page
   (24 hours / 2 hours / minutes).
2. **The feature you asked about is ~90% built already.** The AI writes exactly the comment you
   described — *"Category mismatch: guitar listed under Video Game Consoles & Accessories."* — and the
   dashboard banner that displays it exists on both web and Flutter. It shows nothing because **one
   line is missing from the AI prompt.**

## Production reality (read live 2026-09-05 12:37 UTC)

| Metric | Value |
|---|---|
| `ai_verdict='published'` (auto-approved) | 225 |
| `ai_verdict='audited'` (verified biz, published + checked) | 65 |
| `ai_verdict='held'` (sent to a human) | 71 |
| **Auto-approval rate** | **~80%** (290 of 361) |
| **Held ads showing the seller NO reason** | **65 of 71 (92%)** |
| Held ads an editor then approved anyway | 56 of 71 |

All three flags in `site_settings` are `true`: `ai_autofill_enabled`, `ai_moderation_enabled`,
`ai_precheck_enabled`. Daily cap 500.

---

## 01 — Fix this first (unblocks section 03)

### Root cause: the seller-facing reason code is never requested from the model

The live moderation prompt is `apps/api/policies/core.md`, which **fully replaces** the built-in
prompt — `moderation.service.ts:394`: `const core = (await getCorePolicy()) ?? MODERATION_SYSTEM_PROMPT;`

The built-in constant asks the model for a `reason_code` (`moderation.service.ts:71-79`).
**core.md never does** — verified inside the running production container, `grep -c reason_code`
returns `0`, and its reply schema omits the field entirely.

So `parseVerdict` stores `null` → the dashboard banner falls back to generic → the specific sentence
the AI wrote stays locked in `ai_reason`, which is stripped from every seller response as editor-only.

- [ ] **Add the `reason_code` instruction + JSON field to `apps/api/policies/core.md:32`.**
      Copy the wording from the fallback at `moderation.service.ts:71-79` so the two stay in sync.
      The whitelist `SELLER_REASON_CODES` (line 83) already accepts all seven codes — no code change.
- [ ] **Verify on prod after deploy.** Post a deliberately miscategorised test ad, then
      `SELECT ai_verdict, ai_reason_code, ai_reason FROM ads ORDER BY id DESC LIMIT 1;`
      Today that column is NULL for 92% of holds, including 8 of 8 held today.
- [ ] **Judgement call: the AI is over-holding.** Editors approved 56 of 71 held ads. Most holds are
      category mismatches the AI itself could fix. Decide whether a mismatch should hold at all, or
      publish with a "we moved this to Mobiles" note.

---

## 02 — Copy that is now factually wrong

Every key below exists in **both** `en.json` and `ne.json` with a real Nepali translation, so each fix
is two edits. Parity confirmed: web 1163/1163 keys, mobile 799/799 — zero missing, zero
English-as-Nepali.

### Web — Help Centre & FAQ

- [ ] `help.postingAdsA1` — **highest-priority string in the repo**
      > "…select a category, fill in the details including title, description, price, and photos…
      > Your ad will be **reviewed and published within 24 hours**."

      Sits in the same accordion as `postingAdsA6`, which already says "most ads go live within
      minutes" — **the page contradicts itself today.**
- [ ] `help.postingAdsA2` (why rejected) — no AI hold-vs-reject distinction. Must say the AI can only
      hold, never reject; a rejection is always a human decision.
- [ ] `help.postingAdsA3` (photos) — still frames photos as decoration for buyers. They are now the
      *input the ad is written from*, and only the first 3 are read.
- [ ] `help.postingAdsA5` (editing) — "Some changes may require **re-review by our moderation team**."
- [ ] `faq.sellingA1` / `faq.sellingA2` / `faq.sellingA4` — duplicates of the above.
      **Also feeds the FAQPage structured data** (see 04).

### Web — dashboard, post-ad, legal

- [ ] `dashboard.adsAwaitingReview` → `AdsList.tsx:142`
      > "Your ads are awaiting review. They will go live **once an editor approves them**."

      Nepali mirrors it: "सम्पादकले स्वीकृत गरेपछि". Should apply only to held ads now.
- [ ] `ads.adPostedReviewNote` → `AdPostedModal.tsx:49` — "published **within 2 hours**" (third SLA).
      ⚠️ `adPostedReviewNoteLatin` is romanised Nepali shown in the EN locale — identical in both
      files **by design**, do not "fix" it.
- [ ] `ads.fillDetails` → `post-ad/page.tsx:173` — "Fill in the details below to create your listing".
      First thing a seller reads; should lead with photos-first.
- [ ] `termsOfService.postingAdsDesc` — says nothing about AI-authored content. Needs: who owns an
      AI-written title/description, and that the seller stays responsible for accuracy.
      `aiFeaturesDesc`, `contentModerationDesc` and privacy `aiProcessingDesc` are already current.
      Bump hardcoded `lastUpdated` at `TermsOfServiceClient.tsx:186`.
- [ ] `common.noAdsYetDesc` → `EmptyState.tsx:67` — "takes just a few minutes". Best onboarding hook
      on the site for "snap a photo, the AI does the rest".

### Flutter — Help Centre (27 Q&As, fully translated)

- [ ] `help.a5` (`translations/{en,ne}.json:623`) — "Tap the "+" button, select a category, fill in
      the details (title, description, price, photos)…"
- [ ] `help.a9` — "Changes may need **re-approval by our team**."
- [ ] `help.a6` + `help.a7` — same two problems as the web equivalents.
- [ ] `help.a26` ("Does Thulo Bazaar use AI?") — understates twice: it **writes** rather than
      "can suggest", and it **no longer fills price at all** (removed 2026-08-27 — the seller always
      types their own). Missing the headline fact that most ads publish instantly.
- [ ] `postAd.adPostedReviewNote` → `create_ad_screen.dart:1476` — "within 2 hours".
- [x] `gate.postAd.b2` — "Add a photo — AI writes the rest" — **already correct.** Use this line's
      voice as the model for the rewrites; could add "and goes live in seconds".

### Not translated at all — English-only strings on user screens

- [ ] **Web edit-ad status banners, 100% hardcoded** —
      `apps/web/src/app/[lang]/edit-ad/[id]/components/StatusBanners.tsx:15-99` (~12 strings)
      > "Our editors will review your changes and it will go live again **once approved**."
      > "You'll receive a notification once the **editor** reviews it again"

      Wrong twice over: describes a purely human loop, **and** a Nepali user sees it in English.
- [ ] **Flutter pending banner + edit warning dialog** — `dashboard_screen.dart:563-593`,
      `edit_ad_warning_dialog.dart:17-33`. Hardcoded bilingual ternaries rather than `.tr()`, so they
      also escape `npm run check:i18n`.
- [ ] **Ad approved / rejected emails** — `apps/web/src/lib/notifications/notifications.ts:268-313`.
      English-only, and doesn't distinguish an instant AI approval from a human one after a hold.
- [ ] **Flutter verification FAQ** — `verification_widgets.dart:924-970`, an entire in-app FAQ in
      English only. Dead duplicate at `widgets/verification_faq.dart` can be deleted.

---

## 03 — The AI comment in the modal and on the dashboard

Your mental model was close, with one correction: there are **two** dialogs per platform, not three.
"AI generated your title and category, review it" is **not its own dialog** — it is one warning row
(`aiWarnFilled`) inside the *same* modal that offers "Post anyway". AI autofill status is shown by an
inline banner + per-field ✨ badges, never a dialog.

### Already exists on both platforms

- [x] **Dialog 1 — "Quick check before posting"** (`AiConfirmModal.tsx`, `create_ad_screen.dart:1086`).
      Amber rows for: junk photo, absurd price, unreviewed AI fields, **category mismatch**, spelling.
      Red "Review again" / green "Post anyway". "Post anyway" bypasses nothing server-side — it only
      sets a client flag; the ad still gets full moderation.
- [x] **Dialog 2 — post-success, then redirect** (`AdPostedModal.tsx`, `success_checkmark.dart:129`).
      Both clients poll ~10s while open; live → ad detail page, held → dashboard Pending tab.
      Exactly the flow you described.
- [x] **Dashboard hold banner, bilingual, 7 reason codes** (`AdItem.tsx:110-131`,
      `dashboard_screen.dart:759-808`) with a "Fix it now — edit your ad" link.
      **This is the "same comment on the dashboard" you asked for. It is built, and it is empty.**
      Fix section 01 and it starts working.

### Genuinely missing

- [ ] **Both clients throw away the AI's suggestion** — `ad_client.dart:447-452`,
      `usePostAd.ts:643-645`. The precheck API already returns `suggestedCategory` and
      `correctedTitle`; both clients do `.map(w => w.code)` and discard them. So the modal says
      "your category looks wrong" when it could say **"should be Mobiles"**.
      **No API, schema or migration change — client-side only. Cheapest win here.**
- [ ] **Expose the verdict to the post-success modal** — the modal polls `/ads/:id/edit-context`
      (`ads.routes.ts:537`), which returns only `status`, `canDirectPublish`, `willGoToPending` and
      edit counts. Add `aiHeld` + `aiReasonCode`; **the data is already in the DB row** and both
      clients already own bilingual copy for every code. Then the modal and the dashboard say the
      same sentence — which is what you asked for.
- [ ] **Decide the slow-verdict fallback.** The poll window is ~10s; moderation is often slower, so
      the modal will frequently close before a verdict exists. The dashboard banner already covers
      it, so "we're checking — watch your dashboard" may be enough.
- [ ] **The seller is never notified when their ad is held** — `moderation.service.ts:667-676`
      notifies **editors only**; a push exists for the publish path. A held seller finds out only by
      opening the dashboard. This is the main reason the AI comment goes unread today.
- [ ] **(Optional) Pre-post warnings are never stored.** `/api/ads/ai-precheck` writes nothing to the
      DB — the warning dies when the screen closes. Persisting *that* comment needs a new column +
      migration. **Probably unnecessary:** if the category really is wrong, moderation catches it
      again and the existing `details_mismatch` banner covers it for free.

---

## 04 — Reach, and the facts to write from

### Surfaces that don't exist yet

- [ ] **Google is served the wrong process.** `FaqJsonLd.tsx` ← `faq/page.tsx:15-22` (`FAQ_Q_KEYS`)
      emits the stale "will be reviewed and published" answer, and **excludes** `generalQ4`
      ("Does Thulo Bazaar use AI?") and `generalQ5`. Adding those two to the array is the
      highest-leverage SEO change available. `/help` carries 27 Q&As and emits **no** structured data.
- [ ] **There is no "how posting works" page anywhere.** No `/how-it-works`, `/seller-guide`, or
      homepage explainer. Your single biggest differentiator is described only inside two FAQ
      accordion rows. If you build one, add it to `sitemap.ts:149`.
- [ ] **Flutter hides Help from signed-in users** — `main_drawer.dart:135,145` wrap Help Centre and
      Contact Us in `if (!signedIn)`. Also `support.browseHelp` just closes the sheet
      (`support_tickets_screen.dart:294`), and the guest Profile "Help Center" row is `onTap: () {}`.
- [ ] **Support-ticket deflection serves the stale answers** — `NewTicketModal.tsx:9-16`
      (`FAQ_KEYS`). Fixing `faq.selling*` fixes this automatically, but `FAQ_KEYS` also omits the AI
      questions, so "why is my ad pending?" never deflects to the right answer.

### Ground truth for whoever writes the new copy

**Autofill.** Reads up to the **first 3 photos** (5 MB each; JPEG/PNG/GIF/WebP/AVIF), held in memory
and never stored. Fills **title, description, category and subcategory — and nothing else.** It does
*not* fill price, condition, location or attributes; those are deliberately the seller's. Takes
5–10s. Every filled field carries a ✨ badge and is editable; the badge clears when touched. Photos
win over anything typed earlier. Limit ~30 fills/hour/account. Not run when editing.

**Approval.** Exactly two outcomes — **publish or hold. The AI can never reject.** Auto-publish needs
0.95+ confidence and no safety flag. An ad with no photos is never auto-published. If the AI is off,
over its 500/day budget, or down, the ad simply waits for a human — nothing else changes. Editing
re-runs the same screening. Verified businesses publish instantly and are audited straight after.

**Blocked outright at submit** (an error, not a hold): game accounts/IDs/in-game currency and social
media accounts/channels/pages, matched on the title. Follower services and shared subscription logins
are allowed but capped at 2 live per seller.
**Held every time:** weapons, ammunition, explosives, illegal drugs, tobacco and nicotine including
vapes, protected wildlife parts, counterfeit or stolen goods, government IDs.
**Photos removed + auto-reported:** real nudity, sexual acts, adult products — lingerie and swimwear
shown as a product are fine.

**Never tell sellers** the raw `ai_reason` sentence — it is editor-only by design and stripped from
every seller-facing response (`ad.service.ts:227-228`). Sellers see the mapped reason code only.
Explicit and prohibited findings always collapse to the deliberately vague `policy_check` so the code
can't be used to probe the filter.

---

## 05 — Decisions only you can make

1. **What is the promise for a held ad?** Four different numbers are live right now: 24 hours (web
   help), 2 hours (both post-success modals), "within minutes" (web AI FAQ), and "once an editor
   approves" (both dashboards). Pick one and it propagates to every string in section 02.
2. **Should a category mismatch hold the ad at all?** It is the most common hold reason, and editors
   approved 56 of 71 held ads anyway. Alternative: publish it and tell the seller where it was moved.
3. **Do you want to say "AI" out loud to sellers, or just "instant"?** Current copy is split — the
   gate says "AI writes the rest", the FAQ hedges with "can suggest". The Nepali framing matters more
   than the English here.
4. **Is a "how posting works" page in scope for this pass?** Rewriting 14 strings is a day. A new
   public page with its own structured data is different work — and it is where the SEO value sits.
