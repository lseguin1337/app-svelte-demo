const { getOptions } = require("loader-utils");

function normalize(moduleName) {
  return moduleName.replace(/[@\/$+-]/g, '_').replace(/^_+/, '');
}

module.exports = function loader() {};

module.exports.pitch = function pitch(_) {
  const options = getOptions(this) || {};
  const entries = options.entries;
  // TODO: handle federated dependencies per entries
  return `var AppRegistry = window.AppRegistry;
  function dependencies(fn) { AppRegistry.import(__app_federated_dependencies__).then(fn); };
  ${entries.map(({moduleName, filename}) => {
    const chunkName = normalize(moduleName);
    return `AppRegistry.register(${JSON.stringify(moduleName)}, function () {
      return dependencies(function () {
        return import(
          /* webpackChunkName: ${JSON.stringify(chunkName)} */
          ${JSON.stringify(filename)}
        );
      });
    })`;
  })}`;
};