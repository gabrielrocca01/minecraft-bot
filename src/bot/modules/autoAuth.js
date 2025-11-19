module.exports = function autoAuthModule(bot, { config }) {
    const settings = config.utils['auto-auth'];
    if (!settings || !settings.enabled) return;
  
    let pendingPromise = Promise.resolve();
  
    function sendRegister(password) {
      return new Promise((resolve, reject) => {
        bot.chat(`/register ${password} ${password}`);
        console.log('[Auth] Sent /register');
  
        bot.once('chat', (username, message) => {
          if (message.includes('successfully registered')) resolve();
          else if (message.includes('already registered')) resolve();
          else reject(new Error('Registration failed: ' + message));
        });
      });
    }
  
    function sendLogin(password) {
      return new Promise((resolve, reject) => {
        bot.chat(`/login ${password}`);
        console.log('[Auth] Sent /login');
  
        bot.once('chat', (username, message) => {
          if (message.includes('successfully logged in')) resolve();
          else reject(new Error('Login failed: ' + message));
        });
      });
    }
  
    bot.once('spawn', () => {
      console.log('[MOD:auto-auth] enabled');
  
      const password = settings.password;
      pendingPromise = pendingPromise
        .then(() => sendRegister(password))
        .then(() => sendLogin(password))
        .catch(err => console.error('[Auth ERROR]', err.message));
    });
  };