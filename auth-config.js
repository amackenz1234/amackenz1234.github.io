// Nativ Apple account SMS verification config.
//
// Real texts require the serverless function in ./serverless/apple-sms.mjs
// (see serverless/README.md). Set smsEndpoint to that function's public URL.
// Optionally set `phone` (E.164 or 10-digit) so codes go to your number automatically.
window.NATIV_AUTH_CONFIG = {
  // Local mock: "http://127.0.0.1:8787"
  // Deployed:  "https://nativ-apple-sms.<you>.workers.dev"
  smsEndpoint: "",
  phone: ""
};
