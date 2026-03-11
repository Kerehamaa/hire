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
    const chatId = process.env.TELEGRAM_GROUP_ID || process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
      console.error('Missing Telegram env vars');
      return new Response(JSON.stringify({ error: 'Server config error' }), { status: 500 });
    }

    const text = `🔔 New enquiry from hire site\n\n` +
      `👤 Name: ${name}\n` +
      `📧 Email: ${email}\n` +
      `📦 Package: ${pkg || 'Not selected'}\n` +
      `💬 Message:\n${message}`;

    // Send to group chat
    const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
    });

    if (!tgRes.ok) {
      console.error('Telegram error:', await tgRes.text());
      return new Response(JSON.stringify({ error: 'Failed to send notification' }), { status: 500 });
    }

    // Also notify Miles bot directly
    const milesToken = process.env.MILES_BOT_TOKEN;
    const milesChat = process.env.MILES_CHAT_ID;
    if (milesToken && milesChat) {
      await fetch(`https://api.telegram.org/bot${milesToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: milesChat, text: `[hire.kerehama.nz]\n\n${text}`, parse_mode: 'HTML' }),
      }).catch(() => {});
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
