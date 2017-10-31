'use strict';
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const Rigger = require('../index');

const templateDir = path.resolve(__dirname, '../template');
fs.readdirSync(templateDir).forEach(dir => {
  Rigger.add(dir, path.join(templateDir, dir));
});

console.log(chalk.green('默认脚手架，配置完成'));
