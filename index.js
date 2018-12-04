// includes
if (!process.env.DEV) {
  require('newrelic');
}

const express = require('express');
const Snoostorm = require('snoostorm');
const async = require('async');

const db = require('./components/database');
const dbConfig = require('./config/database');

const Comment = require('./components/comment');
const User = require('./models/user');
const r = require('./lib/reddit')();

const app = express();
const port = process.env.PORT || 8080;

// start up our db
db.init(dbConfig.url);

// reddit config
const sub = 'TheGoodPlace';

// reddit wrappers
const client = new Snoostorm(r);

const commentStream = client.CommentStream({
  subreddit: sub,
  results: 20,
  pollTime: 2000,
});

commentStream.on('comment', (comment) => {
  const parser = new Comment(comment.body, comment.id);
  const reset = comment.body.includes('!hitTheButtonMichael');
  const reply = comment.body.includes('!tellMeMyScore');
  const replyString = (score, name) => {
    return `You have ${score} points, ${name}! \n\n This is an automated reply. You can view my code [here](https://github.com/rjschill87/theGoodPlaceBot).`;
  };

  console.log('>>> comment created');

  parser.processComment()
    .then((data) => {
      const regExName = new RegExp(comment.author.name, 'i');
      User.findOrCreate({ username: { $regex: regExName } }, (err, user) => {
        const score = reset ? 0 : data.polarity + user.score;

        User.findOneAndUpdate({ _id: user._id }, { $set: { score } }, { new: true })
          .exec()
          .then((updatedUser) => {
            // if the user wants to know how many points they have...
            if (reply) {
              r.getComment(comment.id).reply(replyString(score, updatedUser.username));
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
