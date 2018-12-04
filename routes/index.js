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
      console.log('>>> req username', req.params.username);
      User.findOne({ username: req.params.username })
        .exec((err, user) => {
          if (user) {
            res.json(user);
          } else {
            User.verifyRedditUserExists(req.params.username, true)
              .then(redditUser => res.json(redditUser));
          }
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

          User.findOneAndUpdate({ username }, { $set: { score } }, { new: true, upsert: true })
            .exec()
            .then(updatedUser => res.json(updatedUser))
            .catch(err => res.json(err));
        });
    });
};
