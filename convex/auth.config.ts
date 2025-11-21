if (!process.env.CLERK_JWT_ISSUER_DOMAIN) {
  throw new Error(
    'Missing CLERK_JWT_ISSUER_DOMAIN environment variable. ' +
    'Set this to your Clerk domain (e.g., "https://clerk.example.com") ' +
    'for Convex auth integration to work.'
  );
}

export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
      applicationID: "convex",
    },
  ]
};
