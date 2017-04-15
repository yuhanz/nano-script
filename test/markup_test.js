var fs = require('fs');
var vm = require('vm');
var path = './nano-script.js';

var code = fs.readFileSync(path);
vm.runInThisContext(code);

var assert = require('assert');

describe('Nano.markup', function() {
    it('should replace variable with values', function() {
      var context = new NanoContext()
      code = "x = 'nano'; b = 2; ";
      context.run(code);
      assert.equal(context.variables['x'], 'nano');
      assert.equal(context.variables['b'], 2);

      assert.equal(context.markup("hello"), "hello")
      assert.equal(context.markup("welcome {{b}} use {{x}}"), "welcome 2 use nano")
      assert.equal(context.markup("{{b}} help\n the world"), "2 help\n the world")
    });
});
