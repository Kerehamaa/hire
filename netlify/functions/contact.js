export default async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  try {
    const data = await req.json();
    const { name, email, package: pkg, message } = data;

    if (!name || !email || !message) {
      return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400 });
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
      console.error('Missing Telegram env vars');
      return new Response(JSON.stringify({ error: 'Server config error' }), { status: 500 });
    }

    const text = `🔔 New enquiry from hire site\n\n` +
      `👤 Name: ${name}\n` +
      `📧 Email: ${email}\n` +
      `📦 Package: ${pkg || 'Not selected'}\n` +
      `💬 Message:\n${message}`;

    const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
      }),
    });

    if (!tgRes.ok) {
      console.error('Telegram error:', await tgRes.text());
      return new Response(JSON.stringify({ error: 'Failed to send notification' }), { status: 500 });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Function error:', err);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
};
