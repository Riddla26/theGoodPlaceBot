const r = require('./../lib/reddit')();
const User = require('../models/user');

const scoreString = (user) => {
  return new Promise((resolve) => {
    User.count({})
      .then((userCount) => {
        const reply = `You have ${user.score} points, ${user.username}! \n\n That puts you about... rank ${user.rank} out of ${userCount}. Hm. Not what I expected. \n\n This is an automated reply.`;
        resolve(reply);
      });
  });
};

const fetchScoreboard = () => {
  return new Promise((resolve) => {
    User.find({})
      .sort({ score: -1 })
      .limit(10)
      .exec((err, users) => {
        resolve(users);
      });
  });
};

const leaderboardPost = (users) => {
  let replyString = '||Neighborhood Rankings||\n:---:|---|---\n';

  users.forEach((user, index) => {
    const rank = index + 1;
    const userString = `${rank}|${user.username}|${user.score}\n`;
    replyString += userString;
  });

  return replyString;
};

class Reply {
  constructor(id) {
    this.id = id;
  }

  async replyToComment(user) {
    const reply = await scoreString(user);
    r.getComment(this.id)
      .reply(reply);
  }

  replyWithLeaderboard() {
    fetchScoreboard()
      .then((users) => {
        User.resetScores();
        const reply = leaderboardPost(users);
        
        r.getSubmission(this.id)
          .reply(reply)
          .distinguish({ status: true, sticky: true });
      });
  }

  replyWithDeduction(username) {
    User.findOrCreate(username, (err, user) => {
      const score = user.score - 75;
      User.findOneAndUpdate({ _id: user._id }, { $set: { score } }, { new: true })
        .exec()
        .then(() => {
          const reply = `You have been deducted 75 points for posting a title without a scope.`;
          r.getSubmission(this.id)
            .reply(reply)
            .distinguish({ status: true, sticky: true });
        });
    });
  }
}

module.exports = Reply;
