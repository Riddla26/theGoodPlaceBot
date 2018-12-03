// includes
const snoowrap = require('snoowrap');
const snoostorm = require('snoostorm');
const Comment = require('./components/comment');
const db = require('./components/database');
const dbConfig = require('./config/database');

// start up our db
db.init(dbConfig.url);

// reddit config
const sub = 'theGoodPlace';
const config = {
  userAgent: 'GoodPlaceBot',
  clientId: process.env.ID,
  clientSecret: process.env.SECRET,
  username: process.env.USERNAME,
  password: process.env.PASS,
};

// reddit wrappers
const r = new snoowrap(config);
const client = new snoostorm(r);

const commentStream = client.CommentStream({
  subreddit: sub,
  results: 20,
  pollTime: 2000,
});

const flairUser = (score, commentObj) => {
  const polarity = score.polarity !== undefined;

  if (polarity) {
    const newScore = commentObj.currentScore + score.polarity;

    const flair = {
      subredditName: sub,
      text: 'Placeholder text here...',
      cssClass: newScore,
    };

    // r.getUser(commentObj.author).assignFlair(flair);
    console.log(`${commentObj.author} scored ${newScore} points!`);
  }
};

commentStream.on('comment', (comment) => {
  // const commentObj = {
  //   author: comment.author.name,
  //   currentScore: parseInt(comment.author_flair_css_class) || 0,
  // };

  const parser = new Comment(comment.body, comment.id);
  parser.processComment()
    .then((score) => {
      console.log('>>> score', score);
    });
});
