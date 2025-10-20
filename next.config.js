const previewBaseUrl = process.env.NEXT_PUBLIC_PREVIEW_BASE_URL;
let previewDomain = null;

if (previewBaseUrl) {
  try {
    previewDomain = new URL(previewBaseUrl).hostname;
  } catch (error) {
    // Always log configuration errors for visibility to operators
    console.warn('[next.config] Invalid NEXT_PUBLIC_PREVIEW_BASE_URL:', previewBaseUrl, error);
  }
}

const imageDomains = ['qyycdduuadsofgabrgip.supabase.co'];
if (previewDomain && !imageDomains.includes(previewDomain)) {
  imageDomains.push(previewDomain);
}

const imgSrcDomains = [
  "'self'",
  "data:",
  "blob:",
  "https://qyycdduuadsofgabrgip.supabase.co",
  "https://*.stripe.com",
  "https://img.clerk.com",
];

if (previewDomain) {
  const previewUrl = `https://${previewDomain}`;
  if (!imgSrcDomains.includes(previewUrl)) {
    imgSrcDomains.push(previewUrl);
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: imageDomains,
  },
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY,
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' https://*.clerk.accounts.dev https://challenges.cloudflare.com https://js.stripe.com",
              "worker-src 'self' blob:",
              "child-src 'self' blob:",
              "style-src 'self' 'unsafe-inline'",
              `img-src ${imgSrcDomains.join(' ')}`,
              "font-src 'self' data:",
              "connect-src 'self' https://*.clerk.accounts.dev https://*.convex.cloud wss://*.convex.cloud https://api.openai.com https://api.stripe.com",
              "frame-src https://*.clerk.accounts.dev https://challenges.cloudflare.com https://js.stripe.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'self'",
              "upgrade-insecure-requests"
            ].join('; ')
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ]
      }
    ]
  }
}

module.exports = nextConfig
