// includes
if (!process.env.DEV) {
  require('newrelic');
}

const express = require('express');
const async = require('async');
const snoostorm = require('snoostorm');

const db = require('./components/database');
const dbConfig = require('./config/database');

const Comment = require('./components/comment');
const User = require('./models/user');
const r = require('./lib/reddit')();
const jobRunner = require('./components/scheduler');

const app = express();
const port = process.env.PORT || 8080;

// start up our db
db.init(dbConfig.url);

// run our weekly awards
jobRunner.run();

// reddit wrappers
const client = new snoostorm(r);
const commentStream = client.CommentStream({
  subreddit: process.env.SUB,
  results: 25,
  pollTime: 10000,
});

commentStream.on('comment', async (comment) => {
  const parser = new Comment(comment.body, comment.id);
  const processedComment = await parser.processComment();
  // const reset = comment.body.includes('!hitTheButtonMichael');
  const reset = false;
  const reply = comment.body.includes('!tellMeMyScore');
  const replyString = (user) => {
    return `You have ${user.score} points, ${user.username}! \n\n That puts you about... rank ${user.rank}. Hm. No what I expected. \n\n This is an automated reply. You can view my code [here](https://github.com/rjschill87/theGoodPlaceBot).`;
  };

  User.findOrCreate(comment.author.name, (err, user) => {
    const score = reset ? 0 : parseInt(processedComment.polarity) + parseInt(user.score);

    User.findOneAndUpdate({ _id: user._id }, { $set: { score } }, { new: true })
      .exec()
      .then((updatedUser) => User.getOverallRank(updatedUser))
      .then((rankedUser) => {
        if (reply) {
          r.getComment(comment.id)
            .reply(replyString(rankedUser));
        }
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

app.listen(port, () => { console.log(`ENV-DEV:${process.env.DEV}: Now listening on port: ${port}`); });
