问题设计，如何编译 等配置，都仍在 meta.js 中

```javascript
// 此脚手架的关键词，用于预览的搜索
exports.keywords = [
  '移动端',
  'h5',
  'jquery',
  'vue'
];

exports.description = '脚手架的简单描述';

exports.question = function*(rigger) {
  rigger.add('projectName', {
    required: false, // 是否必填字段
    default: 'test',

    type: 'input',  // 默认输入
    enums: [0, 1, 2], // 可选择结果，如果输入不符合预期结果，则重新提问
    message: '项目名字:',  // 问题

    distribute: function(next, value, opts) {
      // next() 下个问题
      // next('问题id') 到达特定问题
      // value 当前输入的值
      // opts 当前已经设定的所有值
    },
  });

  rigger.add('runtime', {
    required: true,
    message: '预置运行环境:',

    // 单选，用户输入 1 - n，可快捷选择
    type: 'radio',
    choices: [
      {
        message: '标准环境',
        value: 'standard'
      },
      {
        message: '线上环境',
        value: 'online'
      },
      {
        message: '自定义环境',
        value: 'none'
      }
    ],
    distribute: function(next, value, opts) {
      if (value == 'online') {
        // next() 没有参数，则继续往下执行
        // next('名字') 只有一个参数，则跳到当前链条的对应问题
        // next('名字', 是否回到当前链条?) 两个参数，代表到新的链条执行问题，则跳到新的链条
        // next('名字.key', 是否回到当前链条?) 两个参数，代表到新的链条执行问题，如果名字带有 “.”，则跳到新链条的“key”问题
        return next('online', true);
      }
      next();
    }
  });

  rigger.add('needTest', {
    type: 'confirm', // 选择，返回 true|false
    message: '是否启动单元测试?'
  });

  var rigger2 = rigger.flow('online');
  rigger2.add('needJQuery', {
    type: 'confirm',
    message: '是否启用 jQuery？'
  });
};

// @notice 暂不支持
// 如果有必要，可以自定义 build 时，使用的模板引擎，默认模板引擎，是 nunjucks
exports.render = function(str, data, opts) {
  // str = '' 需要编译的字符串
  // data = { } 当前模板需要的数据
  // opts = { srcDir, targetDir };
  const result = '编译完成后的字符串';
  return result;
};

// 脚手架如何编译
exports.build = function*(rt, data) {
  // data 等于 exports.question 生成的对象
  // rt.find().compile() 方法，已经内置了 data 属性

  const fs = rt.fs;

  // @TEST 内置了三种美化方式，暂时用于测试，之后可能会更改
  // 如果有需要，请配置这几个值，只要文件名字，匹配，则启动内置的美化函数
  // rt.default.beautifyJS = /\.js$/;
  // rt.default.beautifyCSS = /\.css$/;
  // rt.default.beautifyHTML = /\.html?$/;

  rt.find('./package.json')
    .compile(otherData = { }, options = { charset: 'utf8' })  // 走 nunjucks 模板，默认使用 opts 作为参数
    .place('./', { flatten: true });  // 编译完成后，跑到哪个目录，如果有设置参数 flatten: 所有文件都放置在当前目录

  // 排除所有目录下的 test.js
  rt.find(['./js/*.js', '!**/test.js'])
    .complie()
    .place('./');

  // 下面两者等价
  rt.find('./a').rename('a', 'b').place('./'); // 重命名
  rt.rename('a', 'b').place('./'); // 重命名
};
```

`exports.question` 最终生成此对象:
```text
{
  projectName: xxx,
  runtime: online,

  // 对应是 rigger.flow('online')
  online: {
    needJQuery: true
  }
}
```

3) 用户使用
通过命令:
```
cbg-rigger
  --template,-t [name 名字，如果是路径的话，则使用此路径下的模板，如果非路径，则从配置中查找模板]
  --output,-o [dirname 目录名字，模板将要输出的目录]
  --add,-a [name 名字，全局添加模板，将当前目录的所有文件，作为模板的内容]
  --addDir 调用 --add 时，模板的目录
  --remove,-a [name 名字，全局移除模板]
  --exist,-e [name 名字，判断模板是否存在]
  --browser 打开浏览器，查看当前所有模板
```

代码调用:
```javascript
const Rigger = require('cbg-rigger');
Rigger.template('模板名字|绝对路径', targetDir);
Rigger.add('模板名字', templateDir);
Rigger.remove('模板名字');
```
