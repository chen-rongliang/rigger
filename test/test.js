'use strict';
// const path = require('path');
// const Rigger = require('../index');

// Rigger.add('mm', path.resolve('../test'));
// console.log('添加成功');

// console.assert(Rigger.exist('mm') == true, '模板:mm，应该已经存在才对');

// Rigger.remove('mm');
// console.assert(Rigger.exist('mm') == false, '模板:mm，应该已经不存在才对');
// console.log('删除成功');


// Rigger.template('./', path.resolve(__dirname, '../test-dest'));


var beautify_js = require('js-beautify'); // also available under "js" export
var beautify_css = require('js-beautify').css;
var beautify_html = require('js-beautify').html;

console.log(
  beautify_html(`
<html>
<head><title>xxx</title></head>
<body><div>test</div></body>
</html>
  `, {
      indent_size: 2,
    }
  )
);