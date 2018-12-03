// includes
const snoowrap = require('snoowrap');
const snoostorm = require('snoostorm');
const Comment = require('./components/comment');
const db = require('./components/database');
const dbConfig = require('./config/database');
const User = require('./models/user');

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

commentStream.on('comment', (comment) => {
  const parser = new Comment(comment.body, comment.id);
  
  parser.processComment()
    .then((data) => {
      User.findOrCreate({ username: comment.author.name }, (err, user) => {
        const score = data.polarity + user.score;

        User.findOneAndUpdate({ _id: user._id }, { $set: { score } }, { new: true })
          .exec()
          .then((updatedUser) => {
            console.log('>>> updatedUser', updatedUser);
          });
      });
    });
});
