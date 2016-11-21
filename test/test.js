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
      //assert.equal(ts, []);
    });
});
