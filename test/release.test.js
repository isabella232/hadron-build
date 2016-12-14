'use strict';

const path = require('path');
process.env.CWD = path.join(__dirname, 'fixtures', 'hadron-app');

const _ = require('lodash');
const hadronBuild = require('../');
const commands = hadronBuild;
const fs = require('fs-extra');
const assert = require('assert');

const withDefaults = (argv) => {
  _.defaults(argv, {
    cwd: path.join(__dirname, 'fixtures', 'hadron-app')
  });
  const config = require('../lib/config');
  const defaults = _.mapValues(config.options, (v) => v.default);
  _.defaults(argv, defaults);

  const cli = require('mongodb-js-cli')('hadron-build:release:test');
  cli.argv = argv;
  let CONFIG = config.get(cli);
  return CONFIG;
};

if (process.platform === 'win32') {
  console.warn('Functional tests on appveyor too slow. Skipping.');
} else {
  describe('hadron-build::release', function() {
    this.timeout(300000);
    var CONFIG = null;

    before(function(done) {
      fs.remove(path.join(__dirname, 'fixtures', 'hadron-app', 'dist'), (_err) => {
        if (_err) {
          return done(_err);
        }
        commands.release.run(withDefaults({
          name: 'hadron-app',
          version: '1.2.0',
          product_name: 'Hadron App'
        }), (err, _config) => {
          if (err) {
            return done(err);
          }
          CONFIG = _config;
          done();
        });
      });
    });

    it('should symlink `Electron` to the app binary on OS X', function(done) {
      if (CONFIG.platform !== 'darwin') {
        return this.skip();
      }

      const bin = path.join(CONFIG.appPath, 'Contents', 'MacOS', 'Electron');
      fs.exists(bin, function(exists) {
        assert(exists, `Expected ${bin} to exist`);
        done();
      });
    });

    /**
     * TODO (imlucas) Compare from `CONFIG.icon` to
     * `path.join(CONFIG.resource, 'electron.icns')` (platform specific).
     * Should have matching md5 of contents.
     */
    it('should have the correct application icon');

    it('should have all assets specified in the manifest', () => {
      CONFIG.assets.map(function(asset) {
        it(`should have created \`${asset.name}\``, (done) => {
          fs.exists(asset.path, function(exists) {
            assert(exists, `Asset file should exist at ${asset.path}`);
            done();
          });
        });
      });
    });
  });
}
