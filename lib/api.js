
var axios = require('axios');
// var Url = require('url-parse');
var Rest = require('./rest');

module.exports = Api;

function Api(props, registry) {
  if(!(this instanceof Api)) return new Api(props, registry);

  this._registry = registry;

  this.type = props.type;
  this.url = props.url;
  this.chain = props.chain || [];
  this.transform = props.transform || {};
  this.schema = props.schema || {};
  this.defaults = props.defaults || {};

  this.validate = {};
  if(this.schema.input) {
    this.validate.input = this._registry.ajv.compile(this.schema.input);
  }
  if(this.schema.output) {
    this.validate.output = this._registry.ajv.compile(this.schema.output);
  }
}

// Rest

Api.prototype.rest = function(params) {
  return new Rest(new Api(Object.assign(
    {},
    this
  ), this._registry), params);
};

// Requests

Api.prototype.get = function(params, _noChain, _noInputTransform) {
  var self = this;

  // resolve to params if params is a promise
  if(params instanceof Promise) {
    return params.then(function(data){
      return self.get(data, _noChain, _noInputTransform);
    });
  }

  //
  params = Object.assign({}, this.defaults, params);

  // chain api-calls
  var chain = (_noChain === true ? [] : (this.chain||[])).slice(0);
  if(chain.length) {
    chain = chain.map(function(type){
      return function(data) {
        // console.log(type);
        return self._registry.getApi(type).get(data);
      };
    });
    return this.get(resolveFns(params, chain), true, _noInputTransform);
  }

  // apply input-transform
  if(_noInputTransform !== true && this.transform.input) {
    return Promise.resolve(resolveFns(params, this.transform.input.slice(0))).then(function(data){
      return self.get(data, _noChain, true);
    });
  }

  // check input against schema
  if(this.validate.input && !this.validate.input(params)) {
    return Promise.reject(ValidationError(this.type, 'Invalid input', this.validate.input));
  }

  // it might have been chain-calls-only
  if(!this.url) {
    return _transformAndValidateOutput(Promise.resolve(params));
  }

  // console.log(this.type, this.url, params);
  var url = interpolate(this.url, params);
  // console.log('=>', url);

  return _transformAndValidateOutput(
    axios({
      method: 'get',
      url: url,
    }).then(function(res){
      return res.data;
    })
  );

  function _transformAndValidateOutput(promise) {
    return promise
      .then(function(data){
        // apply output-transform
        if(self.transform.output) {
          return Promise.resolve(resolveFns(data, self.transform.output.slice(0)));
        }
        return data;
      })
      .then(function(data){
        // check output against schema
        if(self.validate.output && !self.validate.output(data)) {
          return Promise.reject(ValidationError(self.type, 'Invalid output', self.validate.output));
        }
        return data;
      })
    ;
  }
};

Api.prototype.post = function(params, data) {
  var url = interpolate(this.url, params);
  return axios({
    method: 'post',
    url: url,
    data: data
  }).then(function(res){
    return res.data;
  });
};

Api.prototype.put = function(params, data) {
  var url = interpolate(this.url, params);
  return axios({
    method: 'put',
    url: url,
    data: data
  }).then(function(res){
    return res.data;
  });
};

Api.prototype.del = function(params) {
  var url = interpolate(this.url, params);
  return axios({
    method: 'delete',
    url: url
  }).then(function(res){
    return res.data;
  });
};

//

function ValidationError(type, msg, validate) {
  var err = new Error(''+msg+' for '+type+'\n\t'+validate.errors.map(function(err, index){
    return '['+index+'] '+(err.dataPath?'`'+err.dataPath+'` ':'')+err.message+' (schemaPath '+err.schemaPath+', params '+JSON.stringify(err.params)+')';
  }).join('\n\t'));
  err.errors = validate.errors.slice(0);
  return err;
}

//

function resolveFns(data, fns) {
  if(data instanceof Promise) {
    return data.then(function(data){
      return resolveFns(data, fns);
    });
  }
  if(fns.length === 0) return data;
  return resolveFns(fns.shift()(data), fns);
}

function interpolate(str, rep) {
  if(!rep) return str;
  str = str.replace(/{{\w+}}/g, function(all) {
    var name = all.slice(2,-2);
    if(rep[name] == null) {
      throw new Error('Missing param: '+name);
    }
    return rep[name];
  });
  return str;
}
