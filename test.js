
var assert = require('assert');

var Registry = require('./lib/registry');
var Api = require('./lib/api');
var Rest = require('./lib/rest');


var REQUEST_QUERY = 'Berlin';


// Step 1: Register new apis

var reg = new Registry();

reg
  .addApi({
    type: 'chronicles',
    url: 'https://chroniclingamerica.loc.gov/search/titles/results/?terms={{q}}&format=json&page={{page}}',
    defaults: {
      page: 1,
    }
  })
  .addApi({
    type: 'weather-location',
    url: 'https://www.metaweather.com/api/location/search/?query={{query}}',
    transform: {
      input: [
        function(data){
          // refactor?
          return data;
        },
      ],
      output: [
        function(data){
          return data[0];
        },
        function(data){
          data.latt_long = data.latt_long.split(',');
          return data;
        },
      ]
    },
    schema: {
      input: {
        "type": "object",
        "properties": {
          "query": { "type": "string" }
        },
        "required": [ "query" ]
      },
      output: {
        "type": "object",
        "properties": {
          "title": { "type": "string" },
          "latt_long": { "type": "array", "items": { "type": "string" } },
          "woeid": { "type": "integer" }
        },
        "required": [ "title", "latt_long", "woeid" ]
      }
    },
  })
  .addApi({
    type: 'weather-of-woeid',
    url: 'https://www.metaweather.com/api/location/{{woeid}}/',
    schema: {
      input: {
        "type": "object",
        "properties": {
          "woeid": { "type": "integer" }
        },
        "required": [ "woeid" ]
      }
    },
  })
  .addApi({
    type: 'weather',
    chain: [
      'weather-location',
      'weather-of-woeid',
    ],
    transform: {
      input: [
        function(data){
          // console.log('weather input:', data);
          return data;
        },
      ],
      output: [
        function(data){
          console.log('');
          console.log(data.sun_rise, data.sun_set);
          console.log(data.title, data.location_type, data.timezone, data.latt_long);
          data.consolidated_weather.forEach(function(data){
            console.log(
              '  %s\n  temp %s°C (%s°C < %s°C) pressure %s, humidity %s, wind %s %s, vis %s, pred %s (%s)\n',
              data.weather_state_name,
              data.the_temp.toFixed(1),
              data.min_temp.toFixed(1),
              data.max_temp.toFixed(1),
              data.air_pressure.toFixed(1),
              data.humidity,
              data.wind_speed.toFixed(1),
              data.wind_direction_compass,
              data.visibility,
              data.predictability,
              data.created
            );
          });
          return data;
        },
      ]
    },
  })
;

// Step 2: Get api from registry

runTests([
  test1_SingleApiCalls,
  test2_ChainedApiCalls,
  test3_ReactiveApiCalls,
  test4_NewsApiCall,
])
  .then(function(data){
    console.log('DONE');
  })
  .catch(function(err){
    console.error(err.stack||err);
    console.error('FAILED');
  })
;

////////////////////////////////////////////////////////////////////////////////

function runTests(fns, ctx) {
  var promise = Promise.resolve(ctx);
  fns.forEach(function(fn){
    promise = promise
      .then(function(d){
        console.log('Running %s ...', fn.name);
        return d;
      })
      .then(function(_ctx){
        return fn(_ctx == null ? ctx : _ctx);
      })
      .then(function(d){
        console.log('OK %s', fn.name);
        return d;
      })
    ;
  });
  return promise;
}

////////////////////////////////////////////////////////////////////////////////

function test1_SingleApiCalls() {
  // GET some data
  var api = reg.getApi('weather-location');
  assert(api instanceof Api);
  return api.get({
    query: REQUEST_QUERY
  })
    .then(function(data){
      assert.strictEqual(data.title, REQUEST_QUERY);
      return reg.getApi('weather-of-woeid').get(data);
    })
  ;
}

function test2_ChainedApiCalls() {
  var api = reg.getApi('weather');
  assert(api instanceof Api);
  return api.get({
    query: REQUEST_QUERY
  });
}

function test3_ReactiveApiCalls() {
  var api = reg.getApi('weather');
  assert(api instanceof Api);
  var rest = api.rest({
    query: REQUEST_QUERY
  });
  assert(rest instanceof Promise);
  return rest.then(function(rest){
    assert(rest instanceof Rest);
    assert.strictEqual(rest.title, REQUEST_QUERY);
    return rest.get().then(function(rest){
      assert(rest instanceof Rest);
      assert.strictEqual(rest.title, REQUEST_QUERY);
      return rest;
    })
  });
}

function test4_NewsApiCall() {
  var api = reg.getApi('chronicles');
  return api.get({
    q: REQUEST_QUERY
  }).then(function(data){
    console.log(Object.keys(data));
    console.log(
      'totalItems %d, itemsPerPage %d, startIndex %d, endIndex %s',
      data.totalItems, data.itemsPerPage, data.startIndex, data.endIndex
    );
    console.log(Object.keys(data.items[0]));
    data.items.forEach(function(data){
      // console.log(Object.keys(data));
      console.log('  %s %s\n  %s-%s | %s | %s\n  %s\n', data.title, data.edition||'', data.start_year, data.end_year, data.publisher, data.language, data.url);
    });
    return data;
  });
}
