'use strict';
// TODO 还是使用 express 吧，方便，快捷
const express = require('express');
const chalk = require('chalk');
const path = require('path');
const co = require('co');
const fs = require('fs-extra');

class Server {
  constructor(port) {
    this.app = express();
    this.port = port;
    this.registServices();
  }

  /**
   * 注册 app 服务
  */
  registServices() {
    const app = this.app;
    const srcDir = path.resolve(__dirname, '../browser');

    app.use('/static', express.static(path.resolve(srcDir, './static')));

    app.all('/', (req, res) => {
      const filepath = path.join(srcDir, './index.html');
      res.send(
        fs.readFileSync(filepath).toString()
      );
    });

    app.all('/rigger-list', (req, res) => {
      res.send(require('../index').readConf());
    });

    app.use((req, res) => {
      res.status(404)
        .send('<html><head><title>404</title></head><body>404</body></html>');
    });
  }

  /**
   * 启动预览服务
  */
  start() {
    this.server = this.app.listen(this.port, () => {
      console.log(chalk.green(`预览服务器启动中，端口: ${this.port}`));
      console.log(chalk.green(`正在自动打开浏览器`));

      // 启动浏览器
      const os = require('os');
      const ifaces = os.networkInterfaces();
      const ips = [];
      Object.keys(ifaces).forEach(key => {
        ifaces[key].forEach(details => {
          if (details.family === 'IPv4') {
            ips.push(details.address);
          }
        });
      });

      this.openBrowser(`http://${ips[0]}:${this.port}/`);
    });
  }

  /**
   * 自动打开浏览器
   * @param {String} uri 被浏览器打开的地址
   * @param {Function} [callback] 无论是否打开成功，都执行回调
   * @return {undefined}
  */
  openBrowser(uri, callback) {
    let map, opener;
    map = {
      'darwin': 'open',
      'win32': 'start '
    };
    opener = map[process.platform] || 'xdg-open';
    require('child_process').exec(opener + ' ' + uri, callback || function() {});
  }
};


exports.createServer = function(port) {
  const server = new Server(port);
  server.start();
};

exports.open = function(port) {
  port = port || 5354;
  this.createServer(port);
  console.log(`打开浏览器，端口: ${port}`);
};
