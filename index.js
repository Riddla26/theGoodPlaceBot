// includes
const snoowrap = require('snoowrap');
const snoostorm = require('snoostorm');
const unified = require('unified');
const sentiment = require('retext-sentiment');
const english = require('retext-english');
const profanities = require('retext-profanities');
const intensify = require('retext-intensify');
const vfile = require('to-vfile');
const reporter = require('vfile-reporter-json');
const fs = require('fs');

// config
const sub = 'politics';

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

const curseSubs = [
  'fork',
  'shirtball',
];

// comment processing
const processor = unified()
  .use(english)
  .use(sentiment)
  .use(profanities)
  .use(intensify);

const countOccurences = (string, value) => {
  const reg = new RegExp(value, 'g');
  const count = (string.match(reg) || []).length;

  return count;
};

const scoreComment = (tree, warnings, comment) => {
  const data = tree.polarity !== undefined ? tree : { polarity: 0 };
  let weightedPoints = data.polarity >= 0 ? data.polarity * 5 : data.polarity;

  // see if we have any warnings for profanity, etc.
  if (warnings && warnings.length > 0) {
    warnings.forEach((warning) => {
      switch (true) {
        case (warning.source === 'retext-intensify'):
          weightedPoints += -1;
          break;
        case (warning.source === 'retext-profanity'):
          weightedPoints += -3;
          break;
        default:
          break;
      }
    });
  }

  // award points if they use a sub instead of cursing, like the show
  curseSubs.forEach((curseSub) => {
    const occurences = countOccurences(comment, curseSub);
    weightedPoints += (occurences * 5);
  });

  data.polarity = weightedPoints;

  return data;
};

const analyzeComment = (path, body) => {
  return new Promise((resolve) => {
    const file = vfile.readSync(path);
    const tree = processor.parse(file);

    processor.run(tree, file);

    // generate report for profanity, etc.
    const report = reporter([file]);
    const [first] = JSON.parse(report);
    const { messages } = first;

    const data = scoreComment(tree.data, messages, body);

    resolve({ data, path });
  });
};

const createFile = (text, id) => {
  return new Promise((resolve) => {
    const path = `./comments/comment_${id}.txt`;
    fs.writeFile(path, text, { flag: 'w' }, (err) => {
      if (err) throw err;

      resolve(path);
    });
  });
};

const deleteFile = (path) => {
  return new Promise((resolve) => {
    fs.unlink(path, (err) => {
      if (err) throw err;
      resolve();
    });
  });
};

const processComment = (body, id) => {
  return new Promise((resolve) => {
    let data = {};
    let path;

    createFile(body, id)
      .then(filepath => analyzeComment(filepath, body))
      .then((_data) => {
        ({ data, path } = _data);
      })
      .then(() => deleteFile(path))
      .then(() => {
        resolve(data);
      })
      .catch((err) => { throw err; });
  });
};

const flairUser = (score, commentObj) => {
  const polarity = score.polarity !== undefined;

  if (polarity) {
    const newScore = commentObj.currentScore + score.polarity;

    const flair = {
      subredditName: sub,
      text: 'Placeholder text here...',
      cssClass: newScore,
    };

    r.getUser(commentObj.author).assignFlair(flair);
    // console.log(`${commentObj.author} scored ${newScore} points!`);
  }
};

commentStream.on('comment', (comment) => {
  const commentObj = {
    author: comment.author.name,
    currentScore: parseInt(comment.author_flair_css_class) || 0,
  };

  processComment(comment.body, comment.id)
    .then(score => flairUser(score, commentObj))
    .catch((err) => { throw err; });
});
