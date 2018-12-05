const { CronJob } = require('cron');
const flairUpdater = require('./flairUpdater');

const jobRunner = {
  run: () => {
    const job = new CronJob({
      cronTime: '0 23 55 * * 6',
      onTick: flairUpdater.updateAllFlairs,
      start: false,
      timeZone: 'America/New_York',
    });

    job.start();
  },
};

module.exports = jobRunner;
