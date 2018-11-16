import {
    createNodePredicate,
    isComponent,
    isElement,
    isFormat,
    isIgnored,
    isText
} from './util'

const text = document.createTextNode('')
const span = document.createElement('SPAN')
const video = document.createElement('VIDEO')

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
