
var isScalar = require('is-scalar');

module.exports = createApiMixin;

function createApiMixin(registry, type, name, root) {
  var api = registry.getApi(type);
  if(name == null) {
    name = registry.constructor.dashToCamel(type);
  }
  if(root == null) root = 'apis';

  var data = function() {
    return {
      // props: Object.assign({}, this.$props),
      // dirty: false,
      loading: false,
      error: null,
    };
  };

  var asyncComputed = {};
  asyncComputed[name] = {
    lazy: true,
    get: function() {
      return this.$root[root+'Promise'].then(function(apis){
        var rest = apis[name];
        if(rest == null) {
          console.error('Api "'+type+'" not found in path $root.'+root+'.'+name+'');
          rest = api.rest();
        }
        return rest;
      });
    }
  };

  var methods = {};
  methods['get_'+name] = function(params, options) {
    // console.log('get_'+name, this);
    var self = this;
    this.$set(this, 'loading', true);
    this.$set(this, 'error', null);

    if(params == null) params = {};
    if(options == null) options = {};

    params = Object.assign(
      {},
      this.$route ? this.$route.params||{} : {},
      params
    );

    this[name].get(params, options)
      .then(function(rest){
        self.$set(self, 'loading', false);
      })
      .catch(function(err){
        console.error(err.stack||err);
        self.$set(self, 'loading', false);
        self.$set(self, 'error', err);
      })
    ;
  };

  var watch = {};
  watch[name] = function(next, curr) {
    if(next != null && curr == null) {
      console.log('init-call for %s', type);
      this['get_'+name]();
    }
  };

  return {
    data: data,
    asyncComputed: asyncComputed,
    methods: methods,
    watch: watch,
  };
}
