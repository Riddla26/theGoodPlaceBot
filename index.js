// includes
if (!process.env.DEV) {
  require('newrelic');
}

const express = require('express');
const snoowrap = require('snoowrap');
const snoostorm = require('snoostorm');
const async = require('async');

const db = require('./components/database');
const dbConfig = require('./config/database');

const Comment = require('./components/comment');
const User = require('./models/user');

const app = express();
const port = process.env.PORT || 8080;

// start up our db
db.init(dbConfig.url);

// reddit config
const sub = 'TheGoodPlace';
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
  const reset = comment.body.includes('!hitTheButtonMichael');
  const reply = comment.body.includes('!tellMeMyScore');

  console.log('>>> comment created');

  parser.processComment()
    .then((data) => {
      User.findOrCreate({ username: comment.author.name }, (err, user) => {
        const score = reset ? 0 : data.polarity + user.score;

        User.findOneAndUpdate({ _id: user._id }, { $set: { score } }, { new: true })
          .exec()
          .then((updatedUser) => {
            console.log('>>> updated user', updatedUser);
            // if the user wants to know how many points they have...
            if (reply) {
              const newScore = updatedUser.score;
              r.getComment(comment.id).reply(`You have ${newScore} points, ${comment.author.name}!`);
            }
          });
      });
    });
});

const fetchScoreboard = () => {
  async.parallel({
    highest: (callback) => {
      User.getTen(1, callback);
    },
    lowest: (callback) => {
      User.getTen(-1, callback);
    },
  }, (err, scoreboard) => {
    if (err) throw err;
    console.log('>>> scoreboard', scoreboard);
  });
};

// setup middleware
require('./middleware')(app);
// setup routes
require('./routes')(app, db, r);

app.listen(port, () => { console.log(`Now listening on port: ${port}`); });
