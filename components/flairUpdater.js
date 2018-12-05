const User = require('./../models/user');

let previousWinner = '';

const awardClasses = [
  'belowmindy',
  'abovemindy',
  'mindy',
  'hemsworthless',
  'best-person',
];

const stripAwardFlair = (flairs) => {
  return flairs.filter(flair => awardClasses.includes(flair) === false);
};

const flairUpdater = {
  update: () => {
    User.find({})
      .sort({ score: -1 })
      .exec((err, users) => {

        users.forEach((storedUser, index) => {
          // just we don't hit reddit's rate limiter
          setTimeout(() => {
            User.getFlair(storedUser.username)
              .then((flair) => {
                let flairClass = flair.flair_css_class;
                let flairArray = flair.flair_css_class !== null ? flairClass.split(' ') : [];
                flairArray = stripAwardFlair(flairArray);

                if (index === 0 || index === 1) {
                  flairArray.push(index === 0 ? 'best-person' : 'hemsworthless');
                } else {
                  switch (true) {
                    case storedUser.score > 0:
                      flairArray.push('abovemindy');
                      break;
                    case storedUser.score === 0:
                      flairArray.push('mindy');
                      break;
                    case storedUser.score < 0:
                      flairArray.push('belowmindy');
                      break;
                    default:
                      break;
                  }
                }

                flairClass = flairArray.join(' ');

                User.updateFlair(storedUser.username, flairClass, flair);
              });
          }, 2000);
        });
      });
  },

};

module.exports = flairUpdater;
