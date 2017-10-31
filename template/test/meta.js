'use strict';

exports.keywords = [
  '测试',
  'PC端',
  '移动端'
];

exports.description = `pc、移动，双端通杀的简单模板`;

exports.question = function*(rigger) {
  const add = rigger.add.bind(rigger);

  add('projectType', {
    message: '请选择项目类型',
    type: 'radio',
    choices: [
      { message: 'pc端', value: 'pc' },
      { message: '移动端', value: 'wap' }
    ],
    distribute: function(next, value) {
      if (value == 'wap') {
        next(value, true);
      } else {
        next();
      }
    }
  });

  add('needJQuery', {
    message: '需要引入jQuery吗?',
    type: 'confirm'
  });

  add('needResetCss', {
    message: '需要reset.css吗?',
    type: 'confirm'
  });

  add('needLess', {
    message: '需要使用less编译吗?',
    type: 'confirm'
  });

  // 移动端额外配置
  const wap = rigger.flow('wap');

  wap.add('scaleType', {
    message: '请选择缩放方案',
    type: 'radio',
    choices: [
      { message: '自定义', value: 'none' },
      { message: '1rem = 40px 方案', value: '40px' },
      { message: '淘宝 flexible.js', value: 'flexible' }
    ],
  });

  wap.add('fixChinese', {
    message: '是否修正中文lineheight的问题?',
    type: 'confirm'
  });
};

exports.build = function*(riggerTool, data) {
  const rt = riggerTool;

  const projectType = data.projectType;
  const isWrap = data.projectType == 'wap';

  if (data.needJQuery) {
    rt.rename(`js/lib/${projectType}-jquery.js`, 'js/lib/jquery.js')
      .place();
  }

  if (data.needResetCss) {
      rt.rename(`css/${projectType}-reset.css`, 'css/reset.css')
        .compile()
        .place();
  }

  if (data.needLess) {
    rt.find('less/*.less')
      .compile()
      .place();
  }

  rt.find(['js/index.js', 'css/index.css', 'index.html'])
    .compile()
    .place();
};