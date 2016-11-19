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

Nano = {
  "tokenize": function(str) {
    function str2arr(s) {
      return s.split("").reduce(function(a,b) {a[b]=1; return a;}, {})
    }
    var syms = str2arr("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_$")
    var ops = str2arr("+-*/=><&|:.!?")
    var brs = str2arr("[](){}")
    var des = str2arr("\n;")
    var qus = str2arr("\"'")
    tokens = [];
    var s;
    exp = null;
    for(var i=0;i<str.length+1;i++) {
      c = str[i]
      t = syms[c] ? "s" : ops[c] ? "o" : brs[c] ? c : null;
      if(exp != null) {
        if(exp == t) {
          s += c;
        } else {
          tokens.push(s)
          if(qus[exp]) {
            tokens << exp
          }
          exp = null;
          s = ""
        }
        continue;
      }

      if(t == ' ') {
        continue;
      }
      if(!t) {
        if(des[c]) {
            tokens.push(";")
        } else if(qus[c]) {
            tokens.push(c)
            exp = c;
            s = ""
        }
      } else {
        s = c
        exp = t
      }
    }
    return tokens;
  }
}

ts = Nano.tokenize("abc = 123")
console.log(ts)
