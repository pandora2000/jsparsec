/* global describe, context, it */

const {expect} = require('chai')
const P = require('../src/index.js')

const a = P.string('a')
const b = P.string('b')
const c = P.string('c')
const ab = P.string('ab')
const bs = b.many()

describe('.string', () => {
  context("with 'a'", () => {
    it("should match 'a', produce 'a' and consume 1 letter", () => {
      expect(a.parse('a')).to.deep.equal({status: true, index: 1, value: 'a'})
    })

    it("should not match 'b' and produce errors properly", () => {
      expect(a.parse('b')).to.deep.equal({status: false, errors: [{index: 0, expect: 'string a'}]})
    })
  })
})

describe('.cont', () => {
  const p = a.cont(b)

  context("with 'a' parser and 'b' parser", () => {
    it("should match 'ab', produce ['a', 'b'] and consume 2 letters", () => {
      expect(p.parse('ab')).to.deep.equal({status: true, index: 2, value: ['a', 'b']})
    })

    it("should not match 'c' and produce errors properly", () => {
      expect(p.parse('c')).to.deep.equal({status: false, errors: [{index: 0, expect: 'string a'}]})
    })

    it("should not match 'ac' and produce errors properly", () => {
      expect(p.parse('ac')).to.deep.equal({status: false, errors: [{index: 1, expect: 'string b'}]})
    })
  })
})

describe('.or', () => {
  const p = a.or(c)

  context("with 'a' parser and 'c' parser", () => {
    it("should match 'a', produce 'a' and consume 1 letters", () => {
      expect(p.parse('a')).to.deep.equal({status: true, index: 1, value: 'a'})
    })

    it("should match 'c', produce 'c' and consume 1 letters", () => {
      expect(p.parse('c')).to.deep.equal({status: true, index: 1, value: 'c'})
    })

    it("should not match 'b' and produce errors properly", () => {
      expect(p.parse('b')).to.deep.equal({
        status: false,
        errors: [{index: 0, expect: 'string a'}, {index: 0, expect: 'string c'}]
      })
    })
  })
})


describe('.rec', () => {
  const p = P.rec(p => ab.cont(p).or(a))

  context('with p => ab.cont(p).or(a)', () => {
    it("should match 'ababa' and consume 5 letters", () => {
      expect(p.parse('ababa')).to.include({status: true, index: 5})
    })
  })
})

describe('.eos', () => {
  it("should match '', produce null and consume no letter", () => {
    expect(P.eos().parse('')).to.deep.equal({status: true, index: 0, value: null})
  })
})

describe('.many', () => {
  const p = a.many()

  context("with 'a' parser", () => {
    it("should match 'aaa', produce ['a', 'a', 'a'] and consume 3 letters", () => {
      expect(p.parse('aaa')).to.deep.equal(
        {status: true, index: 3, value: ['a', 'a', 'a']}
      )
    })

    it("should match 'aab', produce ['a', 'a'] and consume 2 letters", () => {
      expect(p.parse('aab')).to.deep.equal(
        {status: true, index: 2, value: ['a', 'a']}
      )
    })

    it("should match 'c', produce [] and consume no letter", () => {
      expect(p.parse('c')).to.deep.equal({status: true, index: 0, value: []})
    })
  })
})

describe('.many1', () => {
  const p = a.many1()

  context("with 'a' parser", () => {
    it("should match 'aaa', produce ['a', 'a', 'a'] and consume 3 letters", () => {
      expect(p.parse('aaa')).to.deep.equal(
        {status: true, index: 3, value: ['a', 'a', 'a']}
      )
    })

    it("should match 'aab', produce ['a', 'a'] and consume 2 letters", () => {
      expect(p.parse('aab')).to.deep.equal(
        {status: true, index: 2, value: ['a', 'a']}
      )
    })

    it("should not match 'c' and produce errors properly", () => {
      expect(p.parse('c')).to.deep.equal(
        {status: false, errors: [{index: 0, expect: 'string a'}]}
      )
    })
  })
})

describe('.seq', () => {
  const p = P.seq(a, ab, ab, c)

  context("with 'a' parser, 'ab' parser, 'ab' parser and 'c' parser", () => {
    it("should match 'aababc', produce ['a', 'ab', 'ab', 'c'] and consume 6 letters", () => {
      expect(p.parse('aababc')).to.deep.equal(
        {status: true, index: 6, value: ['a', 'ab', 'ab', 'c']}
      )
    })

    it("should not match 'aabab' and produce errors properly", () => {
      expect(p.parse('aabab')).to.deep.equal(
        {status: false, errors: [{index: 5, expect: 'string c'}]}
      )
    })
  })
})

describe('.choice', () => {
  context("with 'a' parser and 'ab' parser followed by eos parser", () => {
    const p = P.choice(a, ab).end()

    it("should match 'a', produce 'a' and consume 1 letters", () => {
      expect(p.parse('a')).to.deep.equal({status: true, index: 1, value: 'a'})
    })

    it("should match 'ab', produce 'ab' and consume 2 letters", () => {
      expect(p.parse('ab')).to.deep.equal({status: true, index: 2, value: 'ab'})
    })
  })

  context("with 'a' parser and 'ab' parser followed by eos parser", () => {
    const p = P.choice()

    it("should not match 'a' and produce errors properly", () => {
      expect(p.parse('a'))
        .to.deep.equal({status: false, errors: [{index: 0, expect: 'some choice'}]})
    })
  })
})

describe('.then', () => {
  const p = a.then(b)

  context("with 'a' parser and 'b' parser", () => {
    it("should match 'ab', produce 'b' and consume 2 letters", () => {
      expect(p.parse('ab')).to.deep.equal({status: true, index: 2, value: 'b'})
    })
  })
})

describe('.skip', () => {
  const p = a.skip(b)

  context("with 'a' parser and 'b' parser", () => {
    it("should match 'ab', produce 'a' and consume 2 letters", () => {
      expect(p.parse('ab')).to.deep.equal({status: true, index: 2, value: 'a'})
    })
  })
})


describe('.unshift', () => {
  const p = a.unshift(bs)

  context("with 'a' parser and 'b' many parser", () => {
    it("should match 'abb', produce ['a', 'b', 'b'] and consume 3 letters", () => {
      expect(p.parse('abb')).to.deep.equal(
        {status: true, index: 3, value: ['a', 'b', 'b']}
      )
    })
  })
})

describe('.push', () => {
  const p = bs.push(a)

  context("with 'b' many parser and 'a' parser", () => {
    it("should match 'bba', produce ['b', 'b', 'a'] and consume 3 letters", () => {
      expect(p.parse('bba')).to.deep.equal(
        {status: true, index: 3, value: ['b', 'b', 'a']}
      )
    })
  })
})

describe('.sepBy', () => {
  const p = ab.sepBy(b)

  context("with 'ab' parser and 'b' parser", () => {
    it("should match '', produce [] and consume 0 letters", () => {
      expect(p.parse('')).to.deep.equal({status: true, index: 0, value: []})
    })

    it("should match 'ab', produce ['ab'] and consume 2 letters", () => {
      expect(p.parse('ab')).to.deep.equal({status: true, index: 2, value: ['ab']})
    })

    it("should match 'abb', produce ['ab'] and consume 2 letters", () => {
      expect(p.parse('abb')).to.deep.equal({status: true, index: 2, value: ['ab']})
    })

    it("should match 'abbab', produce ['ab', 'ab'] and consume 5 letters", () => {
      expect(p.parse('abbab')).to.deep.equal(
        {status: true, index: 5, value: ['ab', 'ab']}
      )
    })
  })
})

describe('.sepBy1', () => {
  const p = ab.sepBy1(b)

  context("with 'ab' parser and 'b' parser", () => {
    it("should match 'ab', produce ['ab'] and consume 2 letters", () => {
      expect(p.parse('ab')).to.deep.equal({status: true, index: 2, value: ['ab']})
    })

    it("should match 'abb', produce ['ab'] and consume 2 letters", () => {
      expect(p.parse('abb')).to.deep.equal({status: true, index: 2, value: ['ab']})
    })

    it("should match 'abbab', produce ['ab', 'ab'] and consume 5 letters", () => {
      expect(p.parse('abbab')).to.deep.equal(
        {status: true, index: 5, value: ['ab', 'ab']}
      )
    })

    it("should not match 'a' and produce errors properly", () => {
      expect(p.parse('a')).to.deep.equal(
        {status: false, errors: [{index: 0, expect: 'string ab'}]}
      )
    })
  })
})

describe('.unconsume', () => {
  const p = ab.unconsume()

  context("with 'ab' parser", () => {
    it("should match 'ab', produce 'ab' and consume no letter", () => {
      expect(p.parse('ab')).to.deep.equal({status: true, index: 0, value: 'ab'})
    })

    it("should not match 'ac' produce errors properly", () => {
      expect(p.parse('ac')).to.deep.equal(
        {status: false, errors: [{index: 0, expect: 'string ab'}]}
      )
    })
  })
})

describe('.not', () => {
  const p = ab.not()

  context("with 'ab' parser", () => {
    it("should match 'ac', produce null and consume no letter", () => {
      expect(p.parse('ac')).to.deep.equal({status: true, index: 0, value: null})
    })

    it("should not match 'ab' produce errors properly", () => {
      expect(p.parse('ab')).to.deep.equal(
        {status: false, errors: [{index: 0, expect: 'not string ab'}]}
      )
    })
  })
})

describe('.notFollowedBy', () => {
  const p = a.notFollowedBy(a)

  context("with 'a' parser and 'a' parser", () => {
    it("should match 'ab', produce 'a' and consume 1 letter", () => {
      expect(p.parse('ab')).to.deep.equal({status: true, index: 1, value: 'a'})
    })

    it("should not match 'aa' produce errors properly", () => {
      expect(p.parse('aa'))
        .to.deep.equal({status: false, errors: [{index: 1, expect: 'not string a'}]})
    })
  })
})

describe('.lookahead', () => {
  const p = a.lookahead(b)

  context("with 'a' parser and 'b' parser", () => {
    it("should match 'ab', produce 'a' and consume 1 letter", () => {
      expect(p.parse('ab')).to.deep.equal({status: true, index: 1, value: 'a'})
    })

    it("should not match 'aa' produce errors properly", () => {
      expect(p.parse('aa'))
        .to.deep.equal({status: false, errors: [{index: 1, expect: 'string b'}]})
    })
  })
})

describe('.map', () => {
  const p = a.cont(ab).map(x => x.map(y => y.length))

  context('with x => x.map(y => y.length)', () => {
    it("should match 'aab', produce [1, 2] and consume 3 letter", () => {
      expect(p.parse('aab'))
        .to.deep.equal({status: true, index: 3, value: [1, 2]})
    })
  })
})

describe('.parseToEnd', () => {
  context("with 'a' parser and 'a'", () => {
    it("should succeed, produce 'a' and consume 1 letter", () => {
      expect(a.parseToEnd('a')).to.deep.equal({status: true, index: 1, value: 'a'})
    })
  })

  context("with 'a' parser and 'ab'", () => {
    it('should fail and produce errors properly', () => {
      expect(a.parseToEnd('ab')).to.deep.equal(
        {status: false, errors: [{index: 1, expect: 'end of string'}]}
      )
    })
  })
})

describe('.succeed', () => {
  context('with true', () => {
    it("should match 'a', produce true and consume no letter", () => {
      expect(P.succeed(true).parse('a')).to.deep.equal({status: true, index: 0, value: true})
    })
  })

  context('with no argument', () => {
    it("should match 'a', produce null and consume no letter", () => {
      expect(P.succeed().parse('a')).to.deep.equal({status: true, index: 0, value: null})
    })
  })
})

describe('.fail', () => {
  context("with 'expected'", () => {
    it("should not match 'a' and produce errors properly", () => {
      expect(P.fail('expected').parse('a'))
        .to.deep.equal({status: false, errors: [{index: 0, expect: 'expected'}]})
    })
  })

  context("with no argument", () => {
    it("should not match 'a' and produce errors properly", () => {
      expect(P.fail().parse('a'))
        .to.deep.equal({status: false, errors: [{index: 0, expect: 'nothing'}]})
    })
  })
})

describe('.desc', () => {
  const p = a.desc('expected')

  context("with 'a' parser and 'expected'", () => {
    it("should match 'a', produce 'a' and consume 1 letter", () => {
      expect(p.parse('a'))
        .to.deep.equal({status: true, index: 1, value: 'a'})
    })

    it("should not match 'b' and produce errors properly", () => {
      expect(p.parse('b')).to.deep.equal(
        {status: false, errors: [{index: 0, expect: 'expected'}]}
      )
    })
  })
})

describe('.value', () => {
  const p = a.value('value')

  context("with 'a' parser and 'value'", () => {
    it("should match 'a', produce 'value' and consume 1 letter", () => {
      expect(p.parse('a'))
        .to.deep.equal({status: true, index: 1, value: 'value'})
    })

    it("should not match 'b' and produce errors properly", () => {
      expect(p.parse('b')).to.deep.equal(
        {status: false, errors: [{index: 0, expect: 'string a'}]}
      )
    })
  })
})

describe('.letter', () => {
  const p = P.letter()

  it("should match 'a', produce 'a' and consume 1 letter", () => {
    expect(p.parse('a')).to.deep.equal({status: true, index: 1, value: 'a'})
  })

  it("should not match '1' and produce errors properly", () => {
    expect(p.parse('1')).to.deep.equal(
      {status: false, errors: [{index: 0, expect: 'match /[a-z]/i'}]}
    )
  })
})

describe('.letters', () => {
  const p = P.letters()

  it("should match 'ab', produce 'ab' and consume 2 letter", () => {
    expect(p.parse('ab')).to.deep.equal({status: true, index: 2, value: 'ab'})
  })

  it("should not match '1' and produce errors properly", () => {
    expect(p.parse('1')).to.deep.equal(
      {status: false, errors: [{index: 0, expect: 'match /[a-z]+/i'}]}
    )
  })
})

describe('.digit', () => {
  const p = P.digit()

  it("should match '3', produce '3' and consume 1 letter", () => {
    expect(p.parse('3')).to.deep.equal({status: true, index: 1, value: '3'})
  })

  it("should not match 'b' and produce errors properly", () => {
    expect(p.parse('b')).to.deep.equal(
      {status: false, errors: [{index: 0, expect: 'match /[0-9]/'}]}
    )
  })
})

describe('.digits', () => {
  const p = P.digits()

  it("should match '92', produce '92' and consume 2 letter", () => {
    expect(p.parse('92')).to.deep.equal({status: true, index: 2, value: '92'})
  })

  it("should not match 'k' and produce errors properly", () => {
    expect(p.parse('k')).to.deep.equal(
      {status: false, errors: [{index: 0, expect: 'match /[0-9]+/'}]}
    )
  })
})

describe('.whitespace', () => {
  const p = P.whitespace()

  it("should match '  ', produce '  ' and consume 2 letter", () => {
    expect(p.parse('  ')).to.deep.equal({status: true, index: 2, value: '  '})
  })

  it("should not match 'k' and produce errors properly", () => {
    expect(p.parse('k')).to.deep.equal(
      {status: false, errors: [{index: 0, expect: 'match /\\s+/'}]}
    )
  })
})

describe('.any', () => {
  const p = P.any()

  it("should match '@', produce '@' and consume 1 letter", () => {
    expect(p.parse('@')).to.deep.equal({status: true, index: 1, value: '@'})
  })

  it("should not match '' and produce errors properly", () => {
    expect(p.parse('')).to.deep.equal(
      {status: false, errors: [{index: 0, expect: 'match /./'}]}
    )
  })
})

describe('.all', () => {
  const p = P.all()

  it("should match '@ k1', produce '@ k1' and consume 4 letter", () => {
    expect(p.parse('@ k1')).to.deep.equal({status: true, index: 4, value: '@ k1'})
  })
})
