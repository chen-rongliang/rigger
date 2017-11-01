'use strict';
const fs = require('fs-extra');
const path = require('path');
const iconv = require('iconv-lite');
const FileMatcher = require('./file-matcher.js');

// 代码美化
const beautifyJS = require('js-beautify'); // also available under "js" export
const beautifyCSS = require('js-beautify').css;
const beautifyHTML = require('js-beautify').html;

const nunjucks = require('nunjucks');
nunjucks.configure({
  autoescape: false,
  trimBlocks: true
});

class RiggerBuilder {
  constructor(srcDir, targetDir, data) {
    this.srcDir = srcDir;
    this.targetDir = targetDir;
    this.data = data || {};

    // 外部使用的工具啦~
    this.fs = fs;
    // 总体配置
    this.default = {
      // 代码美化
      beautifyJS: null,
      beautifyCSS: null,
      beautifyHTML: null
    };
  }

  find(filepathList) {
    return new Builder(this.srcDir, this.targetDir, this.data, this.default, filepathList);
  }

  rename(fr, to) {
    return this.find(fr).rename(fr, to);
  }
}

class Builder {
  /**
   * 构建脚手架 builder
   * @param {String} srcDir 脚手架源码目录
   * @param {String} targetDir 目标目录
   * @param {Object} data 模板渲染时的数据
   * @param {Object} opts 构造参数，{ beautifyJS: 正则->/\.js$/, beautifyCSS: 正则->/\.css$/, beautifyHTML: 正则->/\.html$/ }
   * @param {Array} filepathList 文件 glob 表达式列表，'**.html' or ['**.html', '**.js']
   */
  constructor(srcDir, targetDir, data, opts, filepathList) {
    this.shouldBuild = false;
    this.srcDir = srcDir;
    this.targetDir = targetDir;
    this.data = data;
    this.options = opts;

    this.compileOpts = { charset: 'utf8' };

    if (typeof filepathList === 'string') {
      filepathList = [filepathList];
    }
    const list = FileMatcher.find(srcDir, filepathList);

    this.list = list.map(src => {
      return {
        fr: src,
        to: src
      };
    });
  }

  /**
   * 把文件放置到特定目录
   * @param {String|Null} dir 如果为Null，则使用默认路径，如果是 String，则使用 path.resolve(默认, dir)
   * @param {Object} opts 放置的参数
   * @return void 0
   */
  place(dir, opts) {
    opts = Object.assign({
      flatten: false
    }, opts);

    const list = this.list;
    const srcDir = this.srcDir;
    const targetDir = path.resolve(this.targetDir, dir || './');
    
    list.forEach(data => {
      let src = data.fr;
      let filename = data.to;

      // 如果是扁平化，则所有文件，都扔到同一个目录下
      if (opts.flatten) {
        filename = path.basename(data.to);
      }

      const srcFilepath = path.resolve(srcDir, src);
      const targetFilepath = path.resolve(targetDir, filename);
      fs.copySync(srcFilepath, targetFilepath);

      // 编译
      this._build(targetFilepath);
      // 美化代码
      this._beautify(targetFilepath);
    });
  }

  /**
   * 编译文件
   * @param {String} filepath 需编译的文件的路径
   */
  _build(filepath) {
    if (!this.shouldBuild) { return; }

    const compileOpts = this.compileOpts;
    const compileData = Object.assign({}, this.data);

    const charset = compileOpts.charset;
    let str = iconv.decode(fs.readFileSync(filepath), charset);
    let res = nunjucks.renderString(str, compileData);
    fs.writeFileSync(filepath, iconv.encode(res, charset));
  }

  /**
   * 代码美化
   * @param {String} filepath 需美化的文件的路径
   */
  _beautify(filepath) {
    if (!filepath || !fs.existsSync(filepath)) { return; }

    const optsJS = { indent_size: 2 };
    const optsCSS = { indent_size: 2, newline_between_rules: true, selector_separator_newline: true, preserve_newlines: false };
    const optsHTML = { indent_size: 2, js: optsJS, css: optsCSS };
    
    const options = this.options;
    const list = [
      {
        fn: beautifyJS, reg: options.beautifyJS, opts: optsJS
      },
      {
        fn: beautifyCSS, reg: options.beautifyCSS, opts: optsCSS
      },
      {
        fn: beautifyHTML, reg: options.beautifyHTML, opts: optsHTML
      }
    ];

    let beautifyFn;
    for (let i = 0, max = list.length; i < max; i++) {
      let item = list[i];
      if (item.reg && item.reg.test(filepath.replace(/\\/g, '/'))) {
        beautifyFn = function(str) {
          return item.fn(str, item.opts);
        };
        break;
      }
    }

    if (beautifyFn) {
      const content = fs.readFileSync(filepath).toString();
      const result = beautifyFn(content);
      fs.writeFileSync(filepath, result);
    }
  }

  /** 重命名
   * @param {String} old 就的名字 glob 表达式
   * @param {String} now 新的名字，如果 glob 表达式有捕获数组，则可以使用正则的捕获数据
   * @return self
   */
  rename(old, now) {
    if (!now) {
      now = old;
      old = null;
    }

    this.list.forEach(data => {
      let fr = data.fr.replace(/\\/g, '/');
      if (old) {
        let reg = FileMatcher.glob(old);
        if (reg.test(fr)) {
          data.to = fr.replace(reg, now);
        }
      } else {
        data.to = now;
      }
    });

    return this;
  }

  /** 启动编译
   * @param {Object|String} other 如果是对象，则是编译的数据，如果是字符串，则是 opts.charset 的语法糖
   * @param {Object} opts 编译的参数，暂时只有 charset: 需要编译文件的编码
   * @return self
   */
  compile(other, opts) {
    if (typeof other === 'string') {
      opts = { charset: other };
      other = null;
    }

    Object.assign(this.data, other || {});
    Object.assign(this.compileOpts, opts || {});
    this.shouldBuild = true;

    return this;
  }
}

module.exports = RiggerBuilder;
