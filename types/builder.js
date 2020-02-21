'use strict';

// Modules
const _ = require('lodash');
const LandoLaemp = require('./../laemp/builder.js');
const semver = require('semver');
const utils = require('./../../lib/utils');

/*
 * Build out pull command for laempy apps.
 */
module.exports = {
  name: '_pull',
  parent: '_recipe',
  config: {
    build: [],
    composer: {},
    confSrc: __dirname,
    config: {},
    defaultFiles: {
      envoy: 'Envoy.blade.php',
      env: 'pull.env',
    },
    tooling: {
        envoy: {
        service: 'appserver',
      },
      pull: {
        service: 'appserver',
        cmd: 'envoy run pull',
      },
    },
  },
  builder: (parent, config) => class LandoPull extends LandoLaemp.builder(parent, config) {
    constructor(id, options = {}) {
      options = _.merge({}, config, options);
      options.composer['laravel/envoy'] = true;
      // Send downstream
      super(id, options);
    };
  },
};
