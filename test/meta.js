'use strict';

module.exports = function*(rigger) {
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
