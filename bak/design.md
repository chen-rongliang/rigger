# 使用:
```javascript
var result = [];
PC[1] 还是 移动[2]: 2 // 进入到移动的逻辑，result 加入移动的处理
需要自适应方案吗[yes/no]: yes
  flexable.js[1], 适配的rem方案[2], 媒体查询方案[3]: 3
需要 jQuery[1] 还是 zepto[2]: 1
```

# 问题配置
```js
// 入口文件 entry.js
module.exports = {
  // 问题的key值，用于记录当前的输入
  key: 'siteType',

  question: '电脑端[1] 还是 手机端[2]',

  isValid: function(answer) {
    // 这个问题通过吗？
    // 如果不通过，再次提问
    if (answer != 1 || answer != 2) {
      return false;
    }
    return true;
  },

  // 问题分发，根据 返回的列表，提问子列表
  distribute: function(answer, opts) {
    const list = [];
    switch (opts.siteType) {
      case '1':
        list = [require('child1')];
        break;
      case '2':
        list = [require('child2')];
        break;
    }
    return list;
  },

  // 组装结果，根据总体结果，来组装自己的文件
  install: function(dirname, answer, opts) {
    // reset.css/jquery.js

    // 进阶:
    // test.html ->
    // test.html -> html.style="xxx"
    // test.css -> test.less, test.stuly,
    // test.js -> test.es6

    return { };
  }
};
```

# 文件生成
如何组装站点的逻辑，放在各自的 ```install``` 方法中，此方法必须返回一个对象，此对象用来组装一个测试的页面、脚本、样式。

对象的默认值，应该如下:
```javascript
{
  name: 'test',
  // html 文件的后缀名称
  extHTML: 'html',
  // html 文件的默认内容
  contentHTML: '',
  // css 文件的后缀名称
  extCSS: 'css',
  // css 文件的默认内容
  contentCSS: [{ key: '', content: ''}],
  // js 文件的后缀名称
  extJS: 'js',
  // js 文件的默认内容
  contentJS: [{ key: '', content: ''}]
}
```

其中 contentHTML 可以通过 ```cheerio``` 进行加工，其它的，请自觉拼接字符串


# 文件模板
模板文件目录，可以通过模板 ```ftl2html``` 进行改装，参数是当前设置的所有参数
