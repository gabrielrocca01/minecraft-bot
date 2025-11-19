const mineflayer = require('mineflayer');
const { Movements, pathfinder, goals: { GoalBlock } } = require('mineflayer-pathfinder');

function once(emitter, event) {
  return new Promise(resolve => emitter.once(event, resolve));
}

// task: { owner, type, amount, material }
function spawnWorkerBot(config, task, mainBot) {
  const baseName = config['bot-account'].username || 'Worker';
  const workerName = `${baseName}_${task.type}_${Math.floor(Math.random() * 10000)}`;

  const bot = mineflayer.createBot({
    username: workerName,
    host: config.server.ip,
    port: config.server.port,
    version: config.server.version,
    auth: config['bot-account'].type
  });

  bot.loadPlugin(pathfinder);

  bot.once('spawn', async () => {
    const mcData = require('minecraft-data')(bot.version);
    const move = new Movements(bot, mcData);

    const { owner, amount, material } = task;

    // 1) TP vicino al player che ha invocato (usando il bot principale OP)
    if (mainBot && owner) {
      mainBot.chat(`/tp ${bot.username} ${owner}`);
      console.log(`[worker ${bot.username}] richiesta TP a ${owner}`);
    }

    // aspetta che il TP avvenga
    await bot.waitForTicks(20);

    // questa è la "home" del worker (vicino al player)
    const homePos = bot.entity.position.clone();

    const itemData = mcData.itemsByName[material];
    const blockData = mcData.blocksByName[material];

    if (!itemData || !blockData) {
      bot.chat(`[${workerName}] Materiale "${material}" sconosciuto, esco.`);
      bot.quit('bad material');
      return;
    }

    const itemId = itemData.id;
    const blockId = blockData.id;

    function countItems() {
      return bot.inventory.items()
        .filter(i => i.type === itemId)
        .reduce((sum, i) => sum + i.count, 0);
    }

    try {
      bot.chat(`[${workerName}] Ciao ${owner}, sono qui. Vado a prendere ${amount} di ${material}.`);

      // 2) cerca blocchi del tipo richiesto nei dintorni
      let attempts = 0;
      const maxAttempts = 40;

      while (countItems() < amount && attempts < maxAttempts) {
        attempts++;

        const targetBlock = bot.findBlock({
          matching: b => b && b.type === blockId,
          maxDistance: 16,
          count: 1
        });

        if (!targetBlock) break;

        bot.pathfinder.setMovements(move);
        bot.pathfinder.setGoal(
          new GoalBlock(
            targetBlock.position.x,
            targetBlock.position.y,
            targetBlock.position.z
          )
        );

        await once(bot, 'goal_reached').catch(() => {});

        try {
          await bot.dig(targetBlock);
          await bot.waitForTicks(20);
        } catch (err) {
          console.error('[worker dig error]', err.message);
        }
      }

      const collected = countItems();

      // 3) torna alla home (vicino al player)
      bot.pathfinder.setMovements(move);
      bot.pathfinder.setGoal(
        new GoalBlock(
          Math.floor(homePos.x),
          Math.floor(homePos.y),
          Math.floor(homePos.z)
        )
      );
      await once(bot, 'goal_reached').catch(() => {});

      bot.chat(
        `[${workerName}] Sono tornato, ho ${collected} di ${material} per te, ${owner}.`
      );

      // 4) droppa gli item
      for (const item of bot.inventory.items()) {
        if (item.type === itemId) {
          try {
            await bot.tossStack(item);
          } catch (err) {
            console.error('[worker toss error]', err.message);
          }
        }
      }

      bot.chat(`[${workerName}] Task finito, mi disconnetto.`);
      bot.quit('task complete');
    } catch (err) {
      console.error('[worker fatal error]', err);
      bot.quit('error');
    }
  });

  bot.on('end', reason => {
    console.log(`[Worker ${workerName}] end:`, reason);
  });

  bot.on('error', err => {
    console.error(`[Worker ${workerName}]`, err);
  });
}

module.exports = { spawnWorkerBot };
