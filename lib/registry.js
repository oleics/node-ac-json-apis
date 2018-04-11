
var Ajv = require('ajv');
var Api = require('./api');

module.exports = Registry;

function Registry() {
  if(!(this instanceof Registry)) return new Registry();
  this.apis = {};
  this.tops = [];
  this.ajv = new Ajv(); // json-schema validator
}

Registry.prototype.addApi = function(props) {
  this.apis[props.type] = props;
  if(props.toplevel) {
    this.tops.push(props.type);
  }
  return this;
};

Registry.prototype.getApi = function(type) {
  if(this.apis[type] instanceof Api) {
    return this.apis[type];
  }
  var props = this.apis[type];
  this.apis[type] = new Api(props, this);
  return this.apis[type];
};

//

Registry.prototype.getRest = function(params) {
  if(params == null) params = {};
  var allRest = {};
  this.tops.forEach(function(type){
    allRest[dashToCamel(type)] = this.getApi(type).rest(params[type] ? params[type] : {});
  }, this)
  return allRest;
};

Registry.prototype.getRestFactory = function(params) {
  if(params == null) params = {};
  var self = this;
  var allRest = {};
  this.tops.forEach(function(type){
    allRest[dashToCamel(type)] = function() {
      return self.getApi(type).rest(params[type] ? params[type] : {});
    };
  }, this)
  return allRest;
};

//

Registry.dashToCamel = dashToCamel;

function dashToCamel(str) {
  str = str.split('-');
  return str.shift() + (str.map(ucFirst).join(''));
}

function ucFirst(str) {
  return str.slice(0,1).toUpperCase()+str.slice(1);
}
