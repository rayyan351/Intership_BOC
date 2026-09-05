// back-end/utils/revalidate.js
//
// The storefront (front-end) serves the home page and /api/menu-feed as
// ISR with a 1-hour cache. Without calling this after a write, admin edits
// to products/deals/sections/categories/settings are correct in the
// database immediately but invisible on the storefront for up to an hour.
//
// Failure here must never fail the admin request that triggered it — the
// write already succeeded — so this always resolves, never rejects.
const triggerRevalidation = async () => {
  if (!process.env.REVALIDATION_SECRET) {
    console.error('REVALIDATION_SECRET is not set — skipping storefront cache revalidation.');
    return;
  }

  try {
    const storefrontUrl = (process.env.FRONTEND_URL || 'http://localhost:3000').split(',')[0].trim();
    const response = await fetch(`${storefrontUrl}/api/revalidate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: '/',
        secret: process.env.REVALIDATION_SECRET,
      }),
    });
    if (!response.ok) {
      console.error(`ISR revalidation request failed: ${response.status} ${await response.text()}`);
    }
  } catch (err) {
    console.error('ISR revalidation error:', err.message);
  }
};

module.exports = { triggerRevalidation };
