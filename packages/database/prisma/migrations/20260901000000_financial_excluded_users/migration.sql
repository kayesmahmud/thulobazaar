-- Financial reports: user IDs to leave out of every revenue/purchase report.
--
-- Test/demo accounts are indistinguishable from real users in the schema (there is no
-- is_test flag, and they carry role='user' like anyone else), yet a single one can dominate
-- the totals. Which IDs are test accounts is environment-specific, so this migration only
-- creates the row with an EMPTY value (= exclude nobody). After deploy, the owner sets the
-- list from Super Admin > Settings > General > Reports ("Excluded test accounts").
--
-- Comma-separated list of positive user IDs, e.g. '14, 27'.
INSERT INTO "site_settings" ("setting_key", "setting_value", "setting_type", "description") VALUES
  ('financial_excluded_user_ids', '', 'string', 'Comma-separated user IDs excluded from financial reports (test/demo accounts)')
ON CONFLICT ("setting_key") DO NOTHING;
