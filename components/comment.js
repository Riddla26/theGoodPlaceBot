const unified = require('unified');
const sentiment = require('retext-sentiment');
const english = require('retext-english');
const profanities = require('retext-profanities');
const intensify = require('retext-intensify');
const vfile = require('to-vfile');
const reporter = require('vfile-reporter-json');
const fs = require('fs');

const curseSubs = [
  'fork',
  'shirtball',
];

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

class Comment {
  constructor(body, id) {
    this.body = body;
    this.id = id;
    this.path = `./comments/comment_${this.id}.txt`;
  }

  createFile() {
    return new Promise((resolve) => {
      fs.writeFile(this.path, this.body, { flag: 'w' }, (err) => {
        if (err) throw err;
  
        resolve();
      });
    });
  }

  deleteFile() {
    return new Promise((resolve) => {
      fs.unlink(this.path, (err) => {
        if (err) throw err;
        resolve();
      });
    });
  }

  scoreComment(tree, warnings) {
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
      const occurences = countOccurences(this.body, curseSub);
      weightedPoints += (occurences * 5);
    });

    data.polarity = weightedPoints;

    return data;
  }

  analyzeComment() {
    return new Promise((resolve) => {
      const file = vfile.readSync(this.path);
      const tree = processor.parse(file);
  
      processor.run(tree, file);
  
      // generate report for profanity, etc.
      const report = reporter([file]);
      const [first] = JSON.parse(report);
      const { messages } = first;
  
      const data = this.scoreComment(tree.data, messages);
  
      resolve({ data, path: this.path });
    });
  }

  processComment() {
    return new Promise((resolve) => {
      let data = {};

      this.createFile(this.body)
        .then(() => this.analyzeComment(this.path, this.body))
        .then((_data) => {
          ({ data } = _data);
        })
        .then(() => this.deleteFile())
        .then(() => {
          resolve(data);
        })
        .catch((err) => { throw err; });
    });
  }
}

module.exports = Comment;
