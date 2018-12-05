const { CronJob } = require('cron');
const flairUpdater = require('./flairUpdater');

const cronString = (process.env.DEV) ? '0 */10 * * * *' : '0 23 55 * * 6';
console.log('>>> cron string', cronString);
const jobRunner = {
  run: () => {
    const job = new CronJob({
      cronTime: cronString,
      onTick: flairUpdater.updateAllFlairs,
      start: false,
      timeZone: 'America/New_York',
    });

    job.start();
  },
};

module.exports = jobRunner;
