'use strict';

module.exports = function*(rigger, opts) {
  rigger.find('**.css')
    .compile({ color: '#f00' })
    .place();

  rigger.find('*.html')
    .compile()
    .place();

  rigger.find('index.html')
    .rename('index2.html')
    .compile()
    .place();

  rigger.find('**.js')
    .rename('(**)/jquery.js', '$1/jquery.min.js')
    .compile()
    .place();

  rigger.rename('index.html', 'haha.html')
    .compile()
    .place();

  rigger.find('js/**.js')
    .compile()
    .place('./js-test', { flatten: true });
};
