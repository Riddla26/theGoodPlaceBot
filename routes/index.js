const User = require('./../models/user');

module.exports = (app, db, r) => {
  app.get('/', (req, res) => {
    User.find({})
      .sort({ score: -1 })
      .exec((err, users) => {
        const scoredUsers = users.filter(user => user.score !== 0);
        res.json(scoredUsers);
      });
  });

  app.route('/user/:username')
    .get((req, res) => {
      const regExName = new RegExp(req.params.username, 'i');
      User.findOne({ username: { $regex: regExName } })
        .exec()
        .then((existingUser) => {
          if (!existingUser) {
            return User.verifyRedditUserExists(req.params.username, true)
              .then(redditUser => redditUser);
          }
          return existingUser;
        })
        .then((user) => {
          if (user.error) {
            return res.json(user.error);
          }

          User.getOverallRank(user)
            .then(completeUser => res.json(completeUser));
        });
    })
    .post((req, res) => {
      if (!req.body.key || req.body.key !== process.env.POSTKEY) {
        return res.json({ error: 'Incorrect key provided' });
      }

      const { score } = req.body;
      const { username } = req.params;

      User.verifyRedditUserExists(username, true)
        .then((redditUser) => {
          if (redditUser.error) {
            return res.json(redditUser.error);
          }

          User.findOneAndUpdate({ username: redditUser.username }, { $set: { score } }, { new: true, upsert: true })
            .exec()
            .then(updatedUser => res.json(updatedUser))
            .catch(err => res.json(err));
        });
    });
};
