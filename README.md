
ac-json-apis
============

  * manage multiple json-apis
  * chain several json-apis into one call
  * transform api-io (chained map-functions)
  * validate api-io (via json-schema)
  * merge the result of multiple api-calls to one object

Install
-------

```sh
$ npm install ac-json-apis --save
```

Usage
-----

```js
var Registry = require('ac-json-apis')
var registry = new Registry()

registry
  .addApi({
    type: 'chronicles',
    url: 'https://chroniclingamerica.loc.gov/search/titles/results/?terms={{q}}&format=json&page={{page}}',
    defaults: {
      page: 1,
    }
  })

var api = reg.getApi('chronicles')
return api.get({
  q: REQUEST_QUERY
})
  .then(function(data){
    // result from api
  })

```

To be continued...

MIT License
-----------

Copyright (c) 2018 Oliver Leics <oliver.leics@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
