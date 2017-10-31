# Tool For 脚手架

脚手架，一般来说，就是一款帮你减少「**为减少重复性工作而做的重复性工作**」的工具。
而此工具，就是为了让大家更 **规范**、**快速** 搭建脚手架的工具。

想象一下，只需一条命令，就完成项目的初始化，那是何等的美妙:
```
rigger --template=wap --output=./app
```

# 命令运行
提供以下命令
```
cbg-rigger
  -t, --template <name>, 当前目录安装指定name的模板，如果是路径的话，则使用此路径下的模板，如果非路径，则从配置中查找模板
  -o, --output [dirname], 模板编译后的放置目录，默认是 process.cwd()
  -a, --add <name>, 将当前命令运行的目录，添加到全局配置中
  --addDir <dirname>, --add命令指定的目录
  -r, --remove <name>, 删除全局脚手架
  -e, --exist <name>, 查询全局脚手架，是否存在
  --browser, 打开浏览器，查看现在所有的全局脚手架
  --port <port>, browser服务的端口号，默认5354
```

# node运行
在 node.js 中，提供以下方法:
代码调用:
```javascript
const Rigger = require('cbg-rigger');
// 创建模板
Rigger.template('模板名字|绝对路径', targetDir);

// 添加、删除模板，模板是否存在
Rigger.add('模板名字', templateDir);
Rigger.remove('模板名字');
Rigger.exist('模板名字');

// 查看所有模板，占用端口 5354
Rigger.browser();
```


# 模板目录结构

脚手架使用 `rigger` 时，有特定的目录结构:

```text
-- templateName [模板名字]
---- meta.js    [脚手架配置]
---- src        [模板源码目录]
```

## meta.js

详细例子，可见 `./test/meta.js` 或者是 `./design.md`；

问题配置，必须返回一个函数:
```javascript
// meta.js

// 预览时的关键词
exports.keywords = [
  '关键词1',
  '关键词2'
];

// 预览时的描述
exports.description = `脚手架简短描述，可使用 html 标志`;

// 配置问题
exports.question = function*(rigger) {
  rigger.add('projectName', {
    required: false,
    default: 'test',
    type: 'input',
    message: '项目名字【默认为test】:',
  });
};

// 如何构建
exports.build = function*(riggerTool, data) {
  // data == { projectName: 'test' }
  // riggerTool = { fs, data, srcDir, targetDir, find, rename }
};
```

`exports.question` 中的 `rigger` 对象，有 `add` 和 `flow` 两个方法:

### rigger.add(key, opts) 添加新的问题
`key`值作为问题的唯一ID，将会被透传到 `build.js` 中使用，
如:
```javascript
rigger.add('needJQuery', {
  type: 'confirm',
  message: '需要 jquery 库吗?'
});
```
假设用户输入了`yes`，那将生成对象 `{ needJQuery: true }`，并且在提问结束后，传入到 `build.js` 中。
```javascript
// build.js
module.exports = function(rt, data) {
  // data == { needJQuery: true }
};
```

`opts`是问题的配置，可选属性如下:
* required: 是否必填字段，默认true
* default: 问题默认值，仅在 required = false 时生效
* message: 具体的问题
* type: 输入类型，有: input[默认]/radio[配合choices使用]/confirm[结果为true|false] 三类
* expect: 预期结果，例如: [0, 1, 2] 或 正则 , 如果不是预期结果，自动重新提问，默认没有
* choices: 选择列表，例如: [ { message: '标准环境', value: 'standard' }, { message: '线上环境', value: 'online' }, { message: '自定义环境', value: 'none' } ]，如果不配置 value，默认是 0, 1, 2..；如果配置了 choices，强制把 expect 更改为 [1, 2, 3] 这样的列表
* distribute: 分发函数，如果想要根据之前的输入，更改下一个问题，可定义此函数: distribute(next, value, opts)，value 是当前的值，opts 已经输入问题的所有值， next() 木有参数则往下执行，next(key) 跳转到 key 的问题

关于 `distribute` 属性的 `next` 函数:
```javascript
rigger.add('runtime', {
  message: '运行环境:',
  distribute: function(next, value, opts) {
    if (value == 'online') {
      // next() 没有参数，则继续往下执行
      // next('名字') 只有一个参数，则跳到当前链条的对应问题
      // 两个参数，必须配合 rigger.flow 使用
      // next('名字', 是否回到当前链条?) 两个参数，代表到新的链条执行问题，则跳到新的链条
      // next('名字.key', 是否回到当前链条?) 两个参数，代表到新的链条执行问题，如果名字带有 “.”，则跳到新链条的“key”问题
      next('online', true);
    }
    next();
  }
});

// 配合 distribute 使用
var online = rigger.flow('online');
online.add('needJQuery', {
  type: 'confirm',
  message: '是否启用 jQuery？'
});
```

### rigger.flow(key) 问题分支

当前的问题链条中，创建一个子问题链条，配合 `distribute` 属性使用。
```javascript
const jquery = rigger.flow('jquery');
jquery.add('conf', {
  type: 'confirm',
  message: '是否安装 jQuery 所有插件'
});
jquery.add('auto', {
  type: 'confirm',
  message: '是否安装 autoComplete'
});
```

注意: flow 生成的配置，将会封装为类似这样的格式: `{ jquery: { comfirm: true, auto: true } }`


### exports.build = function() {}

详细例子，可见 `./test/meta.js` 或者是 `./design.md`；

`exports.question`询问用户后，将返回一个配置对象，并传入到 `exports.build` 中:

```javascript
// meta.js
exports.build = function*(riggerTool, data) {
  // data = meta.js生成的配置对象
  // const fs = riggerTool.fs; // fs-extra 的快捷方式

  riggerTool.find('**.js')                      // 找出 src 目录的所有 js 文件
    .rename('(**)/jquery.js', '$1/jquery2.js')  // 重命名所有 jquery.js
    .compile()                                  // 根据 data，已 Nunjucks 模板进行文件编译，注意只能编译文本文件
    .place();                                   // 把编译完成的文件，放置到目标目录的根目录下
};
```

### riggerTool.find(String|Array)
此方法是找出 `src` 目录下，所有满足条件的资源，`find` 方法，对 `glob` 表达式进行了简单的拓展:
* `*`匹配0或多个除了`/`以外的字符
* `?` 匹配单个除了`/`以外的字符
* `**` 匹配多个字符包括`/`
* `{}` 可以让多个规则用 , 逗号分隔，起到`或者`的作用
* `!` 出现在规则的开头，表示取反。即匹配不命中后面规则的文件
需要注意的是，文件路径都是以 `/` 开头的，所以编写规则时，请尽量严格的以 / 开头。
当设置规则时，没有严格的以 `/` 开头，比如 `a.js`, 它匹配的是所有目录下面的 `a.js`。

### riggerTool.find(xxx).rename(fr, to)
必须跟在 `find()` 后调用，把 `fr` 命中的所有文件，名字更改为 `to`，这里的 `glob` 表达式支持类似正则的数组捕获。

如:
```javascript
riggerTool.find('**.js')
  .rename('(**)/(*.js)', '$1/test/$2')
  .place();
```

### riggerTool.find(xxx).compile(extraData, opts = { charset: 'utf8' })
对文本类的文件，使用 `nunjucks` 模板，进行编译。

* `extraData` 传入`nunjucks`模板的额外数据，默认是 `meta.js` 传入的问题结果
* `opts` 编译的参数，{ `charset`: 当前编译文件的编码，默认是 `utf8` }

注: nunjucks模板资料，[查看这里](http://mozilla.github.io/nunjucks/templating.html)

### riggerTool.find(xxx).place(subDir, opts = { flatten: false });
查询的文件，放置到编译目录下的那个子目录。只有调用此方法，才会真正编译、放置文件。
所有 `find` 出来的文件，默认情况下，会保持与 `src` 目录放置的相同路径。

* `subDir` 子目录的相对路径，默认是 `./`
* `opts` 放置参数，{ `flatten`: 匹配的文件，是否都忽略本身路径，放置在同一个目录，默认是 `false` }


## src目录

脚手架模板的所有文件，请按项目需求，自己组织
