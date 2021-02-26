const path = require('path');
const fs = require('fs');
const semver = require('semver');

class AppFederationPlugin {
  constructor(options = {}) {
    const externals = this.getExternals();

    this.filename = options.filename || 'remote-entry';
    this.remoteEntry = `${__dirname}/remote-entry.js`;

    this.externals = [
      (context, moduleName, callback) => {
        if (externals[moduleName]) {
          const externs = externals[moduleName];
          const packageName = this.moduleNameToPackageName(moduleName);
          const pkg = this.resolvePackageFrom(context, packageName);

          if (!pkg) {
            return callback(new Error(`Can't resolve the package ${packageName}`));
          }

          for (const ext of externs) {
            if (semver.satisfies(pkg.version, ext.versionMatcher)) {
              return callback(null, ext.placeholder);
            }
          }

          const matches = externs.map(({ versionMatcher }) => versionMatcher).join(' || ');
          const errorMessage = `The version of your package ${pkg.name} ${pkg.version} doesn't match with ${matches}. Please change your package.json to use one of these versions: ${matches}.`;

          return callback(new Error(errorMessage));
        }
        return callback();
      },
    ];
  }

  apply(compiler) {
    const entries = Object.entries(compiler.options.entry).map(([moduleName, filename]) => {
      return {
        moduleName,
        filename: path.resolve(process.cwd(), filename),
      };
    });
    this.transformCompilerOptions(compiler);
    compiler.options.module.rules.unshift({
      test: this.remoteEntry,
      use: {
        loader: __dirname + '/remote-entry-loader',
        options: {
          entries,
        }
      }
    });
    let dependencies = [];

    compiler.hooks.thisCompilation.tap('AppFederationPlugin', compilation => {
      compilation.hooks.finishModules.tap('AppFederationPlugin', (modules) => {
        dependencies = this.getExternalsModules(modules);
      });
    });

    compiler.hooks.afterCompile.tap('AppFederationPlugin', compilation => {
      const assetName = `${this.filename}.js`;
      const remoteEntry = compilation.assets[assetName];
      if (!remoteEntry) {
        return;
      }
      const code = remoteEntry.source();
      const source = code.replace('__app_federated_dependencies__', JSON.stringify(dependencies));
      compilation.assets[assetName] = {
        source: () => source,
        size: () => source.length,
      };
    });
  }

  transformCompilerOptions(compiler) {
    compiler.options.entry = {
      [this.filename]: this.remoteEntry,
    };

    if (!compiler.options.externals) {
      compiler.options.externals = this.externals;
    } else if (Array.isArray(compiler.options.externals)) {
      compiler.options.externals = [...compiler.options.externals, ...this.externals];
    } else {
      compiler.options.externals = [compiler.options.externals, ...this.externals];
    }

    const module = compiler.options.module || (compiler.options.module = {});
    module.rules || (module.rules = []);
  }

  getExternals() {
    const externals = require('./declarations.json');
    return this.parseDeclarations(externals);
  }

  getExternalsModules(modules) {
    const imports = new Set();

    modules
      .map(module => module.request)
      .filter(m => /^AppRegistry\.require\((.*)\)/.test(m))
      .map(m => JSON.parse(m.match(/^AppRegistry\.require\((.*)\)/)[1]))
      .forEach(external => imports.add(external));
    return Array.from(imports);
  }

  moduleNameToPackageName(moduleName) {
    const matches = moduleName.match(/^((@[^/]+\/[^/]+)|([^@][^/]*))(\/|$)/);
    if (!matches) {
      throw new Error(`Not able to parse the moduleName "${moduleName}"`);
    }
    return matches[1];
  }

  getPackagePath(context, packageName) {
    return path.join(context, `./node_modules/${packageName}/package.json`);
  }

  resolvePackageFrom(context, packageName) {
    // TODO: implement some cache mechanism
    for (let c = context; c !== '/'; c = path.join(c, '../')) {
      const packagePath = this.getPackagePath(c, packageName);
      if (fs.existsSync(packagePath)) {
        return JSON.parse(fs.readFileSync(packagePath).toString());
      }
    }
    return null;
  }

  parseDeclarations(externals) {
    const keys = Object.keys(externals);
    const modules = {};

    for (const key of keys) {
      const matches = key.match(/^(@?[^@]+)@(.*)$/);
      if (!matches) {
        throw new Error(`Entry malformed ${key}`);
      }
      const [, moduleName, versionMatcher] = matches;
      modules[moduleName] = modules[moduleName] || [];
      modules[moduleName].push({
        versionMatcher,
        placeholder: externals[key],
      });
    }
    return modules;
  }
}

module.exports = {
  AppFederationPlugin,
};