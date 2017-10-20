'use strict';
const fs = require('fs-extra');
const path = require('path');
const minimatch = require('minimatch');

/** https://github.com/fex-team/fis3/blob/master/lib/util.js
 *
 * 模拟linux glob文法实现，但()为捕获匹配模式
 * @param  {String} pattern 符合fis匹配文法的正则串
 * @param  {String} str     待匹配的字符串
 * @param  {Object} options 匹配设置参数  @see minimatch.makeRe
 * @return {Boolean|RegExp}         若str参数为String则返回str是否可被pattern匹配
 *                                  若str参数不为String，则返回正则表达式
 *
 * @example
 *  glob('*.js') => RegExp
 *  glob('*.js', 'mm.js') => true
 *  glob('*.js', 'test/mm.js') => false
 *  glob('**.js', 'mm.js') => true
 *  glob('**.js', 'test/mm.js') => true
 */
function glob(pattern, str, options) {
  var regex;

  // 由于minimatch提供的glob支持中()语法不符合fis glob的需求，因此只针对()单独处理
  var hasBracket = ~pattern.indexOf('(');


  // 当用户配置 *.js 这种写法的时候，需要让其命中所有所有目录下面的。
  // if (/^(\(*?)(?!\:|\/|\(|\*\*)(.*)$/.test(pattern)) {
  //   pattern = '**/' + pattern;
  // }

  var special = /^(\(+?)\*\*/.test(pattern);

  // support special global star
  // 保留原来的 **/ 和 /** 用法，只扩展 **.ext 这种用法。
  pattern = pattern.replace(/\*\*(?!\/|$)/g, '\uFFF0gs\uFFF1');
  if (hasBracket) {
    if (special) {
      pattern = pattern.replace(/\(/g, '\uFFF0/').replace(/\)/g, '/\uFFF1');
    } else {
      pattern = pattern.replace(/\(/g, '\uFFF0').replace(/\)/g, '\uFFF1');
    }
  }

  regex = minimatch.makeRe(pattern, options || {
    matchBase: true,
    // nocase: true
  });

  pattern = regex.source;
  pattern = pattern.replace(/\uFFF0gs\uFFF1/g, '(?!\\.)(?=.).*');

  if (hasBracket) {
    if (special) {
      pattern = pattern.replace(/\uFFF0\\\//g, '(').replace(/\\\/\uFFF1/g, ')');
    } else {
      pattern = pattern.replace(/\uFFF0/g, '(').replace(/\uFFF1/g, ')');
    }
  }

  regex = new RegExp(pattern, regex.ignoreCase ? 'i' : '');

  if (typeof str === 'string') {
    return regex.test(str);
  }

  return regex;
}

/**
 * 查找目录下，所有非快捷方式的文件
 * @param {String} dir 需要查找的绝对路径目录
 * @param {Null|String} root 根路径的绝对路径
 * @return {Array} 匹配的文件相对路径列表
 *
 * @example
 *  readAllFiles('xxx/dir') => ['a.js', 'b.txt', 'test/c.css', ...]
 */
function readAllFiles(dir, root) {
  dir = path.resolve(process.cwd(), dir);
  const result = [];

  if (fs.existsSync(dir)) {
    const stat = fs.statSync(dir);
    if (stat.isSymbolicLink() == true) {
      // nothing..
    } else if (stat.isFile()) {
      if (!root) {
        result.push(path.basename(dir));
      } else {
        result.push(path.relative(root, dir));
      }
    } else if (stat.isDirectory()) {
      // 读取目录
      //  -> 文件，加入到 result 中
      //  -> 目录，遍历，并且结果加入 result 中
      if (!root) {
        root = dir;
      }

      fs.readdirSync(dir).forEach(filepath => {
        const list = readAllFiles(path.resolve(dir, filepath), root);
        result.push.apply(result, list);
      });
    }
  } else {
    throw new Error(`找不到目录: ${dir}`);
  }

  return result.sort();
}

/**
 * 查找 dir 目录下，
 * @param  {String} dir   要查找的目录
 * @param  {Array} patterns 按匹配的 glob 列表，查找出所有文件，如果 glob 表达式，以 ! 开头，即表示取反[不匹配这些文件]
 * @param  {Object} options 匹配的参数，{ absolute: false 返回绝对路径 }
 * @return {Array} 匹配的文件路径
 *
 * @example
 *  find('xxx/dir/test', ['*.js', '**.css', '!test.js'], { absolute: false }) => ['a.js', 'xxx/test/mm.css', 'xxx.js']
 */
function find(dir, patterns, options) {
  dir = path.resolve(process.cwd(), dir);
  options = Object.assign({ absolute: false }, options || {});

  const includePatterns = []; // 包含的表达式
  const excludePatterns = []; // 排除的表达式
  let result = [];

  patterns.forEach(pattern => {
    if (pattern.indexOf('!') == 0) {
      excludePatterns.push(pattern.slice(1));
    } else {
      includePatterns.push(pattern);
    }
  });

  const fileList = readAllFiles(dir);

  fileList.forEach(filepath => {
    for (let i = 0, max = includePatterns.length; i < max; i++) {
      let newpath = filepath.replace(/\\/g, '/');
      let isMatch = glob(includePatterns[i], newpath);
      if (isMatch) {
        return result.push(filepath);
      }
    }
  });

  result = result.filter(filepath => {
    for (let i = 0, max = excludePatterns.length; i < max; i++) {
      let newpath = filepath.replace(/\\/g, '/');
      let isMatch = glob(excludePatterns[i], newpath);
      if (isMatch) {
        return false;
      }
    }
    return true;
  });

  if (options.absolute) {
    result = result.map(filepath => {
      return path.join(dir, filepath);
    });
  }

  return result.sort();
};

// @test
// console.log(find('../test', ['*.js', '**.css', '!meta.js'], { absolute: false }));
// console.log(glob('**.js', 'a/a.js'))
// console.log('xyq/sjkj/h.js'.replace(glob('(**).js'), '$1/mmm.js'));
// console.log(glob('(**)/jquery.js', 'mm/test/jquery.js'));

module.exports = {
  glob,
  find,
  readAllFiles,
};
