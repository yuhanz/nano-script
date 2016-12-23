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


Nano = {
  "tokenize": function(str) {
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
}


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
    if(syms[c]) {
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
    } else {
      throw "illegal start of expression: " + to
    }
}


/*
// statement: exp ? exp : exp
// statement: exp.s
// statement: exp
function statement(tokens) {
  var exp = expression(tokens)
  if(tokens.length == 0) {
    return
  }
  var to = tokens[0]
  if(to == "?") {
    tokens.shift()
    var exp2 = expression(tokens)
    var t = tokens.shift()
    if(":" != t) {
      throw "illegal ternary statement: " + t
    }
    var exp3 = expression(tokens)
    return ["?", exp, exp2, exp3]
  } else if(to == '.') {
    tokens.shift()
    var t = tokens.shift()
    var syms = str2set("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_$.")
    if(!syms[t]) {
      throw "illegal property: " + t
    }
    return [".", exp, t]
  } else if(to == ";") {
    tokens.shift()
    return exp
  } else {
    throw "illegal for the remaining of the statement: " + to
  }
}

// f(a,b)=>{ a=a+b; b+1 }
function funcCall(tokens) {
  var syms = str2set("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_$.")
  var to = tokens[0]
  var c = to[0]
  if(!syms[c]) {
    throw "illegal start of a function: " + to
  }

}
*/
