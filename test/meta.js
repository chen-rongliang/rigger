'use strict';

exports.keywords = [
  '移动端',
  'h5',
  'jquery',
  'vue'
];

exports.description = `
脚手架简单的描述，难道还想很长很长的吗？不可能啦~
`;

exports.question = function*(rigger) {
  const add = rigger.add.bind(rigger);

  add('projectName', {
    required: false,
    default: 'test',
    type: 'input',
    message: '项目名字[默认test]:',
  });

  add('lib', {
    type: 'radio',
    message: '请选择核心库',
    choices: [
      { message: 'jQuery', value: 'jquery' },
      { message: 'Vue', value: 'vue' },
      { message: 'jQuery + Vue', value: 'both' },
      { message: '自定义', value: 'none' }
    ],
    distribute: function(next, value, opts) {
      if (value == 'jquery') {
        const carryOn = false;
        next('jquery', carryOn);
      } else {
        next();
      }
    }
  });

  add('autoText', {
    type: 'confirm',
    message: '是否添加自动测试？',
  });

  const jquery = rigger.flow('jquery');
  jquery.add('conf', {
    type: 'confirm',
    message: '是否安装 jQuery 所有插件'
  });
  jquery.add('auto', {
    type: 'confirm',
    message: '是否安装 autoComplete'
  });
};

exports.build = function*(rt, opts) {
  rt.default.beautifyJS = /\.js$/;
  rt.default.beautifyCSS = /\.css$/;
  rt.default.beautifyHTML = /\.html?$/;

  rt.find('**.css')
    .compile({ color: '#f00' })
    .place();

  rt.find('*.html')
    .compile()
    .place();

  rt.find('index.html')
    .rename('index2.html')
    .compile()
    .place();

  rt.find('**.js')
    .rename('(**)/jquery.js', '$1/jquery.min.js')
    .compile()
    .place();

  rt.rename('index.html', 'haha.html')
    .compile()
    .place();

  rt.find('js/**.js')
    .compile()
    .place('./js-test', { flatten: true });
};