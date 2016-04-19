/**
 * Original code credit to Alexandre Kirszenberg. Only modifications made were
 * to fit into newer Webpack plugin structure and publish as an npm module.
 *
 * @see https://gist.github.com/Morhaus/333579c2a5b4db644bd5
 */

var path = require('path');
var fs = require('fs');
var _ = require('lodash');

var reDevServer = /dev\-server/

function afterResolve(data, done) {
  if (reDevServer.test(data.resource)) {
    done(null, data);
    return;
  }
  var parentDir = path.dirname(data.resource);
  var resourceName = path.basename(data.resource);
  var resourceNameLower = resourceName.toLowerCase();

  function isCaseInsenitiveMatch(filename) {
    return filename.toLowerCase() === resourceNameLower;
  }

  function readdirCB(err, files) {
    if (err) {
      done(err);
      return;
    }

    if (files.indexOf(resourceName) === -1) {
      var realName = _.find(files, isCaseInsenitiveMatch);
      done(
        new Error([
          'ForceCaseSensitivityPlugin: `',
          resourceName,
          '` does not match the corresponding file on disk `',
          realName, '`'
        ].join(''))
      );
      return;
    }

    done(null, data);
  }

  //Ensure the file exists, it's possible we have a webpack-hot-loader file with get params that other webpack plugins understand
  //e.g. .../node_modules/webpack-dev-server/client/index.js?http://localhost:3000
  //We'll let webpack figure out if a file doesn't exist
  function existsCB(exists) {
    if (exists) {
      fs.readdir(parentDir, readdirCB);
    } else {
      done(null, data);
    }
  }

  fs.exists(parentDir + "/" + resourceName, existsCB);
}

function normalModuleFactory(nmf) {
  nmf.plugin('after-resolve', afterResolve);
}

function apply(compiler) {
  compiler.plugin('normal-module-factory', normalModuleFactory);
};

function ForceCaseSensitivityPlugin() {
  //no-op
}

ForceCaseSensitivityPlugin.prototype.apply = apply;

module.exports = ForceCaseSensitivityPlugin;
