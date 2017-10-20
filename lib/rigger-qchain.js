'use strict';
const co = require('co');
const chalk = require('chalk');
const coPrompt = require('co-prompt');
const prompt = coPrompt;
const confirm = coPrompt.confirm.bind(coPrompt);

function isEmpty(value) {
  return value === '' || value == void 0;
}

class RiggerQchain {
  constructor(prefix, parentResult) {
    // 前缀啦~
    this.prefix = prefix || '';
    // 复层的值
    this.parentResult = parentResult || {};

    // 结果
    this.result = {};

    // 问题
    this.questionMap = {};
    this.questionList = [];
    // 分流
    this.flowMap = {};
  }

  getDefaultResult() {
    const prefix = this.prefix;
    let result = {};
    if (prefix) {
      this.parentResult[prefix] = result;
    } else {
      result = this.parentResult;
    }
    return result;
  }

  *run(key) {
    this.result = this.getDefaultResult();
    const firstKey = key || this.questionList[0];
    yield this.ask(firstKey);
    return this.result;
  }

  *ask(key) {
    const opts = this.questionMap[key];
    if (!opts) { return; }

    let question = this.buildQuestion(opts);
    if (!question) {
      throw new Error(`${key} 缺少问题配置`);
    }

    question = `qus: ${question}\nanw: `;

    let value = null;
    switch (opts.type) {
      case 'input':
      case 'radio':
      case 'confirm':
        value = yield prompt(question);
        break;
    }
    value = (value == void 0 ? '' : value).toString().trim();

    if (this.isLegal(value, opts) == false) {
      console.log(chalk.red('输入不符合预期，请重新输入\n'));
      yield this.ask(key);
      return;
    }

    // 保留一个换行
    console.log('');

    if (isEmpty(value) && opts.default) {
      value = opts.default || '';
    } else if (opts.type == 'radio') {
      value = this.queryRadioChoiceValue(value, opts);
    } else if (opts.type == 'confirm') {
      value = this.queryConfirmValue(value, opts);
    }

    this.result[key] = value;

    // 分流判定
    const ctx = this;
    let shouldGoOn = true;
    if (opts.distribute) {
      yield new Promise((resolve, reject) => {
        let hadRun = false;
        opts.distribute(function() {
          if (hadRun) { return; }
          hadRun = true;

          const args = [].slice.call(arguments, 0);
          const key = args[0];
          const length = args.length;
          const carryOnCurrentFlow = !!args[1];

          // 1. 没有参数，继续往下走
          // 2. 一个参数，在当前流中，寻找问题
          // 3. 两个参数，在新的流中，开战问题
          // 3.1 参数为 ('xxx', false)，则新的流中，问完后，不回到当前流中
          // 3.2 参数为 ('xxx', true)，则新的流中，问完后，回到当前流中
          // 3.3 参数为 ('xxx.yyy', true|false)，则在新的流中，寻找到对应的子问题，开展询问

          co(function*() {
            if (length <= 0) {
              shouldGoOn = true;
            } else if (length == 1) {
              shouldGoOn = false;
              yield ctx.ask(opts._nextKey);
            } else {
              shouldGoOn = carryOnCurrentFlow;
              // 运行新的流...
              const map = ctx.flowMap;
              const list = key.split('.');
              const chain = map[list[0]];
              if (!chain) {
                return reject(new Error(`新的分流 "${list[0]}" 并没有配置`));
              }
              if (list.length <= 1) {
                yield chain.run();
              } else {
                yield chain.run(list[1]);
              }
            }
            resolve();
          });

        }, value, this.parentResult);
      });
    }

    if (shouldGoOn && opts._nextKey) {
      yield ctx.ask(opts._nextKey);
    }

    return;
  }

  /*
    * @param [String] key 问题的唯一 id，将会作为结果的 key 值
    * @param [String] opts 问题配置，选项:
    *   {
    *     required: 是否必要，默认true,
    *     default: 默认值，仅在 required = false 时生效,
    *     message: '问题文本',
    *     type: 输入类型，有: input[默认]/radio[配合choices使用]/confirm[结果为true|false] 三类
    *     expect: 预期结果，例如: [0, 1, 2] 或 正则 , 如果不是预期结果，自动重新提问，默认没有
    *     choices: 选择列表，例如: [ { message: '标准环境', value: 'standard' }, { message: '线上环境', value: 'online' }, { message: '自定义环境', value: 'none' } ]，如果不配置 value，默认是 0, 1, 2..
    *              如果配置了 choices，强制把 expect 更改为 [1, 2, 3] 这样的列表
    *     distribute: 分发函数，如果想要根据之前的输入，更改下一个问题，
    *                 可定义此函数: distribute(next, value, opts)，value 是当前的值，opts 已经输入问题的所有值， next() 木有参数则往下执行，next(key) 跳转到 key 的问题
    *   }
  */
  add(key, opts) {
    if (!opts.message || !key) {
      throw new Error(`必须设置问题id，以及 message 字段~ \n${key}\n${JSON.stringify(opts || {}, null, 2)}`);
    }
    const item = this.questionMap[key] = Object.assign({ type: 'input', required: true }, opts);
    this.questionList.push(key);

    // 修正 radio 的
    if (item.type == 'radio') {
      if (!item.choices) { throw new Error(`${key} -> type:radio 必须配置 choices 列表`); }
      if (item.expect) { throw new Error(`${key} -> type:radio 禁止配置 expect 参数`); }

      const list = [];
      item.choices.forEach((o, i) => { list.push(i + 1); });
      item.expect = list;
    }

    const length = this.questionList.length;
    if (length > 1) {
      const lastKey = this.questionList[length - 2];
      this.questionMap[lastKey]._nextKey = key;
    }
    // console.log(chalk.blue('add:', chalk.red(key || '')));
  }

  // 分流，新增一个对象
  flow(key) {
    const chain = new RiggerQchain(key, this.parentResult);
    this.flowMap[key] = chain;
    return chain;
  }

  // 结果合法吗？
  isLegal(value, opts) {
    if (opts.required == false) {
      return true;
    }
    if (isEmpty(value)) {
      return false;
    }

    value = value.toString().trim();

    // expect 应该是正则，或者数组
    const expect = opts.expect;
    if (expect) {
      if (expect instanceof RegExp) {
        return expect.test(value);
      } else {
        return !!expect.find(v => v == value);
      }
    }

    return true;
  }

  // 构建问题
  buildQuestion(opts) {
    if (!opts || !opts.message) { return ''; }

    if (opts.choices) {
      let q = opts.message;
      opts.choices.forEach((o, i) => {
        q += `\n  ${i + 1}. ${o.message}`;
      });
      return q;
    }
    return opts.message;
  }

  // 获取 Opts.type = 'radio' 的值
  queryRadioChoiceValue(value, opts) {
    const list = opts.choices;
    for (let i = 0, max = list.length; i < max; i++) {
      const item = list[i];
      // 控制台显示的值，比实际所以大 1
      if ((i + 1) == value) {
        return ('value' in item) ? item.value : value;
      }
    }
    return value;
  }

  // 获取 opts.type = confirm 的值
  queryConfirmValue(value, opts) {
    value = (value || '').trim().toLowerCase();
    return (!value || value == 0 || value == 'false' || value == 'no' || value == 'null') ? false : true;
  }
}

module.exports = RiggerQchain;
