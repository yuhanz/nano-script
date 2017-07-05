var fs = require('fs');
var vm = require('vm');
var path = './nano-script.js';

var code = fs.readFileSync(path);
vm.runInThisContext(code);

var assert = require('assert');


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
      assert.deepEqual(exp, [ '=', 'a', [ '-', [ '+', 'b', '10'], 'x']])

      exp = new NanoContext().expression(["a", "=", '"hello"'])
      assert.deepEqual(exp, ["=", "a", "\"hello\""])

      exp = new NanoContext().expression(["2", "*", 'a'])
      assert.deepEqual(exp, ["*", "2", "a"])


      exp = new NanoContext().expression(["-", "1", "+", "2"])
      assert.deepEqual(exp, ["+", ["-", "1"], "2"])
    });

    it('should parse expressions with precedent', function() {
      exp = new NanoContext().expression(["a", "=", "b", "*", "10", "-", "x"])
      assert.deepEqual(exp, [ '=', 'a', [ '-', ['*', 'b', '10'], 'x' ]])

      exp = new NanoContext().expression(["a", "=", "c", "+", "b", "*", "10", "-", "x"])
      assert.deepEqual(exp, [ '=', 'a', ['-', [ '+', 'c', ['*', 'b', '10']], 'x']])

      exp = new NanoContext().expression(["a", "=", "c", "+", "b", ">=", "10", "&&", "x"])
      assert.deepEqual(exp, [ '=', 'a', ['&&', ['>=', ['+', 'c', 'b'], '10'], 'x' ]])

      exp = new NanoContext().expression(["(", "a", "+", "b", ")", "*", "2"])
      assert.deepEqual(exp, [ '*',['()', ['+', 'a', 'b']], '2'])

      exp = new NanoContext().expression(["a", "=", "-", "1", "*", "10", "+", "2"])
      assert.deepEqual(exp, [ '=', 'a', ["+", [ '-', ["*", "1", "10"]], "2" ]]);

      exp = new NanoContext().expression(["10", "/", "5", "*", "2"])
      assert.deepEqual(exp, [ '*', ["/", "10", "5"], "2"]);

      exp = new NanoContext().expression(["10", "/", "5", "/", "2"])
      assert.deepEqual(exp, [ '/', ["/", "10", "5"], "2"]);

      exp = new NanoContext().expression(["10", "/", "c", "[", "1", "]", "/", "2"])
      assert.deepEqual(exp, [ '/', ["/", "10", ["[]", "c", "1"]], "2"]);

      exp = new NanoContext().expression(["c", "[", "2", "]", "/", "10", "/", "2"])
      assert.deepEqual(exp, [ '/', ["/", ["[]", "c", "2"], "10"], "2"]);

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
    });

    it('should parse ternary expression in chain', function() {
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
      exp = new NanoContext().expression(["1", "+", "f", "(", "a", ",", "b", ")"])
      assert.deepEqual(exp, ["+", "1", ["func", "f", ["a", "b"]]])
    });

    it('should parse ternary expression', function() {
      exp =  new NanoContext().expression(["c", "?", "0", ":", "1"])
      assert.deepEqual(exp, ["?", "c", [":", "0", "1"]])
    });

    it('should parse ternary expression chain', function() {
      exp =  new NanoContext().expression(["c", "?", "0", ":", "y", "?", "1", ":", "2"])
      assert.deepEqual(exp, ["?", "c", [":", "0", ["?", "y", [":", "1", "2"]]]])
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
