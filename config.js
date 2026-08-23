// Orbit ERP - Supabase connection (publishable/anon key; safe in the browser, RLS enforces access)
window.APP_CONFIG = {
  SUPABASE_URL: "https://hlkwzbkgkwywomuvilwe.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_lp-wGR9RM2Ws-BvA-Z5XpQ_F_YZk1SW",
  // hCaptcha site key (public). MUST match the Supabase project's Auth captcha provider,
  // which is set to hCaptcha (Authentication -> Attack Protection) - same key the customer
  // /app uses. Cloudflare Turnstile tokens are rejected while the project is on hCaptcha.
  // Empty string = no captcha widget (auth still works only if the project has captcha off).
  HCAPTCHA_SITE_KEY: "0f5403a8-f876-4bb0-a52c-5f38615e25ee"
};
