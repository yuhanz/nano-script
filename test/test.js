var fs = require('fs');
var vm = require('vm');
var path = './nano-script.js';

var code = fs.readFileSync(path);
vm.runInThisContext(code);

var assert = require('assert');
describe('Nano.tokenize', function() {
    it('should return tokens', function() {
      ts = new NanoContext().tokenize("abc.name=123.05")
      assert.deepEqual(ts, ["abc.name", "=", "123.05"]);
      ts = new NanoContext().tokenize("abc.name = 123.05")
      assert.deepEqual(ts, ["abc.name", "=", "123.05"]);

      ts = new NanoContext().tokenize("abc.name = 123.05 + 'abc' + \"def\";")
      assert.deepEqual(ts, ["abc.name", "=", "123.05", "+", "'abc'", "+", "\"def\"", ";"]);

      ts = new NanoContext().tokenize("numbers[x].value=10;");
      assert.deepEqual(ts, ["numbers", "[", "x", "]", ".value", "=", "10", ";"]);

      ts = new NanoContext().tokenize("x = [1,m[0]]");
      assert.deepEqual(ts, ["x", "=", "[", "1", ",", "m", "[","0", "]", "]" ]);

      ts = new NanoContext().tokenize("abc.name=123.05 + 'abc' + \"def\"; numbers[x].value=10; x = [1,m[0]]")
      assert.deepEqual(ts, ["abc.name", "=", "123.05", "+", "'abc'", "+", "\"def\"", ";",
                        "numbers", "[", "x", "]", ".value", "=", "10", ";",
                        "x", "=", "[", "1", ",", "m", "[","0", "]", "]"]);
      ts = new NanoContext().tokenize("b['x'] = 'nice'");
      assert.deepEqual(ts, ["b","[","'x'","]","=","'nice'"]);
    });
});

describe('Nano.expression', function() {
    it('should parse expressions', function() {
      exp = new NanoContext().expression(["10"])
      assert.deepEqual(exp, "10")
      exp = new NanoContext().expression(["a", "=", "10"])
      assert.deepEqual(exp, ["=", "a", "10"])
      exp = new NanoContext().expression(["a", "[", "3", "]"])
      assert.deepEqual(exp, ["[]", "a", "3"])
      exp = new NanoContext().expression(["a", "[", "3", "]", "=", "10"])
      assert.deepEqual(exp, ["=", ["[]", "a", "3"], "10"])

      exp = new NanoContext().expression(["!", "a"])
      assert.deepEqual(exp, ["!", "a"])

      exp = new NanoContext().expression(["!", "!", "a"])
      assert.deepEqual(exp, ["!", ["!", "a"]])

      exp = new NanoContext().expression(["a", "=", "b", "+", "10", "-", "x"])
      assert.deepEqual(exp, [ '=', 'a', [ '+', 'b', [ '-', '10', 'x' ]]])

      exp = new NanoContext().expression(["a", "=", '"hello"'])
      assert.deepEqual(exp, ["=", "a", "\"hello\""])

      exp = new NanoContext().expression(["2", "*", 'a'])
      assert.deepEqual(exp, ["*", "2", "a"])

    });

    it('should parse expressions with precedent', function() {
      exp = new NanoContext().expression(["a", "=", "b", "*", "10", "-", "x"])
      assert.deepEqual(exp, [ '=', 'a', [ '-', ['*', 'b', '10'], 'x' ]])

      exp = new NanoContext().expression(["a", "=", "c", "+", "b", "*", "10", "-", "x"])
      assert.deepEqual(exp, [ '=', 'a', ['+', 'c', [ '-', ['*', 'b', '10'], 'x' ]]])

      exp = new NanoContext().expression(["a", "=", "c", "+", "b", ">=", "10", "&&", "x"])
      assert.deepEqual(exp, [ '=', 'a', ['&&', ['>=', ['+', 'c', 'b'], '10'], 'x' ]])

      exp = new NanoContext().expression(["(", "a", "+", "b", ")", "*", "2"])
      assert.deepEqual(exp, [ '*',['()', ['+', 'a', 'b']], '2'])

    });

    it('should parse function', function() {
      exp = new NanoContext().expression(["f", "(", "a", ",", "b", ")"])
      assert.deepEqual(exp, ["func", "f", ["a", "b"]])
    });

    it('should parse array initialization', function() {
      exp = new NanoContext().expression(["[", "1", ",", "2", ",", "b", "]"])
      assert.deepEqual(exp, ["{}", ["1", "2", "b"]])
    });

    it('should parse array assignment', function() {
      exp = new NanoContext().expression(["a", "[", "1", "]", "=", "10"])
      assert.deepEqual(exp, ["=", ["[]", "a", "1"], "10"])
    });

    it('should parse array assignment with string', function() {
      exp = new NanoContext().expression(["b","[","'x'","]","=","'nice'"])
      assert.deepEqual(exp, ["=", ["[]", "b", "'x'"], "'nice'"])
    });

    it('should parse ternary expression', function() {
      exp = new NanoContext().expression(["c", "?", "0", ":", "1"])
      assert.deepEqual(exp, ["?", "c", [":", "0", "1"]])

      exp = new NanoContext().expression(["c", ">", "0", "&&", "b", ">=", "3", "?", "0", ":", "1", "+", "2"])
      assert.deepEqual(exp, ["?", ["&&", [">", "c", "0"], [">=", "b", "3"]], [":", "0", ["+", "1", "2"]]])
    });

    it('should parse parenthese', function() {
      exp = new NanoContext().expression(["(", "10", ")"])
      assert.deepEqual(exp, ["()", "10"])

      exp = new NanoContext().expression(["a", "*", "(", "10", "+", "b", ")"])
      assert.deepEqual(exp, ["*", "a", ["()", ["+", "10", "b"]]])
    });


    // it('should parse dot', function() {
    //   exp = expression(["a", ".value", "=", "10", ";"])
    //   assert.deepEqual(exp, ["=", [".value", "a"], "10"]);
    //
    //   exp = expression(["numbers", "[", "x", "]", ".value", "=", "10", ";"])
    //   assert.deepEqual(exp, ["=", [".value", ["[]", "numbers"]], "10"]);
    //
    //   exp = expression(["a", "=", "b", ".value"])
    //   assert.deepEqual(exp, ["=", "a", [".value", "b"]]);
    // });

    it('should parse null', function() {
      exp = new NanoContext().expression(["a", "=", "null"])
      assert.deepEqual(exp, ["=", "a", "null"])
    });

    it('should parse true / false', function() {
      exp = new NanoContext().expression(["a", "=", "true"])
      assert.deepEqual(exp, ["=", "a", "true"])
      exp = new NanoContext().expression(["a", "=", "false"])
      assert.deepEqual(exp, ["=", "a", "false"])
    });

    it('should parse function', function() {
      exp = new NanoContext().expression(["f", "(", "a", ",", "b", ")"])
      assert.deepEqual(exp, ["func", "f", ["a", "b"]])
    });

    it('should parse function in expression', function() {
      exp = new NanoContext().expression(["f", "(", "a", ",", "b", ")", "+", "1"])
      assert.deepEqual(exp, ["+", ["func", "f", ["a", "b"]], "1"])
    });

    it('should parse function in expression at tail ', function() {
      exp = new NanoContext().expression(["+", "1", "f", "(", "a", ",", "b", ")"])
      assert.deepEqual(exp, ["+", "1", ["func", "f", ["a", "b"]]])
    });

    it('should parse ternary expression', function() {
      exp =  new NanoContext().expression(["c", "?", "0", ":", "1"])
      assert.deepEqual(exp, ["?", "c", [":", "0", "1"]])
    });

    it('should parse ternary expression chain', function() {
      exp =  new NanoContext().expression(["c", "?", "0", ":", "y", "?", "1", ":", "-1"])
      assert.deepEqual(exp, ["?", "c", [":", "0", ["?", "y", [":", "-1"]]]])
    });

    it('should parse function definition', function() {
      exp =  new NanoContext().expression(["sum", "(", "a", ",", "b", ")", "=>", "{",
      "a", "+", "b", ";",
       "}"])
      assert.deepEqual(exp, ["=>", "sum", ["a", "b"], [["+", "a", "b"]]])
    });

    it('should skip comments', function() {
      tokens = ["#", "This", "is", "nice"]
      exp = new NanoContext().expression(tokens)
      assert.equal(exp, undefined)
      assert.deepEqual(tokens, [])

      tokens = ["#", "This", "is", "nice", ";"]
      exp = new NanoContext().expression(tokens)
      assert.equal(exp, undefined)
      assert.deepEqual(tokens, [])

      tokens = ["#", "This", "is", "nice", ";", "a", "=", "0" ]
      exp = new NanoContext().expression(tokens)
      assert.equal(exp, undefined)
      assert.deepEqual(tokens, ["a", "=", "0"])
    });

    // it('should parse function definition', function() {
    //   exp =  new NanoContext().expression([ 'f',  '(',  'x',  ',',  'y',  ')',  '=>',  '{',  'x',  '+',  'y',  ';',  '}',  ';',  'a',  '=',  '3',  ';',  'b',  '=',  '2',  ';',  'x',  '=',  'f',  '(',  '3',  ',',  '2',  ')',  ';' ])
    //   assert.deepEqual(exp, ["=>", "f", ["x", "y"], [["+", "x", "y"]]])
    // });

});

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


describe('Nano.run', function() {
    it('should run code', function() {
      var context = new NanoContext()
      code = "a = 1; b = 2;\nc = a + b * 3;";
      context.run(code);
      assert.equal(context.variables['a'], 1)
      assert.equal(context.variables['b'], 2)
      assert.equal(context.variables['c'], 7)
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


    it('should invoke self-defined function', function() {
      var context = new NanoContext()
      code = "f(x,y) => { x + y; }\na = 3; b = 2; x = f(3, 2);";
      context.run(code);
      assert.equal(context.variables['a'], 3)
      assert.equal(context.variables['b'], 2)
      assert.equal(context.variables['x'], 5)
    });

    it('should invoke self-defined function', function() {
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

    it('should do recursive function', function() {
      var context = new NanoContext()
      code = "f(x) => { x <=1 ? 1 : f(x-1) + f(x-2); }\n v2 = f(2); v3 = f(3); v4 = f(4); v5 = f(5);"
      context.run(code);
      assert.equal(context.variables['v2'], 2);
      assert.equal(context.variables['v3'], 3);
      assert.equal(context.variables['v4'], 5);
      assert.equal(context.variables['v5'], 8);
    });

});
