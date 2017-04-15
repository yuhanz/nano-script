var fs = require('fs');
var vm = require('vm');
var path = './nano-script.js';

var code = fs.readFileSync(path);
vm.runInThisContext(code);

var assert = require('assert');

describe('Nano.interpret', function() {
    it('should interpret assignment', function() {
      var context = new NanoContext();
      context.interpret(["=", "a", "10"])
      assert.deepEqual(context.variables['a'], 10)

      context.interpret(["=", "s", "'abc'"])
      assert.deepEqual(context.variables['s'], 'abc')

      context.interpret(["=", "s", "a"])
      assert.deepEqual(context.variables['s'], 10)

      context.interpret(["=", "s", "'hello'"])
      assert.deepEqual(context.variables['s'], 'hello')
    });

    it('should interpret operator', function() {
      var context = new NanoContext();

      var ops = ['+', '-', '*', '/', '>', '<', '>=', '<=', '==', '!='];
      var expected = [11, 1, 30, 1.2, true, false, true, false, false, true]
      for(var i=0;i<ops.length;i++) {
        context.interpret([ '=', 'a', [ops[i], '6', '5']])
        assert.deepEqual(context.variables['a'], expected[i])
      }
    });

    it('should interpret logical operators', function() {
        var context = new NanoContext();
        context.interpret([ '=', 'a', ['&&', 'true', ['!', 'false']]]);
        assert.equal(context.variables['a'], true);

        context.interpret([ '=', 'b', ['||', 'false', 'a']]);
        assert.equal(context.variables['b'], true);

        context.interpret([ '=', 'b', ['||', 'false', ['!', 'b']]]);
        assert.equal(context.variables['b'], false);
    });

    it('should interpret negative / positive signs', function() {
      var context = new NanoContext();
      context.interpret([ '=', 'a', [ '+', '5', ['-', '2']]]);
      assert.equal(context.variables['a'], 3);

      context.interpret([ '=', 'a', [ '-', ['-', '5'], ['+', '2']]]);
      assert.equal(context.variables['a'], -7);
    });

    it('should interpret ternary operator', function() {
      var context = new NanoContext();
      context.interpret(['=', 'c', 'true'])
      context.interpret(['=', 'a', ["?", "c", [":", "0", "1"]]]);

      assert.equal(context.variables['a'], 0)

      context.interpret(['=', 'c', 'false'])
      context.interpret(['=', 'a', ["?", "c", [":", "0", "1"]]]);
      assert.equal(context.variables['a'], 1)
    });
});
