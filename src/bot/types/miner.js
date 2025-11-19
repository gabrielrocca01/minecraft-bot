// src/bot/types/miner.js

function once(emitter, event) {
    return new Promise(resolve => emitter.once(event, resolve));
  }
  
  function countItems(bot, itemId) {
    return bot.inventory.items()
      .filter(i => i.type === itemId)
      .reduce((sum, item) => sum + item.count, 0);
  }
  
  async function gatherAndBring(username, amount, materialNameIt, context) {
    const { bot, mcData, defaultMove, GoalBlock, config } = context;
  
    const player = bot.players[username];
    if (!player || !player.entity) {
      bot.chat(` Non ti vedo, ${username}. Avvicinati.`);
      return;
    }
  
    // Posizione "home" (dove tornerà alla fine)
    const homePos = player.entity.position.clone();
  
    // Mappa italiano -> nome MC (es. "terra" -> "dirt")
    const matMap = (config.utils['materials-map']) || {};
    const mcName = matMap[materialNameIt] || materialNameIt; // fallback: usa direttamente
  
    const itemData = mcData.itemsByName[mcName];
    const blockData = mcData.blocksByName[mcName];
  
    if (!itemData || !blockData) {
      bot.chat(` Non conosco il materiale "${materialNameIt}" (${mcName}).`);
      return;
    }
  
    const itemId = itemData.id;
    const blockId = blockData.id;
  
    bot.chat(` Ok ${username}, provo a portarti ${amount} di ${materialNameIt}.`);
  
    let attempts = 0;
    const maxAttempts = 30;
  
    while (countItems(bot, itemId) < amount && attempts < maxAttempts) {
      attempts++;
  
      // Cerca un blocco del tipo giusto intorno al bot
      const block = bot.findBlock({
        matching: b => b && b.type === blockId,
        maxDistance: 16,
        count: 1
      });
  
      if (!block) {
        bot.chat(' Non trovo altro materiale qui vicino.');
        break;
      }
  
      // Vai verso il blocco
      bot.pathfinder.setMovements(defaultMove);
      bot.pathfinder.setGoal(new GoalBlock(
        block.position.x,
        block.position.y,
        block.position.z
      ));
  
      try {
        await once(bot, 'goal_reached');
      } catch {
        // se fallisce, pazienza, riproviamo
      }
  
      // Scava
      try {
        await bot.dig(block);
        // aspetta un attimo per raccogliere gli item
        await bot.waitForTicks(20);
      } catch (err) {
        console.error('[miner] dig error:', err.message);
        // prova col prossimo blocco
      }
    }
  
    const collected = countItems(bot, itemId);
  
    if (collected === 0) {
      bot.chat(` Non sono riuscito a raccogliere ${materialNameIt}, ${username}.`);
      return;
    }
  
    // Torna "a casa"
    bot.pathfinder.setMovements(defaultMove);
    bot.pathfinder.setGoal(new GoalBlock(
      Math.floor(homePos.x),
      Math.floor(homePos.y),
      Math.floor(homePos.z)
    ));
  
    try {
      await once(bot, 'goal_reached');
    } catch {}
  
    bot.chat(` Sono tornato, ho ${collected} di ${materialNameIt}. Te li butto a terra.`);
  
    // Droppa tutti gli item del tipo richiesto
    for (const item of bot.inventory.items()) {
      if (item.type === itemId) {
        try {
          await bot.tossStack(item);
        } catch (err) {
          console.error('[miner] toss error:', err.message);
        }
      }
    }
  }
  
  module.exports = {
    async handleCommand(username, cmd, args, context) {
      const { bot } = context;
  
      // Comando: "bot scava"
      if (cmd === 'scava') {
        const player = bot.players[username];
        if (!player || !player.entity) {
          bot.chat(` Non ti vedo, ${username}. Avvicinati.`);
          return true;
        }
  
        const pos = player.entity.position.offset(0, -1, 0);
        const block = bot.blockAt(pos);
  
        if (!block || block.name === 'air') {
          bot.chat(` Non c'è nulla da scavare sotto di te, ${username}.`);
          return true;
        }
  
        try {
          await bot.dig(block);
          bot.chat(` Ho scavato sotto di te, ${username}.`);
        } catch (err) {
          console.error('[miner] dig error:', err.message);
          bot.chat(' Non riesco a scavare lì.');
        }
  
        return true;
      }
  
      // Comando: "bot tunnel [lunghezza]"
      if (cmd === 'tunnel') {
        const len = parseInt(args[0] || '5', 10);
        const player = bot.players[username];
  
        if (!player || !player.entity) {
          bot.chat(` Non ti vedo, ${username}. Avvicinati.`);
          return true;
        }
  
        const dir = player.entity.yaw;
        const dx = Math.round(Math.sin(dir));
        const dz = Math.round(Math.cos(dir));
  
        bot.chat(` Scavo un tunnel di ${len} blocchi davanti a te, ${username}.`);
  
        for (let i = 1; i <= len; i++) {
          const pos = player.entity.position.offset(dx * i, 0, dz * i);
          const block = bot.blockAt(pos);
  
          if (block && block.name !== 'air') {
            try {
              await bot.dig(block);
            } catch (err) {
              console.error('[miner] tunnel dig error:', err.message);
              bot.chat(' Problemi a scavare il tunnel, mi fermo.');
              break;
            }
          }
        }
  
        bot.chat(' Tunnel completato (più o meno).');
        return true;
      }
  
      // Comando: "bot portami <quantità> <materiale>"
      if (cmd === 'portami') {
        const amount = parseInt(args[0] || '10', 10);
        const materialNameIt = (args[1] || 'terra').toLowerCase();
  
        if (isNaN(amount) || amount <= 0) {
          bot.chat(' Quanta roba ti devo portare? Usa: bot portami <numero> <materiale>');
          return true;
        }
  
        await gatherAndBring(username, amount, materialNameIt, context);
        return true;
      }
  
      // comando non gestito da miner
      return false;
    }
  };
  