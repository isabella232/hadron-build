'use strict';
/* eslint no-unused-vars: 1 */
const _ = require('lodash');
const chai = require('chai');
const getConfig = require('./helpers').getConfig;
const expect = chai.expect;
const path = require('path');

describe('hadron-build::config', () => {
  describe('Release channel support', () => {
    const channels = {
      stable: getConfig({
        version: '1.2.0'
      }),
      beta: getConfig({
        version: '1.2.0-beta.1'
      }),
      custom: getConfig({
        version: '1.2.0-custom.5'
      })
    };

    it('should have the right versions', () => {
      expect(channels.stable.version).to.equal('1.2.0');
      expect(channels.beta.version).to.equal('1.2.0-beta.1');
      expect(channels.custom.version).to.equal('1.2.0-custom.5');
    });

    it('should detect the channel from the version', () => {
      expect(channels.stable.channel).to.equal('stable');
      expect(channels.beta.channel).to.equal('beta');
      expect(channels.custom.channel).to.equal('custom');
    });

    it('should not include channel in the product name on stable', () => {
      expect(channels.stable.productName).to.equal('Hadron');
    });

    it('should not include channel in the slug on stable', () => {
      expect(channels.stable.slug).to.equal('hadron-app');
    });

    describe('For releases *not* on the stable channel', () => {
      it('should add the channel as a suffix to the product name', () => {
        expect(channels.beta.productName).to.equal('Hadron Beta');
        expect(channels.custom.productName).to.equal('Hadron Custom');
      });
      it('should add the channel as a suffix to the slug', () => {
        expect(channels.beta.slug).to.equal('hadron-app-beta');
        expect(channels.custom.slug).to.equal('hadron-app-custom');
      });
    });
  });
  describe('Only on macOS', () => {
    const macOS = {
      version: '1.2.0',
      product_name: 'Hadron',
      app_bundle_id: 'com.mongodb.hadron',
      platform: 'darwin'
    };

    it('should set app-bundle-id', () => {
      expect(getConfig(macOS).packagerOptions['app-bundle-id']).to.equal('com.mongodb.hadron');
    });

    it('should automatically support release channels for app-bundle-id', () => {
      let beta = getConfig(_.defaults({version: '1.2.0-beta.1'}, macOS));
      expect(beta.packagerOptions['app-bundle-id']).to.equal('com.mongodb.hadron.beta');

      let alpha = getConfig(_.defaults({version: '1.2.0-custom.5'}, macOS));
      expect(alpha.packagerOptions['app-bundle-id']).to.equal('com.mongodb.hadron.custom');
    });
  });

  describe('Only on Linux', () => {
    const linux = {
      name: 'hadron-app',
      version: '1.2.0',
      product_name: 'Hadron',
      arch: 'x64',
      platform: 'linux'
    };
    const appDir = path.join(process.cwd(), 'test', 'fixtures', 'hadron-app');
    const expectLinuxConfig = {
      'bin': 'Hadron',
      'dest': path.join(appDir, 'dist'),
      'icon': path.join(appDir, 'resources', 'linux', 'Icon.png'),
      'name': 'hadron-app',
      'src': path.join(appDir, 'dist', 'Hadron-linux-x64')
    };
    const expectDebianConfig = Object.assign(
      {},
      expectLinuxConfig,
      {
        'arch': 'amd64',
        'section': 'Databases',
        'depends': [
          'python'
        ],
        'suggests': [
          'libgnome-keyring0'
        ],
        'version': '1.2.0'
      }
    );
    const expectRedHatConfig = Object.assign(
      {},
      expectLinuxConfig,
      {
        'arch': 'x86_64',
        'categories': [
          'Development'
        ],
        'requires': [
          'libXScrnSaver(x86-64)'
        ],
        'revision': '1',
        'version': '1.2.0'
      }
    );

    const c = getConfig(linux);
    const assetNames = _.map(c.assets, 'name');
    it('should produce a tarball asset', () => {
      expect(assetNames).to.contain(c.linux_tar_filename);
    });

    it('should produce a debian package asset', () => {
      expect(assetNames).to.contain(c.linux_deb_filename);
    });

    // Would be nicer to test these independently without the fixture,
    // but not sure how to mock files
    it('should allow configuring debian_config options', () => {
      expect(c.debian_config).to.deep.equal(expectDebianConfig);
    });

    it('should produce a redhat package manager asset', () => {
      expect(assetNames).to.include(c.linux_rpm_filename);
    });

    it('should allow configuring redhat_config options', () => {
      expect(c.redhat_config).to.deep.equal(expectRedHatConfig);
    });
  });

  describe('Only on Windows', () => {
    const windows = {
      version: '1.2.0',
      product_name: 'Hadron',
      platform: 'win32',
      author: 'MongoDB Inc'
    };

    let res;
    before( () => {
      res = getConfig(windows);
    });
    it.skip('should have the platform specific packager options', () => {
      let versionString = res.packagerOptions['version-string'];
      expect(versionString).to.be.a('object');
      expect(versionString.CompanyName).to.equal('MongoDB Inc');
      expect(versionString.FileDescription).to.be.a('string');
      expect(versionString.ProductName).to.be.a('string');
      expect(versionString.InternalName).to.be.a('string');
    });

    it('should have the platform specific evergreen expansions', () => {
      expect(res.windows_msi_filename).to.equal('HadronSetup.msi');
      expect(res.windows_setup_filename).to.equal('HadronSetup.exe');
      expect(res.windows_zip_filename).to.equal('Hadron-windows.zip');
      expect(res.windows_nupkg_full_filename).to.equal('Hadron-1.2.0-full.nupkg');
      expect(res.windows_nupkg_full_label).to.equal('Hadron-1.2.0-full.nupkg');
    });

    it('should have the platform specific installer options', () => {
      let opts = res.installerOptions;
      expect(opts).to.have.property('loadingGif');
      expect(opts).to.have.property('signWithParams');
      expect(opts).to.have.property('iconUrl');
      expect(opts).to.have.property('appDirectory');
      expect(opts).to.have.property('outputDirectory');
      expect(opts).to.have.property('authors');
      expect(opts).to.have.property('version');
      expect(opts).to.have.property('exe');
      expect(opts).to.have.property('setupExe');
      expect(opts).to.have.property('title');
      expect(opts).to.have.property('productName');
      expect(opts).to.have.property('description');
      expect(opts).to.have.property('name');
    });

    describe('For non-stable channel releases', () => {
      let custom;
      before( () => {
        custom = getConfig({
          version: '1.2.0-custom.5',
          name: 'hadron',
          product_name: 'Hadron',
          platform: 'win32',
          author: 'MongoDB Inc'
        });
      });

      it('should append the channel name to the product name', () => {
        let versionString = custom.packagerOptions['version-string'];
        expect(versionString.ProductName).to.equal('Hadron Custom');
      });

      it('should include the channel name in asset filenames', () => {
        expect(custom.windows_msi_filename).to.equal('Hadron CustomSetup.msi');
        expect(custom.windows_setup_filename).to.equal('Hadron CustomSetup.exe');
        expect(custom.windows_zip_filename).to.equal('Hadron Custom-windows.zip');
        expect(custom.windows_nupkg_full_filename).to.equal('HadronCustom-1.2.0-custom5-full.nupkg');
      });
    });
  });
});
