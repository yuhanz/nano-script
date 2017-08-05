var fs = require('fs');
var vm = require('vm');
var path = './nano-script.js';

var code = fs.readFileSync(path);
vm.runInThisContext(code);

var assert = require('assert');


describe('Nano.run', function() {
    it('should run code', function() {
      var context = new NanoContext()
      code = "a = 1; b = 2;\nc = a + b * 3;";
      context.run(code);
      assert.equal(context.variables['a'], 1)
      assert.equal(context.variables['b'], 2)
      assert.equal(context.variables['c'], 7)
    });

    it('should run code with positive / negative signs', function() {
      var context = new NanoContext()
      code = "a = -1 + 3 ";
      context.run(code);
      assert.equal(context.variables['a'], 2)

      code = "b = + 1 - 3 ";
      context.run(code);
      assert.equal(context.variables['b'], -2)

      code = "x = -(a*b)";
      context.run(code);
      assert.equal(context.variables['x'], 4)

      code = "y = -(1 + 2)";
      context.run(code);
      assert.equal(context.variables['y'], -3)


    });


    it('should initialize array', function() {
      var context = new NanoContext()
      code = "a = [1 , 3];";
      context.run(code);
      assert.deepEqual(context.variables['a'], [1,3]);
    });

    it('should initialize empty array', function() {
      var context = new NanoContext()
      code = "a = [];";
      context.run(code);
      assert.deepEqual(context.variables['a'], []);
    });


    it('should calculate with array value', function() {
      var context = new NanoContext()
      code = "a = [1, 3, 3]; x = a[0] + a[2];";
      context.run(code);
      assert.deepEqual(context.variables['a'], [1, 3, 3]);
      assert.deepEqual(context.variables['x'], 4);
    });

    it('should assign value to array by int key', function() {
      var context = new NanoContext()
      code = "a = [1, 3, 3]; a[3] = 10;";
      context.run(code);
      assert.deepEqual(context.variables['a'], [1, 3, 3, 10]);
    });

    it('should assign value to array by string key', function() {
      var context = new NanoContext()
      code = "b = []; b['x'] = 'nice';";
      context.run(code);
      assert.deepEqual(context.variables['b'], {'x':'nice'});
    });


    it('should run code with precedent', function() {
      var context = new NanoContext()
      code = "a = 1; b = 2;c = 10 * 5 + a + b * 3 * (a + (6/b - 4)*1);";
      context.run(code);
      assert.equal(context.variables['a'], 1)
      assert.equal(context.variables['b'], 2)
      assert.equal(context.variables['c'], 51)
    });

    it('should run code with ternary operation', function() {
      var context = new NanoContext()
      code = "a = 1; b = 2;c = a > 0 && b > 0 ? 1 + 5 : 3;";
      context.run(code);
      assert.equal(context.variables['a'], 1)
      assert.equal(context.variables['b'], 2)
      assert.equal(context.variables['c'], 6)
    });

    it('should run code with string', function() {
      var context = new NanoContext()
      code = "a = 'hello'; b = 2; c = a + ' ' + b";
      context.run(code);
      assert.equal(context.variables['a'], 'hello')
      assert.equal(context.variables['b'], 2)
      assert.equal(context.variables['c'], 'hello 2')
    });

    it('should run code with boolean and null', function() {
      var context = new NanoContext()
      code = "a = null; b = true; c = false";
      context.run(code);
      assert.equal(context.variables['a'], null)
      assert.equal(context.variables['b'], true)
      assert.equal(context.variables['c'], false)
    });

    it('should pass value of object by referernce', function() {
      var context = new NanoContext()
      code = "a = []; b = a; a[0] = 2; c = []; c[0] = b";
      context.run(code);
      assert.deepEqual(context.variables['a'], [2])
      assert.deepEqual(context.variables['b'], [2])
      assert.deepEqual(context.variables['c'], [[2]])
    });

    // it('should handle 2D array', function() {
    //   var context = new NanoContext()
    //   code = "a = [1,2]; b = []; b[0] = a; c = b[0][0]";
    //   context.run(code);
    //   assert.deepEqual(context.variables['a'], [1,2])
    //   assert.deepEqual(context.variables['b'], [[1,2]])
    //   assert.deepEqual(context.variables['c'], 1)
    // });

    it('should invoke javascript function', function() {
      var context = new NanoContext()
      context.variables['sqrt'] = Math.sqrt;
      code = "a = 36; b = sqrt(a)";
      context.run(code);
      assert.equal(context.variables['a'], 36)
      assert.equal(context.variables['b'], 6)
    });

    it('should invoke javascript function with array input', function() {
      var context = new NanoContext()
      context.variables['sort'] = function(arr) {
        return arr.sort();
      };
      code = "b = sort([2,3,1])";
      context.run(code);
      assert.deepEqual(context.variables['b'], [1,2,3])
    });

    it('should invoke javascript function without argument', function() {
      var context = new NanoContext()
      context.variables['random'] = Math.random;
      code = "a = 36; b = random()";
      context.run(code);
      assert.equal(context.variables['b'] >0 && context.variables['b'] < 1, true)
    });

    it('should invoke self-defined function', function() {
      var context = new NanoContext()
      code = "f(x,y) => { x + y; }\na = 3; b = 2; x = f(3, 2);";
      context.run(code);
      assert.equal(context.variables['a'], 3)
      assert.equal(context.variables['b'], 2)
      assert.equal(context.variables['x'], 5)
    });

    it('should invoke self-defined function in expression', function() {
      var context = new NanoContext()
      code = "f(x,y) => { x + y; }\na = 3; b = 2; x = f(3, 2); y = f(1,1) + f(2,2);";
      context.run(code);
      assert.equal(context.variables['a'], 3)
      assert.equal(context.variables['b'], 2)
      assert.equal(context.variables['x'], 5)
      assert.equal(context.variables['y'], 6)
    });


    it('should invoke self-defined function', function() {
      var context = new NanoContext()
      code = "f(x,y) => { a = x + y; 2 * a }\na = 3; b = 2; x = f(3, 2);";
      context.run(code);
      assert.equal(context.variables['a'], 3)
      assert.equal(context.variables['b'], 2)
      assert.equal(context.variables['x'], 10)
    });

    it('should do lambda with js functions', function() {
      var context = new NanoContext()
      context.variables['map'] = function(f, arr) {
        return arr.map(f);
      }
      context.sqrt = Math.sqrt;

      code = "b = [4,9]; a = map(sqrt, b);";
      context.run(code);
      assert.deepEqual(context.variables['a'], [2,3]);
    });

    it('should do lambda on user-defined function', function() {
      var context = new NanoContext()
      context.variables['map'] = function(f, arr) {
        return arr.map(f);
      }
      code = "f(x) => { x * 2; }\na = map(f, [1,2]);";
      context.run(code);
      assert.deepEqual(context.variables['a'], [2,4]);
    });

    it('should do recursive calls', function() {
      var context = new NanoContext()
      code = "f(x) => { x <=1 ? 1 : f(x-1) + f(x-2); }\n v2 = f(2); v3 = f(3); v4 = f(4); v5 = f(5);"
      context.run(code);
      assert.equal(context.variables['v2'], 2);
      assert.equal(context.variables['v3'], 3);
      assert.equal(context.variables['v4'], 5);
      assert.equal(context.variables['v5'], 8);
    });

    it('should return the value from the last statement', function() {
      var context = new NanoContext()
      code = "a = 10; 100 > a"
      var result = context.run(code);
      assert.equal(context.variables['a'], 10);
      assert.equal(result, true);
    });

    it('should arithmetic correctly', function() {
      var context = new NanoContext()
      context.variables['c1'] = {'a':10, 'b': 3}
      context.variables['c2'] = {'a':5, 'b': 2}
      code = "c1['a'] / c2['a'] * 2"
      var result = context.run(code);
      assert.equal(result, 4);

      code = "c1['a'] / c2['a'] * 2 * c1['b'] / (c1['b'] + c2['b'])"
      var result = context.run(code);
      assert.equal(result, 2.4);
    });

    it('should skip comments', function() {
      var context = new NanoContext()
      code = "# --- start of MAIN"
      var result = context.run(code);
    });


});
