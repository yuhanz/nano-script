var fs = require('fs');
var vm = require('vm');
var path = './nano-script.js';

var code = fs.readFileSync(path);
vm.runInThisContext(code);

var assert = require('assert');
describe('Nano.tokenize', function() {
    it('should return tokens', function() {
      ts = Nano.tokenize("abc.name=123.05")
      assert.deepEqual(ts, ["abc.name", "=", "123.05"]);
      ts = Nano.tokenize("abc.name = 123.05")
      assert.deepEqual(ts, ["abc.name", "=", "123.05"]);

      ts = Nano.tokenize("abc.name = 123.05 + 'abc' + \"def\";")
      assert.deepEqual(ts, ["abc.name", "=", "123.05", "+", "'abc'", "+", "\"def\"", ";"]);

      ts = Nano.tokenize("numbers[x].value=10;");
      assert.deepEqual(ts, ["numbers", "[", "x", "]", ".value", "=", "10", ";"]);

      ts = Nano.tokenize("x = [1,m[0]]");
      assert.deepEqual(ts, ["x", "=", "[", "1", ",", "m", "[","0", "]", "]" ]);

      ts = Nano.tokenize("abc.name=123.05 + 'abc' + \"def\"; numbers[x].value=10; x = [1,m[0]]")
      assert.deepEqual(ts, ["abc.name", "=", "123.05", "+", "'abc'", "+", "\"def\"", ";",
                        "numbers", "[", "x", "]", ".value", "=", "10", ";",
                        "x", "=", "[", "1", ",", "m", "[","0", "]", "]"]);
    });
});

describe('Nano.expression', function() {
    it('should parse expressions', function() {
      exp = expression(["10"])
      assert.deepEqual(exp, "10")
      exp = expression(["a", "=", "10"])
      assert.deepEqual(exp, ["=", "a", "10"])
      exp = expression(["a", "[", "3", "]"])
      assert.deepEqual(exp, ["[]", "a", "3"])
      exp = expression(["a", "[", "3", "]", "=", "10"])
      assert.deepEqual(exp, ["=", ["[]", "a", "3"], "10"])

      exp = expression(["!", "a"])
      assert.deepEqual(exp, ["!", "a"])

      exp = expression(["!", "!", "a"])
      assert.deepEqual(exp, ["!", ["!", "a"]])

      exp = expression(["a", "=", "b", "+", "10", "-", "x"])
      assert.deepEqual(exp, [ '=', 'a', [ '+', 'b', [ '-', '10', 'x' ]]])
    });

    it('should parse expressions with precedent', function() {
      exp = expression(["a", "=", "b", "*", "10", "-", "x"])
      assert.deepEqual(exp, [ '=', 'a', [ '-', ['*', 'b', '10'], 'x' ]])

      exp = expression(["a", "=", "c", "+", "b", "*", "10", "-", "x"])
      assert.deepEqual(exp, [ '=', 'a', ['+', 'c', [ '-', ['*', 'b', '10'], 'x' ]]])

      exp = expression(["a", "=", "c", "+", "b", ">=", "10", "&&", "x"])
      assert.deepEqual(exp, [ '=', 'a', ['&&', ['>=', ['+', 'c', 'b'], '10'], 'x' ]])

    });

    it('should parse function', function() {
      exp = expression(["f", "(", "a", ",", "b", ")"])
      assert.deepEqual(exp, ["func", "f", ["a", "b"]])
    });

    it('should parse ternary expression', function() {
      exp = expression(["c", "?", "0", ":", "1"])
      assert.deepEqual(exp, ["?", "c", [":", "0", "1"]])
    });

    it('should parse parenthese', function() {
      exp = expression(["(", "10", ")"])
      assert.deepEqual(exp, ["()", "10"])

      exp = expression(["a", "*", "(", "10", "+", "b", ")"])
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
      exp = expression(["f", "(", "a", ",", "b", ")"])
      assert.deepEqual(exp, ["func", "f", ["a", "b"]])
    });

    it('should parse ternary expression', function() {
      exp = expression(["c", "?", "0", ":", "1"])
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
});
