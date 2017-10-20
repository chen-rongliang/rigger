'use strict';
const fs = require('fs-extra');
const path = require('path');
const iconv = require('iconv-lite');
const nunjucks = require('nunjucks');
const FileMatcher = require('./file-matcher.js');

nunjucks.configure({
  autoescape: false,
});

class RiggerBuilder {
  constructor(srcDir, targetDir, data) {
    this.srcDir = srcDir;
    this.targetDir = targetDir;
    this.data = data || {};

    // 外部使用的工具啦~
    this.fs = fs;
  }

  find(filepathList) {
    return new Builder(this.srcDir, this.targetDir, this.data, filepathList);
  }

  rename(fr, to) {
    return this.find(fr).rename(fr, to);
  }
}

class Builder {
  constructor(srcDir, targetDir, data, filepathList) {
    this.shouldBuild = false;
    this.srcDir = srcDir;
    this.targetDir = targetDir;
    this.data = data;

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
    const shouldBuild = this.shouldBuild;
    const compileOpts = this.compileOpts;
    const compileData = Object.assign({}, this.data);

    list.forEach(data => {
      let src = data.fr;

      let filename = data.to;
      // 如果是扁平化，则所有文件，都扔到同一个目录下
      if (opts.flatten) {
        filename = path.basename(data.to);
      }

      let srcFilepath = path.resolve(srcDir, src);
      let targetFilepath = path.resolve(targetDir, filename);
      fs.copySync(srcFilepath, targetFilepath);

      // 编译
      if (shouldBuild) {
        const charset = compileOpts.charset;
        let str = iconv.decode(fs.readFileSync(targetFilepath), charset);
        let res = nunjucks.renderString(str, compileData);
        fs.writeFileSync(targetFilepath, iconv.encode(res, charset));
      }
    });
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
