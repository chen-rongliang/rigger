# Tool For 脚手架

脚手架，一般来说，就是一款帮你减少「**为减少重复性工作而做的重复性工作**」的工具。
而此工具，就是为了让大家更 **规范**、**快速** 搭建脚手架的工具。

想象一下，只需一条命令，就完成项目的初始化，那是何等的美妙:
```
rigger --template=wap --output=./app
```

# 模板目录结构

脚手架使用 `rigger` 时，有特定的目录结构:

```text
-- templateName [模板名字]
---- meta.js    [问题配置]
---- build.js   [模板编译]
---- src        [模板源码目录]
```

## meta.js

详细例子，可见 `./test/meta.js` 或者是 `./design.md`；

问题配置，必须返回一个函数:
```javascript
// meta.js
module.exports = function(rigger) {
  rigger.add('projectName', {
    required: false,
    default: 'test',
    type: 'input',
    message: '项目名字【默认为test】:',
  });
};
```

`exports` 中的 `rigger` 对象，有 `add` 和 `flow` 两个方法:

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


## build.js

详细例子，可见 `./test/build.js` 或者是 `./design.md`；

`meta.js`询问用户后，将返回一个配置对象，并传入到 `build.js` 中。`build.js`必须返回一个函数:

```javascript
module.exports = function*(riggerTool, data) {
  // data = meta.js生成的配置对象
  // const fs = riggerTool.fs; // fs-extra 的快捷方式

  riggerTool.find('**.js')                      // 找出 src 目录的所有 js 文件
    .rename('(**)/jquery.js', '$1/jquery2.js')  // 重命名所有 jquery.js
    .compile()                                  // 根据 data，已 Nunjucks 模板进行文件编译，注意只能编译文本文件
    .place();                                   // 把编译完成的文件，放置到目标目录的根目录下
};
```

## src目录

脚手架模板的所有文件~


# 命令运行

# node运行
