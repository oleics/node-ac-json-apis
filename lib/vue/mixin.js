
var isScalar = require('is-scalar');

module.exports = require('./mixin2');

/*
module.exports = createApiMixin;

function createApiMixin(registry, type, name) {
  var api = registry.getApi(type);
  if(name == null) {
    name = registry.constructor.dashToCamel(type);
  }
  var inputDefaults = api.defaults.input || {};

  var props = {};
  Object.keys(inputDefaults).forEach(function(key){
    var value = inputDefaults[key];
    props[key] = {
      default: function() {
        return value;
      }
    };
  });

  var data = function() {
    return {
      props: Object.assign({}, this.$props),
      dirty: 0,
      loading: false,
      error: false,
      keys: Object.keys(this.$props),
    };
  };

  var asyncComputed = {};
  // asyncComputed[name] = function() {
  //   return api.rest(this.$props);
  // };
  asyncComputed[name] = {
    lazy: true,
    get: function() {
      var self = this;
      return api.rest(this.$props, { initcall: true }).then(function(rest){
        self.$nextTick(function(){
          self.$emit(type, rest);
        });
        return rest;
      });
    }
  };

  var methods = {
    isScalar: isScalar,

    update: function() {
      // load
      var self = this;
      this.loading = true;
      this.error = false;
      this[name].get(this.props).then(function(){
        self.refresh();
        self.loading = false;
        self.$emit('change');
      }).catch(function(err){
        self.loading = false;
        self.error = err;
        self.$emit('change');
      });
    },

    reset: function(){
      Object.assign(this.props, this.$props);
      this.update();
    }
  };

  return {
    props: props,
    data: data,
    asyncComputed: asyncComputed,
    methods: methods,
  };
}
*/
