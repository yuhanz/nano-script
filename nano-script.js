/**
 * Nano language: support the following features
 *
 *
 *  a=10
 *  a="abc do"
 *  a=a+b*2-6
 *  a=b>0?b:0
 *  a=[]
 *  a=[1,2,3]
 *  a=!b
 *  a<<b
 *  a[n]<<b
 *  a==b
 *  a>b
 *  a[b]
 *  a>>b
 *  a[n]>>b
 *  "My name is {a.name}"
 *  arr.length
 *  f(a,b)=>{ a=a+b; b+1 }
 *  map(f,a)
 *  reduce(f,0,[a,b])
 *  flatten(a)
 *
 * Author: Yuhan Zhang
 * Email:  yuhanz@gmail.com
 * Date: 11/18/2016
 */

function NanoContext() {
  this.variables = [];

  function str2set(s) {
     return s.split("").reduce(function(a,b) {a[b]=1; return a;}, {})
  }

  var syms = str2set("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_$.")
  var ops = str2set("+-*/=><&|:!?")
  var brs = str2set("[](){},")
  var des = str2set("\n;")
  var qus = str2set("\"'")

  var precedents = [
    "&&", "||",
    ">=", "<=", ">", "<", "==",
    "+", "-",
    "*", "/",
    "()"]

    function tokenize(str) {
      tokens = [];
      var s;
      exp = null;
      var quo = null;
      for(var i=0;i<str.length+1;i++) {
        c = str[i]
        t = syms[c] ? "s" : ops[c] ? "o" : null;
        if(exp != null) {
          if(exp == t || quo && quo != c) {
            s += c;
            continue
          } else {
            if(quo) {
              s += quo
              c = null
            }
            tokens.push(s)
            exp = null;
            quo = null;
            s = ""
            if(!c) {
              continue
            }
          }
        }

        if(t == ' ') {
          continue;
        }
        if(!t) {
          if(brs[c]) {
              tokens.push(c)
          } else if(des[c]) {
              tokens.push(";")
          } else if(qus[c]) {
              quo = exp = c;
              s = c
          }
        } else {
          s = c
          exp = t
        }
      }
      return tokens;
    }

  this.tokenize = tokenize;

  function chain(op, token, exp) {
    if(Array.isArray(exp)) {
      var nop = exp[0]
      if(precedents.indexOf(op) > precedents.indexOf(nop)) {
        return [nop, chain(op, token, exp[1]), exp[2]]
      }
    }
    return [op, token, exp]
  }


  // exp: s
  // exp: s[exp]
  // exp: s(exp,exp,exp...)
  // exp: o exp
  // exp: (exp)
  // exp: exp o exp
  // exp: exp ? exp : exp
  // exp: exp .s
  function expression(tokens) {
      var to = tokens[0]
      var c = to[0]
      if(syms[c] || qus[c]) {
        tokens.shift()
        var to2 = tokens[0]
        if(!to2 || str2set("];,)")[to2[0]]) {
          return to
        }
        var c2 = to2[0]
        if(ops[c2]) {
          var operator = tokens.shift()
          var exp = expression(tokens)
          return chain(operator, to, exp)
        } else if(c2 == "[") {
          tokens.shift()
          var exp = expression(tokens)
          if("]" != tokens.shift()) {
            throw "brackets are not balanced"
          }
          exp = ["[]", to, exp]
          if(!tokens.length) {
            return exp
          }
          if(ops[tokens[0][0]]) {
            operator = tokens.shift()
            return [operator, exp, expression(tokens)]
          }
        } else if(c2 == "(") {
          tokens.shift()
          // function
          var args = []
          do {
            args.push(expression(tokens))
            var t = tokens.shift()
          } while(t == ",");
          if(t != ")") {
            throw "parenthesis for function is not closed"
          }
          return ["func", to, args]
        }
      } else if(ops[c]) {
        // operator
        tokens.shift()
        var exp = expression(tokens)
        return [to, exp]
      } else if(c == "(") {
        tokens.shift()
        var exp = expression(tokens)
        if(")" != tokens.shift()) {
          throw "parenthesis are not balanced"
        }
        return ["()", exp]
      } else if(c == "[") {
        tokens.shift()
        // array
        var args = [];
        do {
          args.push(expression(tokens))
          var t = tokens.shift()
        } while(t == ",");
        if(t != "]") {
          throw "square brackets for array is not closed"
        }
        return ["{}", args]
      } else {
        throw "illegal start of expression: " + to
      }
  }

  this.expression = expression;

  this.interpret = function(expression) {
    if(typeof expression == 'string') {
      v = expression;
      if(v[0] == "'" || v[0] == '"') {  // string
        return v.substring(1, v.length-1);
      }
      var v = parseFloat(expression)
      if(!isNaN(v)) { // number
        return v;
      }

      v = expression;
      if(v == 'true') {
        return true;
      } else if(v == 'false'){
        return false;
      }

      // variable
      value = this.variables[v];
      if(value == 'undefined') {
        throw "undefined variable: " + v;
      }
      return value;
    }

    // array
    var op = expression[0]

    if(op == '=') {
      var n = expression[1];
      var v = this.interpret(expression[2]);
      this.variables[n] = v;
    } else if(op == '!') {
      var v = this.interpret(expression[1]);
      return !v;
    } else if(op == '?') {
      var cond = this.interpret(expression[1]);
      var choice = expression[2];
      if(!choice || ":" != choice[0]) {
        throw "missing : in trenary oprator";
      }
      return this.interpret(choice[cond ? 1 : 2]);
    } else if(op == '()') {
      return this.interpret(expression[1]);
    } else if(op == '{}') {
      arr = expression[1]
      for(var i=0;i<arr.length;i++) {
        arr[i] = this.interpret(arr[i]);
      }
      return arr
    } else {
      var l = this.interpret(expression[1]);
      var r = this.interpret(expression[2]);
      return op == '+' ? l + r :
             op == '-' ? l - r :
             op == '*' ? l * r :
             op == '/' ? l / r :
             op == '>' ? l > r :
             op == '<' ? l < r :
             op == '==' ? l == r :
             op == '!=' ? l != r :
             op == '>=' ? l >= r :
             op == '<=' ? l <= r :
             op == '&&' ? l && r :
             op == '||' ? l || r :
             undefined
    }
  }

  this.run = function(text) {
    ts = this.tokenize(text)
    if(ts[ts.length-1] != ';') {
      ts.push(";");
    }
    var start = 0;
    for(var i=0;i<ts.length;i++) {
      if(ts[i] == ';') {
        if(i > start) {
          var tokens = ts.slice(start, i);
          var expression = this.expression(tokens);
          this.interpret(expression);
        }
        start = i + 1;
      }
    }

  }
}
