module.exports = function chatMessagesModule(bot, { config }) {
    const settings = config.utils['chat-messages'];
    if (!settings || !settings.enabled) return;
  
    bot.once('spawn', () => {
      console.log('[MOD:chat-messages] enabled');
      const messages = settings.messages || [];
  
      if (!messages.length) return;
  
      if (settings.repeat) {
        const delay = (settings['repeat-delay'] || 60) * 1000;
        let i = 0;
        setInterval(() => {
          bot.chat(messages[i]);
          i = (i + 1) % messages.length;
        }, delay);
      } else {
        messages.forEach(msg => bot.chat(msg));
      }
    });
  };