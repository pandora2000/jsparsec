[![NPM](https://nodei.co/npm/jsparsec.png)](https://nodei.co/npm/jsparsec/)

[![npm version](https://badge.fury.io/js/jsparsec.svg)](https://badge.fury.io/js/jsparsec)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Coverage Status](https://coveralls.io/repos/github/pandora2000/jsparsec/badge.svg?branch=master)](https://coveralls.io/github/pandora2000/jsparsec?branch=master)
[![Build Status](https://travis-ci.org/pandora2000/jsparsec.svg?branch=master)](https://travis-ci.org/pandora2000/jsparsec)

# JsParsec

## Why yet another Javascript Parser Combinators?

There are a lot of great Javascript implementation of Parser Combinators like [Parsimmon](https://github.com/jneen/parsimmon). Then, why yet another implementation? To describe the reason, let us start with small example of Parsimmon.

```javascript
const P = require('parsimmon')

P.string('a').or(P.string('ab')).then(P.string('c'))
```

This parser cannot parse `'abc'` successfully. Because `or` combinator tries the second parser only when the first one fails, and the first one succeeds in this case.

But, intuitively, we want the parser to try the second one even after the first one succeeds in case of failure of following parser. JsParsec do this.

```javascript
const P = require('jsparsec')

P.string('a').or(P.string('ab')).then(P.string('c'))
```

This parser successfully parse `'abc'`. We call this **extended** backtracking in contrast to conventional backtracking.

Extended backtracking is very slow to use in recursion. Be careful.

## Installation

Install via npm,

```
npm install jsparsec
```

or yarn.

```
yarn add jsparsec
```

## Basics

Basic stance is same with other implementations. A parser consume some prefix of given string, and produce some value or errors. For example,

```javascript
P.string('abc')
```

this parser consumes `'abc'` and produce `'abc'`. The parser

```javascript
P.regexp(/a*/).map(x => x.length)
```

consumes continuous `a` letters and produces count of them.

## Documentation

We have similar API with Parsimmon.

### Static methods

#### `.parse(parser, string)`

Makes parser to consume string. If the parser produced some value, the result is

```javascript
{
  status: true,
  index: integer, // index of string the parser consumed to.
  value: any // produced value
}
```

If the parser produced errors,

```javascript
{
  status: false,
  errors: [{
    index: integer, // index of string the parser stacked.
    expect: string // from above index, the parser expected some string described here.
  }]
}
```

#### `.eos()`

Returns a parser to consume nothing and produce null if given string is empty, otherwise produce errors.

#### `.string(str)`

Returns a parser to consume prefix `str` and produce it. If given string does not start with `str` the parser produces errors.

#### `.regexp(regex)`

Returns a parser to consume any matching prefix string with `regex` and produce the string.

#### `.succeed(value = null)`

Returns a parser to consume nothing and produce `value`. The parser never produce errors.

#### `.fail(expect = 'nothing')

Returns a parser to consume nothing and produce errors. Errors include only one error which expect attribute is `expect`. The parser never produce any value.

#### `.cont(parser1, parser2)`

Returns a parser to consume what parser1 consume followed by what parser2 consume from the index parser1 consumed to, and produce an array with length 2 which contains what parser1 produced and what parser2 produced. If any of parser1 and parser2 produce errors, the parser produces errors.

#### `.end(parser)`

Equivalent to `.cont(parser, .eos())`

#### `.map(parser, func)`

Returns a parser to consume what given parser consume and produce `func(value)` where value is what given parser produced.

#### `.then(parser1, parser2)`

Equivalent to `.cont(parser1, parser2).map(([x, y]) => y)`

#### `.skip(parser1, parser2)`

Equivalent to `.cont(parser1, parser2).map(([x, y]) => x)`

#### `.push(parser1, parser2)`

Equivalent to `.cont(parser1, parser2).map(([x, y]) => x.concat([y]))`

#### `.unshift(parser1, parser2)`

Equivalent to `.cont(parser1, parser2).map(([x, y]) => [x].concat(y))`

#### `.rec(parserFunc)`

Creates recursively defined parser. `parserFunc` take a parser as argument and returns a parser. Returned parser is fixed point of `parserFunc`.

#### `.or(parser1, parser2)`

Returns a parser to consume what parser1 consume and produce what parser1 produce if parser1 produce some value, otherwise consume what parser2 consume and produce what parser2 produce. If parser2 produce errors, the parser produce errors.

#### `.value(parser, value)`

Equivalent to `.map(parser, () => value)`

#### `.many(parser)`

Equivalent to

```javascript
.rec(q => {
  return .or(.unshift(parser, q), .succeed([]))
})
```

#### `.many1(parser)`

Equivalent to `.unshift(parser, .many(parser))`

#### `.seq(...parsers)`

Equivalent to `parsers.reduce((p, x) => .push(p, x), .succeed([]))`

#### `.choice(...parsers)`

If `parsers` is empty, then returns a parser to consume nothing and produce errors, otherwise, equivalent to `parsers.reduce((p, x) => .or(p, x))`

#### `.sepBy1(parser1, parser2)`

Equivalent to `.unshift(parser1, .many(.then(parser2, parser1)))`

#### `.sepBy(parser1, parser2)`

Equivalent to `.or(.sepBy1(parser1, parser2), .succeed([]))`

#### `.desc(parser, expect)`

Returns a parser to consume what given parser consume and produce what given parser produce. If given parser produce errors, the parser produce errors with expect attribute `expect`

#### `.unconsume(parser)`

Returns a parser to consume nothing and produce what given parser produce.

#### `.not(parser)`

Returns a parser to consume nothing and produce null if given parser produce errors, otherwise, produce errors.

#### `.notFollowedBy(parser1, parser2)`

Equivalent to `.skip(parser1, .not(parser2))`

#### `.lookahead(parser1, parser2)`

Equivalent to `.skip(parser1, .unconsume(parser2))`

### Instance methods

Instance methods are defined systematically. Following instance methods takes same arguments with static methods except first argument which is the instance. In other words,

```
parser.instanceMethod(...arguments) === .classMethod(parser, ...arguments)
```

- `parse`
- `parseToEnd`
- `cont`
- `or`
- `resultMap`
- `map`
- `value`
- `unshift`
- `push`
- `many`
- `many1`
- `then`
- `skip`
- `end`
- `sepBy`
- `sepBy1`
- `desc`
- `unconsume`
- `not`
- `notFollowedBy`
- `lookahead`

## License

[MIT](LICENSE)

## Contributing

To contribute, follow steps bellow.

1. change code or documentation
1. check `npm test` to run successfully without coverage decrease
1. create a pull request

If you have an issue, please don't hesitate to open one!
