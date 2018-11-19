import {
    compareArrays,
    compareNodes,
    createNodePredicate,
    getAncestorCount,
    isComponent,
    isElement,
    isFormat,
    isIgnored,
    isText
} from './util'

const text = document.createTextNode('text')
const identicalText = document.createTextNode('text')
const differentText = document.createTextNode('different text')
const span = document.createElement('SPAN')
const identicalSpan = document.createElement('SPAN')
const differentAttributeNamesSpan = document.createElement('SPAN')
const differentAttributeValuesSpan = document.createElement('SPAN')
const video = document.createElement('VIDEO')
const comment = document.createComment('comment')

span.setAttribute('data-a', 'a')
span.setAttribute('data-b', 'b')
identicalSpan.setAttribute('data-b', 'b')
identicalSpan.setAttribute('data-a', 'a')
differentAttributeNamesSpan.setAttribute('data-a', 'a')
differentAttributeNamesSpan.setAttribute('data-b', 'b')
differentAttributeNamesSpan.setAttribute('data-c', 'c')
differentAttributeValuesSpan.setAttribute('data-a', 'different a')
differentAttributeValuesSpan.setAttribute('data-b', 'different b')

describe('isText', () => {
    test('return true given a text node', () => {
        expect(isText(text)).toBe(true)
    })
    test('return false given a SPAN', () => {
        expect(isText(span)).toBe(false)
    })
})

describe('isElement', () => {
    test('return false given a text node', () => {
        expect(isElement(text)).toBe(false)
    })
    test('return true given a SPAN', () => {
        expect(isElement(span)).toBe(true)
    })
})

describe('isIgnored', () => {
    test('return false given a text node', () => {
        expect(isIgnored(text)).toBe(false)
    })
    test('return false given a SPAN', () => {
        expect(isIgnored(span)).toBe(false)
    })
})

describe('isComponent', () => {
    test('return false given a text node', () => {
        expect(isComponent(text)).toBe(false)
    })
    test('return false given a SPAN', () => {
        expect(isComponent(span)).toBe(false)
    })
    test('return true given a VIDEO', () => {
        expect(isComponent(video)).toBe(true)
    })
})

describe('isFormat', () => {
    test('return false given a text node', () => {
        expect(isFormat(text)).toBe(false)
    })
    test('return true given a SPAN', () => {
        expect(isFormat(span)).toBe(true)
    })
    test('return false given a VIDEO', () => {
        expect(isFormat(video)).toBe(false)
    })
})

describe('createNodePredicate', () => {
    describe('no override', () => {
        const predicate = createNodePredicate(isText)
        test('return true', () => {
            expect(predicate(text)).toBe(true)
        })
        test('return false', () => {
            expect(predicate(span)).toBe(false)
        })
    })

    describe('override returns undefined', () => {
        const predicate = createNodePredicate(isText, () => undefined)
        test('return true', () => {
            expect(predicate(text)).toBe(true)
        })
        test('return false', () => {
            expect(predicate(span)).toBe(false)
        })
    })
    describe('override returns a boolean', () => {
        const predicate = createNodePredicate(isText, isElement)
        test('return true', () => {
            expect(predicate(span)).toBe(true)
        })
        test('return false', () => {
            expect(predicate(text)).toBe(false)
        })
    })
})

describe('compareArrays', () => {
    test('empty arrays', () => {
        expect(compareArrays([], [])).toBe(true)
    })
    test('different length', () => {
        expect(compareArrays([1], [1, 2])).toBe(false)
    })
    test('different item types', () => {
        expect(compareArrays([1, 2], [1, '2'])).toBe(false)
    })
    test('identical arrays', () => {
        expect(compareArrays([1, '2', text], [1, '2', text])).toBe(true)
    })
})

describe('compareNodes', () => {
    test('different node types', () => {
        expect(compareNodes(text, span)).toBe(false)
    })
    test('different node names', () => {
        expect(compareNodes(video, span)).toBe(false)
    })
    test('identical non-text and non-elements nodes', () => {
        expect(compareNodes(comment, comment)).toBe(false)
    })
    test('different text nodes', () => {
        expect(compareNodes(text, differentText)).toBe(false)
    })
    test('identical text nodes', () => {
        expect(compareNodes(text, identicalText)).toBe(true)
    })
    test('elements with different attribute names', () => {
        expect(compareNodes(span, differentAttributeNamesSpan)).toBe(false)
    })
    test('elements with different attribute values', () => {
        expect(compareNodes(span, differentAttributeValuesSpan)).toBe(false)
    })
    test('identical elements', () => {
        expect(compareNodes(span, identicalSpan)).toBe(true)
    })
})

describe('getAncestorCount', () => {
    const d = document.createElement('DIV')
    const p = document.createElement('P')
    const u = document.createElement('U')
    const t = document.createElement('text')

    d.appendChild(p)
    p.appendChild(u)
    u.appendChild(t)

    test('node: text, root: null', () => {
        expect(getAncestorCount(t)).toBe(3)
    })
    test('node: U, root: null', () => {
        expect(getAncestorCount(u)).toBe(2)
    })
    test('node: P, root: null', () => {
        expect(getAncestorCount(p)).toBe(1)
    })
    test('node: DIV, root: null', () => {
        expect(getAncestorCount(d)).toBe(0)
    })

    test('node: text, root: DIV', () => {
        expect(getAncestorCount(t, d)).toBe(3)
    })
    test('node: U, root: DIV', () => {
        expect(getAncestorCount(u, d)).toBe(2)
    })
    test('node: P, root: DIV', () => {
        expect(getAncestorCount(p, d)).toBe(1)
    })
    test('node: DIV, root: DIV', () => {
        expect(getAncestorCount(d, d)).toBe(0)
    })

    test('node: text, root: P', () => {
        expect(getAncestorCount(t, p)).toBe(2)
    })
    test('node: U, root: P', () => {
        expect(getAncestorCount(u, p)).toBe(1)
    })
    test('node: P, root: P', () => {
        expect(getAncestorCount(p, p)).toBe(0)
    })
    test('node: DIV, root: P', () => {
        expect(getAncestorCount(d, p)).toBe(0)
    })

    test('node: text, root: U', () => {
        expect(getAncestorCount(t, u)).toBe(1)
    })
    test('node: U, root: U', () => {
        expect(getAncestorCount(u, u)).toBe(0)
    })
    test('node: P, root: U', () => {
        expect(getAncestorCount(p, u)).toBe(1)
    })
    test('node: DIV, root: U', () => {
        expect(getAncestorCount(d, u)).toBe(0)
    })

    test('node: text, root: text', () => {
        expect(getAncestorCount(t, t)).toBe(0)
    })
    test('node: U, root: text', () => {
        expect(getAncestorCount(u, t)).toBe(2)
    })
    test('node: P, root: text', () => {
        expect(getAncestorCount(p, t)).toBe(1)
    })
    test('node: DIV, root: text', () => {
        expect(getAncestorCount(d, t)).toBe(0)
    })
})
