module.exports = function autoSleepModule(bot, { mcData, defaultMove, GoalBlock }) {
    console.log('[MOD:auto-sleep] enabled');
  
    function isNight() {
      // Minecraft: 0–24000 tick; notte circa da 13000 a 23000
      const t = bot.time.timeOfDay;
      return t >= 13000 && t <= 23000;
    }
  
    async function goSleep() {
      if (bot.isSleeping) return;
  
      // cerca un letto vicino
      const bed = bot.findBlock({
        matching: (block) => {
          const data = mcData.blocks[block.type];
          if (!data) return false;
          return data.name.includes('bed'); // in 1.12 è "bed"
        },
        maxDistance: 32,
        count: 1
      });
  
      if (!bed) {
        console.log('[auto-sleep] Nessun letto trovato nelle vicinanze.');
        return;
      }
  
      console.log('[auto-sleep] Letto trovato a', bed.position);
  
      bot.pathfinder.setMovements(defaultMove);
      bot.pathfinder.setGoal(
        new GoalBlock(bed.position.x, bed.position.y, bed.position.z)
      );
  
      await new Promise((resolve) => {
        bot.once('goal_reached', resolve);
      }).catch(() => {});
  
      try {
        await bot.sleep(bed);
        console.log('[auto-sleep] Sto dormendo...');
      } catch (err) {
        console.error('[auto-sleep] Errore nel dormire:', err.message);
      }
    }
  
    async function wakeUp() {
      if (!bot.isSleeping) return;
      try {
        await bot.wake();
        console.log('[auto-sleep] Mi sono svegliato.');
      } catch (err) {
        console.error('[auto-sleep] Errore nello svegliarsi:', err.message);
      }
    }
  
    bot.on('time', () => {
      if (isNight()) {
        goSleep();
      } else {
        wakeUp();
      }
    });
  };
  