/**
 * Nano language: supports the following features
 *  a=10
 *  a="abc do"
 *  a=a+b*2-6
 *  a=b>0?b:0
 *  a=[]
 *  a=[1,2,3]
 *  a=!b
 *  a==b
 *  a>b
 *  a[b] = 10
 *  x = a[b]
 * f(a,b)=>{ a=a+b; b+1 }
 *  map(f,a)
 *  reduce(f,0,[a,b])
 *  flatten(a)
 * # This is a comment
 * TODO:
 *  arr.length
 *
 * Author: Yuhan Zhang
 * Email:  yuhanz@gmail.com
 * Date: 11/18/2016
 */

function NanoContext() {
  this.variables = {};

  function str2set(s) {
     return s.split("").reduce(function(a,b) {a[b]=1; return a;}, {})
  }

  var syms = str2set("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_$.")
  var ops = str2set("#+-*/%=><&|:!?~^")
  var brs = str2set("[](){},")
  var des = str2set("\n;")
  var qus = str2set("\"'")
  var end = str2set("];,)}")

  var precedents = [
    "&&", "||",
    ">=", "<=", ">", "<", "==",
    "+", "-",
    "*", "/",
    "()", "func"]

  replacePattern = /({{[^}]*}})/

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
    exp = fixExpressionForSign(exp)
    if(Array.isArray(exp)) {
      var nop = exp[0]
      if(precedents.indexOf(op) > precedents.indexOf(nop)) {
        return [nop, chain(op, token, exp[1]), exp[2]]
      }
    }
    return [op, token, exp]
  }

  function furtherOperation(exp, tokens) {
    if(tokens.length == 0 || ';' == (to2 = tokens[0]) || ')' == to2) {
      return exp
    }
    if(to2 == "=>") {
      if(exp[0] != "func") {
        throw "invalid symbol =>";
      }
      tokens.shift()
      if(tokens.shift() != "{") {
        throw "function definition not starting with {"
      }
      statements = []
      while(tokens.length > 0 && tokens[0] != "}") {
        statements.push(expression(tokens));
        if(tokens[0] == ";") {
          tokens.shift()
        }

      }
      if(tokens.length == 0 || tokens.shift() != "}") {
        throw "function definition is not closed properly"
      }
      return ["=>", exp[1], exp[2], statements]
    }

    var c2 = to2[0]
    if(ops[c2]) {
      var operator = tokens.shift()
      var exp2 = expression(tokens)
      return chain(operator, exp, exp2)
    }
    throw "unexpected operation: " + to2
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
        if(!to2 || end[to2[0]]) {
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
          if(!tokens.length || (t2=tokens[0][0]) == ',' || t2 == ')') {
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
          return furtherOperation(["func", to, args], tokens)
        }
      } else if(ops[c]) {
        // operator
        tokens.shift()
        if(c == '#') {
          do {
            var t = tokens.shift();
          } while( t != ";" && t);
          return null;
        }
        var exp = expression(tokens)
        return [to, exp]
      } else if(c == "(") {
        tokens.shift()
        var exp = expression(tokens)
        if(")" != (t = tokens.shift())) {
          throw "parenthesis are not balanced: " + t
        }
        return furtherOperation(["()", exp], tokens)
      } else if(c == "[") {
        tokens.shift()
        // array
        var args = [];
        if(tokens[0] != ']') {
          do {
            args.push(expression(tokens))
            var t = tokens.shift()
          } while(t == ",");
        } else {
          var t = tokens.shift()
        }
        if(t != "]") {
          throw "square brackets for array is not closed"
        }
        return furtherOperation(["{}", args], tokens)
      } else {
        throw "illegal start of expression: " + to
      }
  }

  function fixExpressionForSign(expression) {
    if(!expression) {
      return expression
    }
    op = expression[0]
    if(op == '-' && expression[2] == undefined && Array.isArray(expression[1])) {
      expression = expression[1]
      expression[1] = [op, expression[1]]
    }

    return expression;
  }

  this.expression = function(tokens) {
    exp = expression(tokens);
    return fixExpressionForSign(exp);
  }

  this.createChildContext = function(params, values) {
    var childContext = new NanoContext();
    if(values) {
      for(var i=0;i<params.length;i++) {
        childContext.variables[params[i]] = values[i];
      }
    }
    for(var i=0;i<this.variables.length;i++) {
      if(v=this.variables[i] instanceof Function) {
        childContext.variables[k] = v
      }
    }
    return childContext;
  }

  this.createFunctionPointer = function(params, statements, name) {
    var parentContext = this;
    return function() {
      var childContext = parentContext.createChildContext(params);
      childContext.variables[name] = arguments.callee
      for(var i=0;i<params.length;i++) {
        childContext.variables[params[i]] = arguments[i];
      }
      return statements.reduce(function(r, exp) {
        return childContext.interpret(exp)
      }, null);
    }
  }

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
      } else if(v == 'null') {
        return null;
      }

      // js function
      value = this[v];
      if(value instanceof Function) {
        return value;
      }

      // variable
      value = this.variables[v];
      if(value == undefined) {
        throw "undefined variable: " + v;
      }
      return value;
    }

    // array
    var op = expression[0]

    if(op == "=>") {
      name = expression[1]
      if(this[name] || this.variables[name]) {
        throw "function / variable already defined: " + name
      }
      this.variables[name] = this.createFunctionPointer(expression[2], expression[3], name)
    } else if(op == '=') {
      var n = expression[1];
      var v = this.interpret(expression[2]);
      if(typeof n == 'string') {
        this.variables[n] = v;
      } else {
        if(n[0] != '[]') {
          throw "invalid variable for assignment: " + n[0]
        }
        var name = n[1];
        var index = this.interpret(n[2])
        var t = this.variables[name]
        if(t == undefined) {
          throw "undefined variable name: " + name
        }
        if(typeof t != 'object') {
          throw "variable is not an array for array assignment: " + name
        }
        this.variables[name][index] = v;
      }
      return v;
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
    } else if(op == '[]') {
      var v = expression[1]
      if('object' != typeof this.variables[v]) {
        throw 'varible is not an array / object: ' + v
      }
      var index = this.interpret(expression[2])
      if((x = this.variables[v][index]) == undefined) {
        throw 'undefined index: ' + index + ' on variable: ' + v;
      }
      return x;
    } else if(op == '{}') {
      arr = expression[1]
      for(var i=0;i<arr.length;i++) {
        arr[i] = this.interpret(arr[i]);
      }
      return arr
    } else if(op == 'func') {
      name = expression[1]
      args = expression[2]
      values = []
      for(var i=0;i<args.length;i++) {
        values.push(this.interpret(args[i]))
      }
      fn = this.variables[name]
      if(fn == undefined) {
        "function " + fn + " is undefined"
      }
      if(!(fn instanceof Function)) {
        throw name + " is not a function"
      }

      return fn.apply(null, values)
    } else {
      var l = this.interpret(expression[1]);
      if(expression[2] == undefined) {
        if(op == '+') {
          return l
        } else if(op == '-') {
          return -l
        } else {
          throw "missing right-hand side operand with op"
        }
      }
      var r = this.interpret(expression[2]);
      return op == '+' ? l + r :
             op == '-' ? l - r :
             op == '*' ? l * r :
             op == '/' ? l / r :
             op == '%' ? l % r :
             op == '>' ? l > r :
             op == '<' ? l < r :
             op == '==' ? l == r :
             op == '!=' ? l != r :
             op == '>=' ? l >= r :
             op == '<=' ? l <= r :
             op == '&&' ? l && r :
             op == '||' ? l || r :
             op == '^' ? l ^ r :
             op == '&' ? l & r :
             op == '|' ? l | r :
             op == '<<' ? l << r :
             op == '>>' ? l >> r :
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
          if(tokens.indexOf("=>") >= 0) {
            while(ts[i] != '}') {
              if(i++ >= ts.length) {
                throw "failed to find closing of function definition '}'"
              }
            }
            tokens = ts.slice(start, ++i);
          }
          var expression = this.expression(tokens);
          this.interpret(expression);
        }
        start = i + 1;
      }
    }

  }

  this.markup = function(input) {
    // variable replacement
    parts = input.split(replacePattern)
    var variables = this.variables
    text = parts.map(function(p) {
      if(p.match(replacePattern)) {
        var name = p.substring(2, p.length - 2);
        return variables[name];
      } else {
        return p
      }
    }).join('')
    return text

  }
}
