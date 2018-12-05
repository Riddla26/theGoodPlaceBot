const { CronJob } = require('cron');
const flairUpdater = require('./flairUpdater');

const cronString = '0 23 55 * * 6';

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
