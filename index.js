// includes
if (!process.env.DEV) {
  require('newrelic');
}

const express = require('express');
const snoostorm = require('snoostorm');

const db = require('./lib/database');
const dbConfig = require('./config/database');

const Comment = require('./components/comment');
const Reply = require('./components/reply');
const User = require('./models/user');
const r = require('./lib/reddit')();
const jobRunner = require('./lib/scheduler');

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
  results: 20,
  pollTime: 10000,
});

const isExempt = (author) => {
  const exempt = [
    'AutoModerator',
    'AccountingBot',
    'WandersFar',
    'TheEnzyteGuy',
    'BioregenerativeLamp'
  ];

  return exempt.includes(author); 
};

commentStream.on('comment', async (comment) => {
  if (isExempt(comment.author.name)) {
    return;
  }
  
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
          const botReply = new Reply(comment.id);
          botReply.replyToComment(rankedUser);
        }
      });
  });
});

const removeDuplicates = (lastBatch, posts, start) => {
  return posts.filter((post) => {
    return lastBatch.every(a => a.id !== post.id) && post.created_utc >= start / 1000;
  });
};

const startSubmissionStream = () => {
  let lastBatch = [];
  const start = Date.now();
  // const pattern = /[S]\d{1,2}[E]\d{1,2}/g;

  setInterval(() => {
    r.getSubreddit(process.env.SUB)
      .getNew({ limit: 10 })
      .then((posts) => {
        const newPosts = removeDuplicates(lastBatch, posts, start);

        lastBatch = posts;

        newPosts.forEach((post) => {
          if (post.title.includes('Episode Discussion')) {
            const botReply = new Reply(post.id);
            botReply.replyWithLeaderboard();
          }
          
          // if (!post.title.match(pattern)) {
          //   const botReply = new Reply(post.id);
          //   botReply.replyWithDeduction(post.author.name)
          // }
        });
      });
  }, 5000);
};

startSubmissionStream();

// setup middleware
require('./middleware')(app);
// setup routes
require('./routes')(app, db, r);

app.listen(port, () => { console.log(`ENV-DEV:${process.env.DEV}: Now listening on port: ${port}`); });
