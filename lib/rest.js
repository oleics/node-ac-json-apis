
module.exports = Rest;

function Rest(api, params) {
  if(!(this instanceof Rest)) return new Rest(api, params);

  var self = this;
  var expose = {
    api: api.type,
    get: get,
    post: post,
    put: put,
    del: del,
  };
  Object.assign(this, expose);

  // always returns a promise which resolves to self
  return get();

  function get(_params) {
    if(_params) Object.assign(params, _params);
    return api.get(params).then(function(data){
      // set all props to self so that reactive components can interact with it (eg track changes)
      Object.assign(self, data, expose);
      // expose instance
      return self;
    });
  }

  function post(_params) {
    // post self to the same url
    return api.post(Object.assign({}, params, _params||{}), self);
  }

  function put(_params) {
    // put self to the same url
    return api.put(Object.assign({}, params, _params||{}), self);
  }

  function del(_params) {
    // del self from the same url
    return api.del(Object.assign({}, params, _params||{}), self);
  }
}
