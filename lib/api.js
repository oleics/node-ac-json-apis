
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

  this.transform = props.transform || { /* input: {}, output: {} */ };
  this.schema = props.schema || { /* input: {}, output: {} */ };
  this.defaults = props.defaults || { /* input: {}, output: {} */ };
  this.relay = props.relay;
  this.withCredentials = props.withCredentials == null ? true : props.withCredentials;

  this.validate = {};
  if(this.schema.input) {
    this.validate.input = this._registry.ajv.compile(this.schema.input);
  }
  if(this.schema.output) {
    this.validate.output = this._registry.ajv.compile(this.schema.output);
  }
}

// Rest

Api.prototype.rest = function(params, options) {
  if(this._rest) {
    if(params == null) {
    }
    return this._rest.then(function(rest){
      return rest.get(params, options);
    });
  }
  this._rest = new Rest(new Api(Object.assign(
    {},
    this
  ), this._registry), params, options);
  return this._rest;
};

// Requests

Api.prototype.getRelayUrl = function(url) {
  if(!this.relay) return url;
  return this.relay+encodeURIComponent(url);
};

Api.prototype.get = function(params, options) {
  var self = this;

  if(options == null) options = {};

  // resolve to params if params is a promise
  if(params instanceof Promise) {
    return params.then(function(data){
      return self.get(data, options);
    });
  }

  // apply defaults for input
  if(this.defaults.input) {
    params = Object.assign({}, this.defaults.input, params);
  }

  // chain api-calls
  var chain = (options.noChain === true ? [] : (this.chain||[])).slice(0);
  if(chain.length) {
    chain = chain.map(function(type){
      return function(data) {
        // console.log(type);
        return self._registry.getApi(type).get(data);
      };
    });
    return this.get(resolveFns(params, chain), Object.assign({}, options, { noChain: true }));
  }

  // apply input-transform
  if(options.noInputTransform !== true && this.transform.input) {
    return Promise.resolve(resolveFns(params, this.transform.input.slice(0))).then(function(data){
      return self.get(data, Object.assign({}, options, { noInputTransform: true }));
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

  if(options.dryrun) {
    console.log('dryrun...');
  }
  return _transformAndValidateOutput(
    options.dryrun ? Promise.resolve({}) : axios({
      method: 'get',
      url: this.getRelayUrl(url),
      withCredentials: this.withCredentials,
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
      .then(function(data){
        // apply defaults for output
        if(self.defaults.output) {
          data = Object.assign({}, self.defaults.output, data);
        }
        // apply input as default for output
        // if(self.defaults.input) {
        //   Object.keys(self.defaults.input).forEach(function(key){
        //     if(data[key] == null) {
        //       data[key] = self.defaults.input[key];
        //     }
        //   });
        // }
        data = Object.assign({}, params, data);
        return data;
      })
    ;
  }
};

Api.prototype.post = function(params, data) {
  var url = interpolate(this.url, params);
  return axios({
    method: 'post',
    url: this.getRelayUrl(url),
    data: data,
    withCredentials: this.withCredentials,
  }).then(function(res){
    return res.data;
  });
};

Api.prototype.put = function(params, data) {
  var url = interpolate(this.url, params);
  return axios({
    method: 'put',
    url: this.getRelayUrl(url),
    data: data,
    withCredentials: this.withCredentials,
  }).then(function(res){
    return res.data;
  });
};

Api.prototype.del = function(params) {
  var url = interpolate(this.url, params);
  return axios({
    method: 'delete',
    url: this.getRelayUrl(url),
    withCredentials: this.withCredentials,
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
