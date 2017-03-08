# Nano Script
A simple scripting language, designed to run as a separate context inside JavaScript.

The goal of Nano Script is to create a language that enables execution of foreign code (user-created-content) in a secured fashion.

## Getting Started

```
      var context = new NanoContext()
      code = "a = 1; b = a + 2;";
      context.run(code);
      console.log("a=" + context.variables['a'])
      console.log("b=" + context.variables['b'])
```

## Language Features
The syntax does not include most of the operations that common programming language support, but excluding if / for / while / statements.
(Avoid possibility of writing an infinite loop)

JavaScript function(s) can be inserted to a Nano Context so that it can be invoked through Nano Script.
The JavaScript Developer has the control over which functions are made available to Nano.

### Assignment
```
a = 10
a = "abc do"
a = []
a = [1,2,3]
a[b] = 10
x = a[b]
```

### Algebraic Expression
```
a = a + b*2 - 6
```

### Boolean Operations
```
a == b
a != b
a > b
a && !b || c
```

### Ternary Operator
```
a = b > 0 ? b : 0
```

### Function Definition
The value from the last statement will be used as the return value.
```
f(a,b) => {a = a + b; b + 1;}
```

### Function Invocation
Invoke a user-defined function, or an JavaScript function assigned to the Nano Context
```
x = f(1,2);
```

### Comment
```
# This is a comment
```
