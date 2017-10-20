'use strict';
const co = require('co');
const chalk = require('chalk');
const prompt = require('co-prompt');

function formatQuestion(question, index) {
  index = index || 0;
  const arr = new Array(index + 1);
  const result = question.replace(/\[([^\]]+?)\]/g, (str, key) => {
    return chalk.bold.green(str);
  });
  return arr.join('-') + ' ' + result + ': ';
}

function* autoAsk(list, conf, index) {
  let item = list.shift();
  while (item) {
    let text = null;
    if (item.question) {
      text = yield prompt(formatQuestion(item.question, index));

      if (item.isValid && !item.isValid(text)) {
        continue;
      }

      if (item.key) {
        conf[item.key] = text;
      }
    }

    if (item.distribute) {
      let childQuestions = item.distribute(text, conf);
      if (childQuestions && childQuestions.length > 0) {
        yield autoAsk(childQuestions, conf, index + 1);
      }
    }

    item = list.shift();
  }
}

co(function*() {
  const conf = { };
  const list = [
    {
      key: 'siteType',
      question: '电脑端[1] 还是 手机端[2]',
      isValid: (answer) => (/1|2/.test(answer)),
      distribute: () => { return []; },
      install: () => { return {}; }
    }
  ];


  yield autoAsk(list, conf, 0);

  console.log(conf);

  process.stdin.pause();
}).catch(e => console.log(e));
