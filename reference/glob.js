/** https://github.com/fex-team/fis3/blob/master/lib/util.js
 * 
 * 模拟linux glob文法实现，但()为捕获匹配模式
 * @param  {String} pattern 符合fis匹配文法的正则串
 * @param  {String} str     待匹配的字符串
 * @param  {Object} options 匹配设置参数  @see minimatch.makeRe
 * @return {Boolean|RegExp}         若str参数为String则返回str是否可被pattern匹配
 *                                  若str参数不为String，则返回正则表达式
 * @memberOf fis.util
 * @name glob
 * @function
 */
_.glob = function(pattern, str, options) {
  var regex;

  // 由于minimatch提供的glob支持中()语法不符合fis glob的需求，因此只针对()单独处理
  var hasBracket = ~pattern.indexOf('(');


  // 当用户配置 *.js 这种写法的时候，需要让其命中所有所有目录下面的。
  if (/^(\(*?)(?!\:|\/|\(|\*\*)(.*)$/.test(pattern)) {
    pattern = '**/' + pattern;
  }

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
};
