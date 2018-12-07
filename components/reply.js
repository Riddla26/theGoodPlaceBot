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

  replyToPost() {
    fetchScoreboard()
      .then((users) => {
        const reply = leaderboardPost(users);
        r.getSubmission(this.id)
          .reply(reply)
          .distinguish({ status: true, sticky: true });
      });
  }
}

module.exports = Reply;
