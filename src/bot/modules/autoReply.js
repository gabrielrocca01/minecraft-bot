// src/bot/modules/autoReply.js

module.exports = function autoReplyModule(bot, { config }) {
    const settings = config.utils['auto-reply'];
  
    if (!settings || !settings.enabled) return;
  
    const trigger = settings['trigger-word'] || "bot";
    const replies = settings.replies || "Sono handicappato e non ho altre risposte da darti";
  
    console.log(`[MOD:auto-reply] Enabled with trigger "${trigger}"`);
  
    bot.on('chat', (username, message) => {
      if (username === bot.username) return;
  
      const lower = message.toLowerCase();
      if (!lower.includes(trigger.toLowerCase())) return;
  
      const reply = replies[Math.floor(Math.random() * replies.length)];

      reply = reply.replace('{user}', username);

      bot.chat(`${reply}`);
    });
  };
  