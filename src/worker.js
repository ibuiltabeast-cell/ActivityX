/**
 * Cloudflare Worker handler with Static Assets and optional KV Cloud Sync
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    // Health check endpoint
    if (url.pathname === '/api/health') {
      return new Response(
        JSON.stringify({
          status: 'ok',
          service: 'activity-tracker',
          edgeTimestamp: new Date().toISOString(),
          kvEnabled: Boolean(env.ACTIVITIES_KV)
        }),
        {
          headers: {
            ...CORS_HEADERS,
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store'
          }
        }
      );
    }

    // Cloudflare KV Cloud Sync API: GET /api/activities
    if (url.pathname === '/api/activities' && request.method === 'GET') {
      if (!env.ACTIVITIES_KV) {
        return new Response(
          JSON.stringify({
            synced: false,
            message: 'KV namespace not bound. Local storage will be used.'
          }),
          {
            headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
          }
        );
      }

      const stored = await env.ACTIVITIES_KV.get('user_activities', 'json');
      return new Response(
        JSON.stringify({
          synced: true,
          data: stored || []
        }),
        {
          headers: {
            ...CORS_HEADERS,
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
          }
        }
      );
    }

    // Cloudflare KV Cloud Sync API: POST /api/activities
    if (url.pathname === '/api/activities' && request.method === 'POST') {
      if (!env.ACTIVITIES_KV) {
        return new Response(
          JSON.stringify({
            synced: false,
            error: 'ACTIVITIES_KV binding is not configured in wrangler.toml'
          }),
          {
            status: 400,
            headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
          }
        );
      }

      try {
        const payload = await request.json();
        if (!Array.isArray(payload)) {
          return new Response(
            JSON.stringify({ error: 'Payload must be an array of activities' }),
            { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
          );
        }

        await env.ACTIVITIES_KV.put('user_activities', JSON.stringify(payload));
        return new Response(
          JSON.stringify({
            synced: true,
            count: payload.length,
            updatedAt: new Date().toISOString()
          }),
          {
            headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
          }
        );
      } catch (err) {
        return new Response(
          JSON.stringify({ error: 'Invalid JSON payload', details: err.message }),
          { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Serve static frontend assets from ASSETS binding
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response('Asset not found', { status: 404 });
  }
};
