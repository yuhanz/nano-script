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

    it('should parse function', function() {
      exp = new NanoContext().expression(["f", "(", "a", ",", "b", ")"])
      assert.deepEqual(exp, ["func", "f", ["a", "b"]])
    });

    it('should parse ternary expression', function() {
      exp =  new NanoContext().expression(["c", "?", "0", ":", "1"])
      assert.deepEqual(exp, ["?", "c", [":", "0", "1"]])
    });

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
});
