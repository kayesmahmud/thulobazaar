-- =============================================================================
-- purchase_history: append-only ledger of every purchase and every badge grant
-- =============================================================================
-- Why: ad_promotions cascades on ad delete, and payment_transactions /
-- ad_promotions / *_verification_requests all cascade on user delete, so today a
-- seller deleting an ad (5 real purchases, Rs 810, already lost on prod) or an
-- account erases the record of what they bought. The owner needs that history
-- to survive everything and still say WHO bought it.
--
-- How: database triggers write one row per event, so no code path (the 7
-- promotion insert paths, 3 badge-approval paths, hand-run SQL comps) can skip
-- it. Buyer identity and ad title are snapshotted at the moment of the event.
-- user_id / ad_id / payment_transaction_id are plain integers ON PURPOSE: no
-- foreign keys, so nothing ever cascades into this table.
--
-- Prisma cannot model triggers/functions; they exist only here (same precedent
-- as the partial unique index in 20260826000000_verification_unique_pending_only).
-- The table itself is mirrored in schema.prisma as model purchase_history.
--
-- Events:
--   event='payment'  one per payment_transactions row that reaches status='verified'
--   event='grant'    one per ad_promotions INSERT, one per badge grant on users
-- =============================================================================

CREATE TABLE "purchase_history" (
  "id"                     SERIAL PRIMARY KEY,
  "event"                  VARCHAR(16)   NOT NULL,
  "kind"                   VARCHAR(32)   NOT NULL,
  "user_id"                INTEGER       NOT NULL,
  "user_name"              VARCHAR(255),
  "user_phone"             VARCHAR(20),
  "user_email"             VARCHAR(255),
  "shop_slug"              VARCHAR(255),
  "ad_id"                  INTEGER,
  "ad_title"               VARCHAR(255),
  "promotion_type"         VARCHAR(20),
  "duration_days"          INTEGER,
  "label"                  VARCHAR(255),
  "amount"                 DECIMAL(10,2) NOT NULL DEFAULT 0,
  "payment_status"         VARCHAR(20)   NOT NULL DEFAULT 'free',
  "payment_gateway"        VARCHAR(20),
  "payment_method"         VARCHAR(50),
  "payment_transaction_id" INTEGER,
  "occurred_at"            TIMESTAMP(6)  NOT NULL,
  "expires_at"             TIMESTAMP(6),
  "source_table"           VARCHAR(40)   NOT NULL,
  "source_id"              INTEGER       NOT NULL,
  "created_at"             TIMESTAMP(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "purchase_history_event_check" CHECK ("event" IN ('payment', 'grant')),
  CONSTRAINT "purchase_history_source_unique" UNIQUE ("source_table", "source_id", "event", "occurred_at")
);

CREATE INDEX "idx_purchase_history_user_id"      ON "purchase_history"("user_id");
CREATE INDEX "idx_purchase_history_occurred_at"  ON "purchase_history"("occurred_at" DESC);
CREATE INDEX "idx_purchase_history_kind_event"   ON "purchase_history"("kind", "event");
CREATE INDEX "idx_purchase_history_payment_txn"  ON "purchase_history"("payment_transaction_id");

-- -----------------------------------------------------------------------------
-- Helpers
-- -----------------------------------------------------------------------------

-- payment_transactions.metadata is written with JSON.stringify() into a Json
-- column by every real gateway path, so prod stores a jsonb STRING scalar
-- (metadata->>'x' yields NULL). Mock/dev paths store an object. Normalise both.
CREATE OR REPLACE FUNCTION ledger_json(v jsonb) RETURNS jsonb
LANGUAGE plpgsql IMMUTABLE AS $$
BEGIN
  IF v IS NULL THEN RETURN '{}'::jsonb; END IF;
  IF jsonb_typeof(v) = 'object' THEN RETURN v; END IF;
  IF jsonb_typeof(v) = 'string' THEN
    BEGIN
      RETURN COALESCE((v #>> '{}')::jsonb, '{}'::jsonb);
    EXCEPTION WHEN others THEN
      RETURN '{}'::jsonb;
    END;
  END IF;
  RETURN '{}'::jsonb;
END $$;

CREATE OR REPLACE FUNCTION ledger_int(v text) RETURNS integer
LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE WHEN v ~ '^\d{1,9}$' THEN v::integer END
$$;

-- Resolve a promotion/request payment_reference to a VERIFIED transaction.
-- Express writes the gateway order id (TB_AD__...), the web callback writes the
-- numeric transaction id as text; accept both. The transaction must belong to
-- the same user and be for the same product: payment_reference is client-
-- writable on the web submit routes, so an unrelated (someone else's, or an ad
-- promotion's) verified transaction id must never turn a grant into 'paid'.
CREATE OR REPLACE FUNCTION ledger_verified_txn(ref text, p_user_id integer, p_type text) RETURNS integer
LANGUAGE sql STABLE AS $$
  SELECT t.id FROM payment_transactions t
   WHERE ref IS NOT NULL AND ref <> ''
     AND t.status = 'verified'
     AND t.user_id = p_user_id
     AND t.payment_type = p_type
     AND (t.transaction_id = ref OR t.id::text = ref)
   ORDER BY t.id DESC LIMIT 1
$$;

-- -----------------------------------------------------------------------------
-- Writers
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION ledger_record_payment(t payment_transactions) RETURNS void
LANGUAGE plpgsql AS $$
DECLARE
  m jsonb := ledger_json(t.metadata);
  u users%ROWTYPE;
BEGIN
  SELECT * INTO u FROM users WHERE id = t.user_id;
  INSERT INTO purchase_history (
    event, kind, user_id, user_name, user_phone, user_email, shop_slug,
    ad_id, ad_title, promotion_type, duration_days,
    amount, payment_status, payment_gateway, payment_transaction_id,
    occurred_at, source_table, source_id)
  VALUES (
    'payment', t.payment_type, t.user_id, u.full_name, u.phone, u.email,
    COALESCE(u.custom_shop_slug, u.shop_slug),
    CASE WHEN t.payment_type = 'ad_promotion' THEN COALESCE(t.related_id, ledger_int(m->>'adId')) END,
    CASE WHEN t.payment_type = 'ad_promotion' THEN
      LEFT(COALESCE(m->>'adTitle', regexp_replace(m->>'orderName', '^\w+ Promotion - ', '')), 255) END,
    m->>'promotionType',
    ledger_int(m->>'durationDays'),
    t.amount, 'paid', t.payment_gateway, t.id,
    COALESCE(t.verified_at, t.created_at, now()::timestamp), 'payment_transactions', t.id)
  ON CONFLICT ON CONSTRAINT purchase_history_source_unique DO NOTHING;
END $$;

CREATE OR REPLACE FUNCTION ledger_record_promotion(p ad_promotions) RETURNS void
LANGUAGE plpgsql AS $$
DECLARE
  u users%ROWTYPE;
  v_ad_title text;
  v_txn integer := ledger_verified_txn(p.payment_reference, p.user_id, 'ad_promotion');
BEGIN
  SELECT * INTO u FROM users WHERE id = p.user_id;
  SELECT title INTO v_ad_title FROM ads WHERE id = p.ad_id;
  INSERT INTO purchase_history (
    event, kind, user_id, user_name, user_phone, user_email, shop_slug,
    ad_id, ad_title, promotion_type, duration_days,
    amount, payment_status, payment_method, payment_transaction_id,
    occurred_at, expires_at, source_table, source_id)
  VALUES (
    'grant', 'ad_promotion', p.user_id, u.full_name, u.phone, u.email,
    COALESCE(u.custom_shop_slug, u.shop_slug),
    p.ad_id, LEFT(v_ad_title, 255), p.promotion_type, p.duration_days,
    p.price_paid,
    -- 'comped'   : staff granted it, nothing charged
    -- 'paid'     : a VERIFIED transaction backs it
    -- 'unpaid'   : a price was recorded but no verified payment exists (flags
    --              the payment-less web POST /api/promotions path)
    CASE WHEN p.price_paid = 0 THEN 'comped'
         WHEN v_txn IS NOT NULL THEN 'paid'
         ELSE 'unpaid' END,
    p.payment_method, v_txn,
    COALESCE(p.created_at, now()::timestamp), p.expires_at, 'ad_promotions', p.id)
  ON CONFLICT ON CONSTRAINT purchase_history_source_unique DO NOTHING;
END $$;

-- Badge grants are keyed on users.* because every approval path (Express editor,
-- Next admin, the direct PUT /api/verification/:userId/approve that sets ONLY the
-- status) writes there; the request row is optional. Payment facts come from the
-- request approved in the same flow, and 'paid' is honoured only when a verified
-- transaction backs it — the Express submit route trusts client-supplied
-- paymentStatus/paymentAmount, so the request alone cannot be believed.
CREATE OR REPLACE FUNCTION ledger_record_badge(u users, k text, occurred timestamp) RETURNS void
LANGUAGE plpgsql AS $$
DECLARE
  v_amount numeric(10,2) := 0;
  v_status text := 'free';
  v_ref text;
  v_label text;
  v_days integer;
  v_txn integer;
  v_expires timestamp;
  v_source_table text;
BEGIN
  IF k = 'business' THEN
    SELECT r.payment_amount, r.payment_status, r.payment_reference, r.business_name, r.duration_days
      INTO v_amount, v_status, v_ref, v_label, v_days
      FROM business_verification_requests r
     WHERE r.user_id = u.id AND r.status = 'approved'
       AND r.reviewed_at >= now() - interval '10 minutes'
     ORDER BY r.reviewed_at DESC LIMIT 1;
    v_label := COALESCE(v_label, u.business_name);
    v_expires := u.business_verification_expires_at;
    v_source_table := 'users_business';
  ELSE
    SELECT r.payment_amount, r.payment_status, r.payment_reference, r.full_name, r.duration_days
      INTO v_amount, v_status, v_ref, v_label, v_days
      FROM individual_verification_requests r
     WHERE r.user_id = u.id AND r.status = 'approved'
       AND r.reviewed_at >= now() - interval '10 minutes'
     ORDER BY r.reviewed_at DESC LIMIT 1;
    v_label := COALESCE(v_label, u.verified_seller_name, u.full_name);
    v_expires := u.individual_verification_expires_at;
    v_source_table := 'users_individual';
  END IF;

  v_txn := ledger_verified_txn(v_ref, u.id, k || '_verification');
  v_status := CASE
    WHEN v_txn IS NOT NULL THEN 'paid'
    WHEN COALESCE(v_status, 'free') = 'paid' THEN 'unverified'   -- claimed paid, no verified txn
    WHEN COALESCE(v_status, 'free') IN ('free', 'pending') THEN COALESCE(v_status, 'free')
    ELSE 'unknown' END;

  INSERT INTO purchase_history (
    event, kind, user_id, user_name, user_phone, user_email, shop_slug,
    label, duration_days, amount, payment_status, payment_transaction_id,
    occurred_at, expires_at, source_table, source_id)
  VALUES (
    'grant', k || '_verification', u.id, u.full_name, u.phone, u.email,
    COALESCE(u.custom_shop_slug, u.shop_slug),
    LEFT(v_label, 255), v_days, COALESCE(v_amount, 0), v_status, v_txn,
    occurred, v_expires, v_source_table, u.id)
  ON CONFLICT ON CONSTRAINT purchase_history_source_unique DO NOTHING;
END $$;

-- -----------------------------------------------------------------------------
-- Triggers
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION ledger_on_payment_verified() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'verified' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'verified') THEN
    PERFORM ledger_record_payment(NEW);
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_ledger_payment_verified
  AFTER INSERT OR UPDATE OF status ON payment_transactions
  FOR EACH ROW EXECUTE FUNCTION ledger_on_payment_verified();

CREATE OR REPLACE FUNCTION ledger_on_promotion_insert() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  PERFORM ledger_record_promotion(NEW);
  RETURN NEW;
END $$;

CREATE TRIGGER trg_ledger_promotion_insert
  AFTER INSERT ON ad_promotions
  FOR EACH ROW EXECUTE FUNCTION ledger_on_promotion_insert();

CREATE OR REPLACE FUNCTION ledger_on_user_badge() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.business_verification_status = 'approved'
     AND (OLD.business_verification_status IS DISTINCT FROM 'approved'
          OR NEW.business_verified_at IS DISTINCT FROM OLD.business_verified_at) THEN
    PERFORM ledger_record_badge(NEW, 'business',
      CASE WHEN NEW.business_verified_at IS DISTINCT FROM OLD.business_verified_at
           THEN COALESCE(NEW.business_verified_at, now()::timestamp) ELSE now()::timestamp END);
  END IF;

  IF NEW.individual_verified IS TRUE
     AND (OLD.individual_verified IS DISTINCT FROM TRUE
          OR NEW.individual_verified_at IS DISTINCT FROM OLD.individual_verified_at) THEN
    PERFORM ledger_record_badge(NEW, 'individual',
      CASE WHEN NEW.individual_verified_at IS DISTINCT FROM OLD.individual_verified_at
           THEN COALESCE(NEW.individual_verified_at, now()::timestamp) ELSE now()::timestamp END);
  END IF;
  RETURN NEW;
END $$;

-- Column list keeps the trigger off the hot path (last_login etc. never fire it).
CREATE TRIGGER trg_ledger_user_badge
  AFTER UPDATE OF business_verification_status, business_verified_at,
                  individual_verified, individual_verified_at ON users
  FOR EACH ROW EXECUTE FUNCTION ledger_on_user_badge();

-- -----------------------------------------------------------------------------
-- Backfill everything that exists today
-- -----------------------------------------------------------------------------

-- 1. Every verified payment (money received).
SELECT ledger_record_payment(t) FROM payment_transactions t WHERE t.status = 'verified';

-- 2. Every promotion entitlement still in the table.
SELECT ledger_record_promotion(p) FROM ad_promotions p;

-- 3. Purchases whose entitlement was cascaded away when the ad was deleted:
--    reconstruct the grant from the payment receipt so the history is whole.
INSERT INTO purchase_history (
  event, kind, user_id, user_name, user_phone, user_email, shop_slug,
  ad_id, ad_title, promotion_type, duration_days,
  amount, payment_status, payment_gateway, payment_method, payment_transaction_id,
  occurred_at, expires_at, source_table, source_id)
SELECT
  'grant', 'ad_promotion', t.user_id, u.full_name, u.phone, u.email,
  COALESCE(u.custom_shop_slug, u.shop_slug),
  COALESCE(t.related_id, ledger_int(m->>'adId')),
  LEFT(COALESCE(m->>'adTitle', regexp_replace(m->>'orderName', '^\w+ Promotion - ', '')), 255),
  m->>'promotionType', ledger_int(m->>'durationDays'),
  t.amount, 'paid', t.payment_gateway, 'online', t.id,
  COALESCE(t.verified_at, t.created_at),
  CASE WHEN ledger_int(m->>'durationDays') IS NOT NULL
       THEN COALESCE(t.verified_at, t.created_at) + (ledger_int(m->>'durationDays') * INTERVAL '1 day') END,
  'payment_transactions', t.id
FROM payment_transactions t
JOIN users u ON u.id = t.user_id
CROSS JOIN LATERAL ledger_json(t.metadata) m
WHERE t.status = 'verified' AND t.payment_type = 'ad_promotion'
  AND NOT EXISTS (SELECT 1 FROM ad_promotions p
                   WHERE p.user_id = t.user_id
                     AND (p.payment_reference = t.id::text OR p.payment_reference = t.transaction_id))
ON CONFLICT ON CONSTRAINT purchase_history_source_unique DO NOTHING;

-- 4. Every approved verification request (one grant per approval, so renewals
--    are separate rows). Only the newest grant per user+kind carries the live
--    expiry from users.*; older ones are superseded and carry none.
WITH grants AS (
  SELECT 'business' AS k, r.id, r.user_id, r.reviewed_at, r.payment_amount, r.payment_status,
         r.payment_reference, r.business_name AS label, r.duration_days,
         u.business_verification_expires_at AS live_expires,
         ROW_NUMBER() OVER (PARTITION BY r.user_id ORDER BY r.reviewed_at DESC) AS rn
    FROM business_verification_requests r JOIN users u ON u.id = r.user_id
   WHERE r.status = 'approved' AND r.reviewed_at IS NOT NULL
  UNION ALL
  SELECT 'individual', r.id, r.user_id, r.reviewed_at, r.payment_amount, r.payment_status,
         r.payment_reference, r.full_name, r.duration_days,
         u.individual_verification_expires_at,
         ROW_NUMBER() OVER (PARTITION BY r.user_id ORDER BY r.reviewed_at DESC)
    FROM individual_verification_requests r JOIN users u ON u.id = r.user_id
   WHERE r.status = 'approved' AND r.reviewed_at IS NOT NULL
)
INSERT INTO purchase_history (
  event, kind, user_id, user_name, user_phone, user_email, shop_slug,
  label, duration_days, amount, payment_status, payment_transaction_id,
  occurred_at, expires_at, source_table, source_id)
SELECT
  'grant', g.k || '_verification', g.user_id, u.full_name, u.phone, u.email,
  COALESCE(u.custom_shop_slug, u.shop_slug),
  LEFT(g.label, 255), g.duration_days, COALESCE(g.payment_amount, 0),
  CASE WHEN ledger_verified_txn(g.payment_reference, g.user_id, g.k || '_verification') IS NOT NULL THEN 'paid'
       WHEN g.payment_status = 'paid' THEN 'unverified'
       WHEN g.payment_status IN ('free', 'pending') THEN g.payment_status
       ELSE 'unknown' END,
  ledger_verified_txn(g.payment_reference, g.user_id, g.k || '_verification'),
  g.reviewed_at,
  CASE WHEN g.rn = 1 THEN g.live_expires END,
  g.k || '_verification_requests', g.id
FROM grants g JOIN users u ON u.id = g.user_id
ON CONFLICT ON CONSTRAINT purchase_history_source_unique DO NOTHING;

-- -----------------------------------------------------------------------------
-- Exclusion list: seed the two known production test/internal accounts, but only
-- where the ids really are those accounts, so another environment's unrelated
-- user 14 / 62 is never silently dropped from reports.
-- -----------------------------------------------------------------------------
DO $$
DECLARE ids text := '';
BEGIN
  IF EXISTS (SELECT 1 FROM users WHERE id = 14 AND phone = '9706657812') THEN
    ids := '14';
  END IF;
  IF EXISTS (SELECT 1 FROM users WHERE id = 62 AND email = 'bazaarlista@gmail.com') THEN
    ids := CASE WHEN ids = '' THEN '62' ELSE ids || ',62' END;
  END IF;
  IF ids <> '' THEN
    UPDATE site_settings
       SET setting_value = ids, updated_at = now()
     WHERE setting_key = 'financial_excluded_user_ids'
       AND COALESCE(setting_value, '') = '';
  END IF;
END $$;
