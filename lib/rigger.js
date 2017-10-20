'use strict';
const co = require('co');
const chalk = require('chalk');
const RiggerQchain = require('./rigger-qchain');
const RiggerBuilder = require('./rigger-builder');

class Rigger {
  constructor() {
    this.result = {};
  }

  *ask(runFn) {
    const qchain = new RiggerQchain();
    const ctx = this;
    return co(function*() {
      console.log(chalk.green.bold('请在回答完成前，不要关闭窗口'));
      yield runFn(qchain);
      ctx.result = yield qchain.run();
    });
  }

  *build(runFn, srcDir, targetDir) {
    if (!targetDir) {
      targetDir = process.cwd();
    }

    const ctx = this;
    const builder = new RiggerBuilder(srcDir, targetDir, this.result || {});
    return co(function*() {
      yield runFn(builder, ctx.result);
    });
  }
}

module.exports = Rigger;
