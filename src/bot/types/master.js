module.exports = {
    commands: ['help', 'test', 'spawn'],
  
    getHelp() {
      return [
        'help – mostra questo elenco',
        'test – il bot risponde',
        'spawn miner <quantità> <materiale> – crea un worker miner che ti porta il materiale'
      ];
    },
  
    async handleCommand({ bot, username, cmd, args, spawnWorkerBot }) {
      if (cmd === 'test') {
        bot.chat(`Eccomi ${username}, il comando test funziona.`);
        return;
      }
  
      if (cmd === 'spawn') {
        const type = (args[0] || '').toLowerCase();
  
        if (!type) {
          bot.chat('Uso: bot spawn miner <quantità> <materiale>');
          return;
        }
  
        if (type !== 'miner') {
          bot.chat('Per ora supporto solo il tipo "miner".');
          return;
        }
  
        const amount = parseInt(args[1] || '10', 10);
        const material = (args[2] || 'dirt').toLowerCase();
  
        if (isNaN(amount) || amount <= 0) {
          bot.chat('La quantità deve essere un numero positivo.');
          return;
        }
  
        bot.chat(`Creo un worker miner che verrà teletrasportato da te, ${username}.`);
  
        spawnWorkerBot({
          owner: username,
          type: 'miner',
          amount,
          material
        });
  
        return;
      }
  
      bot.chat(`Comando "${cmd}" non riconosciuto.`);
    }
  };
  