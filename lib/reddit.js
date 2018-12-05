const snoowrap = require('snoowrap');
const snoostorm = require('snoostorm');

module.exports = () => {
  const config = {
    userAgent: 'GoodPlaceBot',
    clientId: process.env.ID,
    clientSecret: process.env.SECRET,
    username: process.env.USERNAME,
    password: process.env.PASS,
  };

  const r = new snoowrap(config);
  const client = new snoostorm(r);

  return { r, client };
};
