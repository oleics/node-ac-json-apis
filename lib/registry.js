
var Ajv = require('ajv');
var Api = require('./api');

module.exports = Registry;

function Registry() {
  if(!(this instanceof Registry)) return new Registry();
  this.apis = {};
  this.ajv = new Ajv(); // json-schema validator
}

Registry.prototype.addApi = function(props) {
  this.apis[props.type] = props;
  return this;
};

Registry.prototype.getApi = function(type) {
  var api = new Api(this.apis[type], this);
  return api;
};
