export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: cors });
    }

    // Endpoint health
    if (url.pathname === '/') {
      return new Response(JSON.stringify({ ok: true, service: 'APKMillah.khoirulrosikin4' }), {
        headers: { ...cors, 'Content-Type': 'application/json' }
      });
    }

    // Proxy ke Apps Script
    if (url.pathname.startsWith('/api')) {
      const target = new URL(env.APPS_SCRIPT_URL);
      // Teruskan semua query
      url.searchParams.forEach((v, k) => target.searchParams.set(k, v));
      // Sisipkan token
      target.searchParams.set('token', env.BACKGROUND_TOKEN);

      // Ambil nilai parameter 'action' dari URL untuk keperluan log
      const action = url.searchParams.get('action') || 'tidak ada action';
      
      // 👇 KODE LOG DIMASUKKAN DI SINI 👇
      console.log('Action:', action, 'Token ok');

      const resp = await fetch(target.toString(), {
        method: request.method,
        headers: { 'Content-Type': 'application/json' },
        body: request.method === 'POST' ? await request.text() : undefined,
      });

      const text = await resp.text();
      return new Response(text, {
        status: resp.status,
        headers: { ...cors, 'Content-Type': 'application/json' }
      });
    }

    // Endpoint VAPID public key
    if (url.pathname === '/vapid-public') {
      return new Response(JSON.stringify({ key: env.VAPID_PUBLIC_KEY }), {
        headers: { ...cors, 'Content-Type': 'application/json' }
      });
    }

    return new Response('Not Found', { status: 404, headers: cors });
  }
};
