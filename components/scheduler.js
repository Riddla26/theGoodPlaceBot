const { CronJob } = require('cron');
const flairHandler = require('./flairHandler');

const cronString = (process.env.DEV) ? '0 */5 * * * *' : '0 25 20 * * 4';
console.log('>>> cronString', cronString);
const jobRunner = {
  run: () => {
    const job1 = new CronJob({
      cronTime: cronString,
      onTick: flairHandler.updateAllFlairs,
      start: false,
      timeZone: 'America/New_York',
    });

    // const job2 = new CronJob({
    //   cronTime: '0 0 */6 * * *',
    //   onTick: flairHandler.verifyAllFlairs,
    //   start: false,
    //   timeZone: 'America/New_York',
    // });

    job1.start();
    // job2.start();
  },
};

module.exports = jobRunner;
