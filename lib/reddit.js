const snoowrap = require('snoowrap');

module.exports = () => {
  const config = {
    userAgent: 'GoodPlaceBot',
    clientId: process.env.ID,
    clientSecret: process.env.SECRET,
    username: process.env.USERNAME,
    password: process.env.PASS,
  };

  const r = new snoowrap(config);

  return r;
};
