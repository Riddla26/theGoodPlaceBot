// includes
const snoowrap = require('snoowrap');
const snoostorm = require('snoostorm');

// config
const sub = 'theGoodPlace';

const config = {
  userAgent: 'GoodPlaceBot',
  clientId: process.env.ID,
  clientSecret: process.env.SECRET,
  username: process.env.USERNAME,
  password: process.env.PASS,
};

const r = new snoowrap(config);
const client = new snoostorm(r);

const commentStream = client.CommentStream({
  subreddit: sub,
  results: 20,
  pollTime: 2000,
});

commentStream.on('comment', (comment) => {
  console.log('Comment:');
  console.log(comment);
});
