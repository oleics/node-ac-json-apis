
var merge = require('./merge');

module.exports = Rest;

function Rest(api, params, options) {
  if(!(this instanceof Rest)) return new Rest(api, params, options);

  if(options == null) options = {};

  var self = this;
  var expose = {
    api: api.type,
    get: get,
    post: post,
    put: put,
    del: del,
    rest: rest,
  };
  var initcall = true;
  Object.assign(this, expose);

  // always returns a promise which resolves to self
  return get();

  function get(_params, _options) {
    _options = Object.assign({}, options, _options||{});
    if(_params) Object.assign(params, _params);
    return api.get(params, _options).then(function(data){
      if(initcall === true) {
        initcall = false,
        options.dryrun = false;
      }
      // set all props to self so that reactive components can interact with it (eg track changes)
      merge(self, data);
      Object.assign(self, expose);
      // expose instance
      return self;
    });
  }

  function post(_params) {
    // post self to the same url
    _params = Object.assign({}, params, _params||{});
    return api.post(_params, Object.assign({}, self, _params));
  }

  function put(_params) {
    // put self to the same url
    _params = Object.assign({}, params, _params||{});
    return api.put(_params, Object.assign({}, self, _params));
  }

  function del(_params) {
    // del self from the same url
    _params = Object.assign({}, params, _params||{});
    return api.del(_params, Object.assign({}, self, _params));
  }

  function rest(_params, _options) {
    _options = Object.assign({}, options, _options||{});
    _params = Object.assign({}, params, _params||{});
    return new Rest(api, _params, _options);
  }
}
