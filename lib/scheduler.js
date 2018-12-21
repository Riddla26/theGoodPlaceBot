const { CronJob } = require('cron');
const flairHandler = require('./flairHandler');
const Reply = require('../components/reply');

const defaultString = (process.env.DEV) ? '0 */5 * * * *' : '0 30 21 * * 4';

const jobRunner = {
  run: () => {
    const job1 = new CronJob({
      cronTime: defaultString,
      onTick: flairHandler.updateAllFlairs,
      start: false,
      timeZone: 'America/New_York',
    });

    const job2 = new CronJob({
      cronTime: '0 0 */6 * * *',
      onTick: flairHandler.verifyAllFlairs,
      start: false,
      timeZone: 'America/New_York',
    });

    const job3 = new CronJob({
      cronTime: '0 30 21 * * 4',
      onTick: () => {
        const post = new Reply();

        post.postLeaderboardWiki();
        post.postLeaderboardTopic();
      },
    });

    job1.start();
    job2.start();
    job3.start();
  },
};

module.exports = jobRunner;
