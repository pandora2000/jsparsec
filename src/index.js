function createIterable (f) {
  const ret = {}
  ret[Symbol.iterator] = f
  return ret
}

class JsParsecParser {
  constructor (func) {
    Object.assign(this, {func})
  }
}

[
  'parse',
  'parseToEnd',
  'cont',
  'or',
  'resultMap',
  'map',
  'value',
  'unshift',
  'push',
  'many',
  'many1',
  'then',
  'skip',
  'end',
  'sepBy',
  'sepBy1',
  'desc',
  'unconsume',
  'not',
  'notFollowedBy',
  'lookahead'
].forEach(method => {
  JsParsecParser.prototype[method] = function () {
    return JsParsec[method](this, ...arguments)
  }
})

class JsParsec {
  static eos () {
    return new JsParsecParser((s, i) => {
      if (s.length === i) {
        return [{status: true, index: i, value: null}]
      }
      return [{status: false, index: i, expect: 'end of string'}]
    })
  }

  static string (prefix) {
    return new JsParsecParser((s, i) => {
      if (s.substring(i).startsWith(prefix)) {
        return [{status: true, index: i + prefix.length, value: prefix}]
      }
      return [{status: false, index: i, expect: `string ${prefix}`}]
    })
  }

  static regexp (reg, group = 0) {
    return new JsParsecParser((s, i) => {
      const m = s.substring(i).match(reg)
      if (m && m.index === 0) {
        const s = m[group]
        return [{status: true, index: i + s.length, value: s}]
      }
      return [{status: false, index: i, expect: `match ${reg}`}]
    })
  }

  static succeed (v = null) {
    return this.string('').map(() => v)
  }

  static fail (expect = 'nothing') {
    return new JsParsecParser((_, i) => {
      return [{status: false, index: i, expect}]
    })
  }

  static parse (p, s) {
    const errors = []
    for (const {status, index, value, expect} of p.func(s, 0)) {
      if (status) {
        return {status, index, value}
      }
      errors.push({index, expect})
    }
    return {status: false, errors}
  }

  static parseToEnd (p, s) {
    return p.end().parse(s)
  }

  static cont (p, q) {
    return new JsParsecParser((s, i) => {
      const pIter = p.func(s, i)
      return createIterable(function* () {
        for (const {status, index, expect, value: pValue} of pIter) {
          if (status) {
            const qIter = q.func(s, index)
            for (const {status, index, expect, value: qValue} of qIter) {
              if (status) {
                yield {status, index, value: [pValue, qValue]}
              } else {
                yield {status, index, expect}
              }
            }
          } else {
            yield {status, index, expect}
          }
        }
      })
    })
  }

  static or (p, q) {
    return new JsParsecParser((s, i) => {
      const pIter = p.func(s, i)
      const qIter = q.func(s, i)
      return createIterable(function* () {
        yield* pIter
        yield* qIter
      })
    })
  }

  static rec (f) {
    const p = new JsParsecParser((s, i) => {
      return f(p).func(s, i)
    })
    return p
  }

  static resultMap (p, f) {
    return new JsParsecParser((s, i) => {
      return createIterable(function* () {
        for (const res of p.func(s, i)) {
          yield f(res, i)
        }
      })
    })
  }

  static map (p, f) {
    return p.resultMap(({status, index, value, expect}) => {
      if (status) {
        return {status, index, value: f(value)}
      } else {
        return {status, index, expect}
      }
    })
  }

  static value (p, v) {
    return p.map(() => v)
  }

  static unshift (p, q) {
    return this.cont(p, q).map(([x, y]) => [x].concat(y))
  }

  static push (p, q) {
    return this.cont(p, q).map(([x, y]) => x.concat([y]))
  }

  static many (p) {
    return this.rec(q => {
      return p.unshift(q).or(this.succeed([]))
    })
  }

  static many1 (p) {
    return p.unshift(p.many())
  }

  static seq (...ps) {
    return ps.reduce((p, x) => p.push(x), this.succeed([]))
  }

  static choice (...ps) {
    if (ps.length === 0) {
      return this.fail('some choice')
    }
    return ps.reduce((p, x) => {
      return p.or(x)
    })
  }

  static then (p, q) {
    return p.cont(q).map(([, x]) => x)
  }

  static skip (p, q) {
    return p.cont(q).map(([x]) => x)
  }

  static end (p) {
    return p.skip(this.eos())
  }

  static sepBy1 (p, q) {
    return p.unshift(q.then(p).many())
  }

  static sepBy (p, q) {
    return p.sepBy1(q).or(this.succeed([]))
  }

  static desc (p, expect) {
    return p.resultMap(({status, index, value}) => {
      if (status) {
        return {status, index, value}
      } else {
        return {status, index, expect}
      }
    })
  }

  static letter () {
    return this.regexp(/[a-z]/i)
  }

  static letters () {
    return this.regexp(/[a-z]+/i)
  }

  static digit () {
    return this.regexp(/[0-9]/)
  }

  static digits () {
    return this.regexp(/[0-9]+/)
  }

  static whitespace () {
    return this.regexp(/\s+/)
  }

  static any () {
    return this.regexp(/./)
  }

  static all () {
    return this.regexp(/.*/)
  }

  static unconsume (p) {
    return p.resultMap(({status, index, value, expect}, i) => {
      if (status) {
        return {status, index: i, value}
      } else {
        return {status, index, expect}
      }
    })
  }

  static not (p) {
    return new JsParsecParser((s, i) => {
      return createIterable(function* () {
        for (const {status, index} of p.func(s, i)) {
          if (status) {
            yield {status: false, index: i, expect: `not string ${s.substring(i, index)}`}
            return
          }
        }
        yield {status: true, index: i, value: null}
      })
    })
  }

  static notFollowedBy (p, q) {
    return p.skip(q.not())
  }

  static lookahead (p, q) {
    return p.skip(q.unconsume())
  }
}

module.exports = JsParsec
