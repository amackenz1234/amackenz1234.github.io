// Nativ Cloud Mac — Apple Silicon + Xcode, hosted in the cloud.
//
// Leave compileEndpoint empty to use the built-in cloud Mac console
// (GitHub-hosted xcode-27 / full macOS 27 RC + Xcode 27). Point it at serverless/mac-xcode-worker.mjs
// to dispatch a real Actions job (see serverless/README.md).
window.NATIV_MAC_CONFIG = {
  // Local mock: "http://127.0.0.1:8788"
  // Deployed:  "https://nativ-cloud-mac.<you>.workers.dev"
  compileEndpoint: "",
  token: ""
};
