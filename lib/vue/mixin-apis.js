
var isScalar = require('is-scalar');

module.exports = createApiMixinApis;

function createApiMixinApis(registry, apis, init, root) {
  var all = [];
  var apiRest = {};
  var asyncComputed = {};
  if(init == null) init = [];
  if(root == null) root = 'apis';

  apis.forEach(function(type){
    var api = registry.getApi(type);
    var name = registry.constructor.dashToCamel(type);
    if(apiRest[name] == null) {
      // apiRest[name] = api.rest({}, {});
      var self = this;
      apiRest[name] = api.rest({}, {
        dryrun: init.indexOf(type) === -1,
      }).then(function(rest){
        console.log('%s.%s = ', root, name, rest);
        return rest;
      });
    }
    all.push(apiRest[name]);
  });

  var promise = Promise.all(all).then(function(){
    console.log('All apis resolved');
    all = null;
    return apiRest;
  });

  asyncComputed[root] = {
    lazy: true,
    get: function() {
      return promise;
    }
  };

  var data = {};
  data[root+'Promise'] = promise;

  return {
    data: data,
    asyncComputed: asyncComputed,
  };
}
