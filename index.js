'use strict';

const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const del = require('del');

const wrap = require('./wrap-functions');

class WrapLog {
  constructor(serverless, options) {
    this.sls = serverless;
    this.options = options;
    this.sufixFile = '-wrap-log';
    this.rgxModule = /(module[\w\s\.=]*{\s*)(\w*)(\s*};)/g;

    this.hooks = {
      'before:package:createDeploymentArtifacts': this.run.bind(this),
      'before:deploy:function:packageFunction': this.run.bind(this),
      'before:invoke:local:invoke': this.run.bind(this),
      'before:offline:start:init': this.run.bind(this),
      'before:step-functions-offline:start': this.run.bind(this),
      'after:package:createDeploymentArtifacts': this.finish.bind(this),
      'after:invoke:local:invoke': this.finish.bind(this),
    };
  }

  log(arg1, ...rest) {
    const logger = this.sls.cli.log || console.log;
    logger.call(this.sls.cli, `serverless-wrap-log: ${arg1}`, ...rest);
  }

  run() {
    this.log('Wrapping your functions with Log...');

    _.mapKeys( this.sls.service.functions, ({ handler }, key) => {
      try{
        const pathArr = handler.split('.');
        const pathFile = pathArr.slice(0, -1).join('.');
        const nameFunction = _.last(pathArr);

        this.buildFile(pathFile);

        this.sls.service.functions[key].handler = pathFile + this.sufixFile + '.' + nameFunction;
      } catch(e) {
        this.log(`Error wrapping function: ${ handler } `);
      }
    });
  }

  buildFile(pathFile) {
    const file = String(fs.readFileSync(path.join(this.sls.config.servicePath, pathFile + '.js')));
    const funcWrapped = `${wrap}\n\n${this.wrapExport(file)}`;

    fs.writeFileSync(path.join(this.sls.config.servicePath, pathFile + this.sufixFile +'.js'), funcWrapped);
  }

  wrapExport(file) {
    return file.replace(this.rgxModule, (all, head, funcs, last) => {
      const wrapFuncs = funcs.split(',').map(funcName => `${funcName}: WrapFunction(${funcName})`).join(',');
      return `${head}${wrapFuncs}${last}`;
    });
  }

  finish() {
    del.sync("**/*-wrap.js", {root: this.sls.config.servicePath });
    this.log('Cleaning up extraneous Wrap files');
  }
}

module.exports = WrapLog;
