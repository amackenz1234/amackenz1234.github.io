// appcompiler.ai Apple account SMS verification config.
//
// By default appcompiler.ai uses a built-in browser OTP so linking works on GitHub Pages
// with no backend. For real carrier texts, deploy serverless/apple-sms.mjs and
// set smsEndpoint to that worker URL (see serverless/README.md).
window.NATIV_AUTH_CONFIG = {
  // "" = built-in OTP (always configured on static hosting)
  // Deployed worker, e.g. "https://nativ-apple-sms.<you>.workers.dev"
  smsEndpoint: "",

  // Optional default destination (E.164 or 10-digit). Leave empty to ask in the sheet.
  phone: "",

  // When using built-in OTP (no smsEndpoint), show the code once in the 2FA sheet
  // so verification can complete without a carrier SMS provider.
  previewSms: true
};
