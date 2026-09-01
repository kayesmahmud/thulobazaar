-- Financial reports: user IDs to leave out of every revenue/purchase report.
--
-- Test/demo accounts are indistinguishable from real users in the schema (there is no
-- is_test flag, and they carry role='user' like anyone else), yet a single one can dominate
-- the totals: user 14 ("Dija Fashion Shop") alone accounts for Rs 5,200 of Rs 10,412 all-time
-- verified revenue and was confirmed by the owner as a test account.
--
-- Comma-separated list so the owner can edit it from the super-admin settings UI
-- (PUT /api/admin/site-settings only UPDATES existing keys, so the row must exist first).
-- Empty value = exclude nobody.
INSERT INTO "site_settings" ("setting_key", "setting_value", "setting_type", "description") VALUES
  ('financial_excluded_user_ids', '14', 'string', 'Comma-separated user IDs excluded from financial reports (test/demo accounts)')
ON CONFLICT ("setting_key") DO NOTHING;
