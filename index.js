'use strict';
const co = require('co');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const Rigger = require('./lib/rigger');
const coPrompt = require('co-prompt');

const FILE_NAME_DATA = 'template.data';


/**
 * 读取配置文件 template.data
 * @return {[{dir:String, key:String, keywords:Array, description:String}]}
*/
function readConf() {
  const content = fs.readFileSync(path.resolve(__dirname, `./${FILE_NAME_DATA}`)).toString();
  let result = [];
  try {
    // result = [ {key: 'xxx', dir: 'E://test/xxx', keywords: [], description: '' } ]
    result = JSON.parse(content || '[]');
  } catch (e) {
    console.log(chalk.red('读取配置文件出错，配置将自动清空'));
  }
  return result;
}
exports.readConf = readConf;


/**
 * 重写配置
 * @param {Array} list 配置列表
*/
function writeConf(list) {
  fs.writeFileSync(path.resolve(__dirname, `./${FILE_NAME_DATA}`), JSON.stringify(list));
}
exports.writeConf = writeConf;


/**
 * 检查模板目录的必要文件
 * @param {String} dir 需要检测的目录
 * @return [Boolean]
*/
function hasNecessaryFiles(dir) {
  const filepathSrc = path.join(dir, './src');
  const filepathMeta = path.join(dir, './meta.js');

  return fs.existsSync(filepathSrc) &&
    fs.existsSync(filepathMeta);
}


/**
 * 启动脚手架
 * @param {String} key 脚手架的key值，或者是路径
 * @param {String} targetDir 脚手架编译后，放置的目录
*/
exports.template = function(key, targetDir) {
  // 目标目录，默认为: process.cwd()
  // 1. key = 绝对路径，则使用该路径作为模板
  // 2. key = 相对路径，以 . 开头的，或包含 / 的，都当作相对路径，没话好说的~
  // 3. key 不是路径，则从配置中读取链接
  if (!key) {
    throw new Error('不能缺少key参数');
  }

  let dir = '';
  if (path.isAbsolute(key)) {
    dir = key;
  } else if (/^\.|\//.test(key)) {
    dir = path.resolve(process.cwd(), key);
  } else {
    const list = readConf();
    const data = list.find(data => data.key == key);
    if (data) {
      dir = data.dir;
    }
  }

  if (!dir || !fs.existsSync(dir)) {
    throw new Error(`模板: ${key} 所在目录: ${dir} 不存在`);
  }

  if (hasNecessaryFiles(dir) == false) {
    throw new Error(`目录:${dir} 缺少模板的必要文件，具体请看文档`);
  }

  const filepathMeta = path.join(dir, './meta.js');


  // 默认编译目录，是当前命令的运行目录
  // 源码目录，是 ${dir}/src 目录
  targetDir = targetDir || process.cwd();
  const srcDir = path.resolve(dir, './src');

  return co(function*() {
    const rigger = new Rigger();

    const meta = require(filepathMeta);
    const metaFn = meta.question || function() {};
    yield rigger.ask(metaFn);
    process.stdin.pause();
    console.log(chalk.green('所有参数如下:'));
    console.log(JSON.stringify(rigger.result, null, 2));

    console.log(chalk.green('准备构建项目..'));
    const buildFn = meta.build || function() {};
    yield rigger.build(buildFn, srcDir, targetDir);
    console.log(chalk.green('构建完成~'));
  }).catch(e => {
    console.error(chalk.red(e ? e.stack || e : e));
  });
};


/**
 * 添加脚手架到全局配置中
 * @param {String} key 脚手架的唯一id
 * @param {String} templateDir 脚手架放置在哪个目录下
*/
exports.add = function(key, templateDir) {
  // 检查目录下，是否存在 meta.js 和 build.js
  const dir = path.resolve(process.cwd(), templateDir);

  // 检查
  const filepathMeta = path.join(dir, './meta.js');

  if (hasNecessaryFiles(dir) == false) {
    throw new Error(`目录:${dir} 缺少模板的必要文件，具体请看文档`);
  }

  const meta = require(filepathMeta);
  const keywords = meta.keywords || [];
  const description = meta.description || '';
 

  const list = readConf();
  const data = list.find(item => item.key == key);

  // 已经存在配置，则覆盖以前的配置，否则，在最后插入一份新的配置
  if (data) {
    data.dir = dir;
    data.keywords = keywords;
    data.description = description;
  } else {
    list.push({ key, dir, keywords, description })
  }

  writeConf(list);
};


/**
 * 移除全局脚手架
 * @param {String} key 脚手架唯一id
*/
exports.remove = function(key) {
  // 从 template.data 中，删模板
  const list = readConf();

  // 寻找 key 所在的索引
  let index = -1;
  for (let i = 0, max = list.length; i < max; i++) {
    let data = list[i];
    if (data.key == key) {
      index = i;
      break;
    }
  }

  if (index >= 0) {
    list.splice(index, 1);
    writeConf(list);
  }
};


/**
 * 脚手架是否在全局配置中
 * @param {String} key 脚手架唯一id
 * @return [Boolean]
*/
exports.exist = function(key) {
  const list = readConf();
  const data = list.find(item => item.key == key);
  if (data) {
    return true;
  }

  return false;
};


/**
 * 预览现有的全局脚手架信息，将自动打开浏览器
*/
exports.browser = function(port) {
  // 打开浏览器，查看所有模板的简介
  require('./lib/browser').open(port);
};
