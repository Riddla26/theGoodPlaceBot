const User = require('./../models/user');

const awardClasses = [
  'belowmindy',
  'abovemindy',
  'mindy',
  'hemsworthless',
  'best-person',
];

const stripPreviousAwardFlair = (flairs) => {
  return flairs.filter(flair => awardClasses.includes(flair) === false);
};

const awardNewAwardFlair = (user, flairs, index) => {
  if (index === 0 || index === 1) {
    flairs.push(index === 0 ? 'best-person' : 'hemsworthless');
  } else {
    switch (true) {
      case user.score > 0:
        flairs.push('abovemindy');
        break;
      case user.score === 0:
        flairs.push('mindy');
        break;
      case user.score < 0:
        flairs.push('belowmindy');
        break;
      default:
        break;
    }
  }

  return flairs;
};

const updateFlair = (user, index) => {
  User.getFlair(user.username)
    .then((flair) => {
      let flairClass = flair.flair_css_class;
      let flairArray = flair.flair_css_class !== null ? flairClass.split(' ') : [];
      flairArray = stripPreviousAwardFlair(flairArray);
      flairArray = awardNewAwardFlair(user, flairArray, index);
      flairClass = flairArray.join(' ');

      User.updateFlair(user.username, flairClass, flair);
    });
};

const flairUpdater = {
  updateAllFlairs: () => {
    User.find({})
      .sort({ score: -1 })
      .exec((err, users) => {
        users.forEach((storedUser, index) => {
          // just we don't hit reddit's rate limiter
          setTimeout(() => {
            updateFlair(storedUser, index);
          }, 2000);
        });
      });
  },
};

module.exports = flairUpdater;
