module.exports = function antiAfkModule(bot, { config }) {
    const settings = config.utils['anti-afk'];
    if (!settings || !settings.enabled) return;
  
    bot.once('spawn', () => {
      console.log('[MOD:anti-afk] enabled');
      bot.setControlState('jump', true);
      if (settings.sneak) {
        bot.setControlState('sneak', true);
      }
    });
  };
  