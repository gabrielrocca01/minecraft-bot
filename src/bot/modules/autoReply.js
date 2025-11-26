module.exports = function autoReplyModule(bot, { config }) {
  const settings = config.utils['auto-reply'];
  if (!settings || !settings.enabled) return;

  const trigger = settings['trigger-word'] || "bot";
  const replies = settings.replies || ["Sono handicappato e non ho altre risposte da darti"];
  const cooldownMs = settings['cooldown-ms'] || 2000;

  console.log(`[MOD:auto-reply] Enabled with trigger "${trigger}"`);

  let lastReplyAt = 0;

  bot.on('chat', (username, message) => {
    if (username === bot.username || message.includes('help') || username.includes('Bot')) return;
    if (message.toLowerCase().startsWith('bot ')) return;

    
    const now = Date.now();
    if (now - lastReplyAt < cooldownMs) return;

    const lower = message.toLowerCase();
    if (!lower.includes(trigger.toLowerCase())) return;

    if (!replies.length) return;

    // scegli una reply random
    let reply = replies[Math.floor(Math.random() * replies.length)];

    // sostituisci {user} col nome del giocatore
    reply = reply.replace('{user}', username);

    bot.chat(reply);

    lastReplyAt = now;
  });
};
