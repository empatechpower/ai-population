/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Proxies Firebase Auth's redirect-flow helper files through our own
  // domain. Without this, the hidden auth iframe lives on
  // rogier-bc197.firebaseapp.com — a different origin than
  // ai-population.com — and browsers that block third-party storage
  // (Safari by default, Chrome increasingly) silently drop the auth
  // result, so getRedirectResult() returns null and Google sign-in just
  // bounces back to the landing page with no error. Serving these paths
  // from our own domain makes the iframe same-origin.
  async rewrites() {
    return [
      {
        source: "/__/auth/:path*",
        destination: "https://rogier-bc197.firebaseapp.com/__/auth/:path*",
      },
      {
        source: "/__/firebase/:path*",
        destination: "https://rogier-bc197.firebaseapp.com/__/firebase/:path*",
      },
    ]
  },
}

module.exports = nextConfig
