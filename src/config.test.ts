import { optionsToConfig } from './config'
import { isComment } from './util'

const text = document.createTextNode('text')
const span = document.createElement('SPAN')
const video = document.createElement('VIDEO')
const comment = document.createComment('comment')
const fragment = document.createDocumentFragment()

describe('skipSelfAndChildren', () => {
    describe('without options', () => {
        const config = optionsToConfig()
        test('return false given a text node', () => {
            expect(config.skipSelfAndChildren(text)).toBe(false)
        })
        test('return false given a SPAN', () => {
            expect(config.skipSelfAndChildren(span)).toBe(false)
        })
        test('return false given a document fragment', () => {
            expect(config.skipSelfAndChildren(fragment)).toBe(false)
        })
        test('return true given a comment', () => {
            expect(config.skipSelfAndChildren(comment)).toBe(true)
        })
        test('return false given a VIDEO', () => {
            expect(config.skipSelfAndChildren(video)).toBe(false)
        })
        test('return true given a document', () => {
            expect(config.skipSelfAndChildren(document)).toBe(true)
        })
    })
    describe('with options', () => {
        const config = optionsToConfig({
            skipSelfAndChildren(node: Node): boolean | undefined {
                return isComment(node)
                    ? false // Comment should be ignored anyway.
                    : node.nodeName === 'SPAN'
                    ? true // SPAN should be ignored.
                    : node.nodeName === 'VIDEO'
                    ? undefined // VIDEO should not be ignored.
                    : false // Some nodes will be ignored anyway.
            }
        })
        test('return false given a text node', () => {
            expect(config.skipSelfAndChildren(text)).toBe(false)
        })
        test('return true given a SPAN', () => {
            expect(config.skipSelfAndChildren(span)).toBe(true)
        })
        test('return false given a document fragment', () => {
            expect(config.skipSelfAndChildren(fragment)).toBe(false)
        })
        test('return true given a comment', () => {
            expect(config.skipSelfAndChildren(comment)).toBe(true)
        })
        test('return false given a VIDEO', () => {
            expect(config.skipSelfAndChildren(video)).toBe(false)
        })
        test('return true given a document', () => {
            expect(config.skipSelfAndChildren(document)).toBe(true)
        })
    })
})

describe('skipChildren', () => {
    describe('without options', () => {
        const config = optionsToConfig()
        test('return false given a text node', () => {
            expect(config.skipChildren(text)).toBe(false)
        })
        test('return false given a SPAN', () => {
            expect(config.skipChildren(span)).toBe(false)
        })
        test('return true given a VIDEO', () => {
            expect(config.skipChildren(video)).toBe(true)
        })
    })
    describe('with options', () => {
        const config = optionsToConfig({
            skipChildren(node: Node): boolean | undefined {
                return node.nodeName === 'SPAN'
                    ? true
                    : node.nodeName === 'VIDEO'
                    ? false
                    : undefined
            }
        })
        test('return false given a text node', () => {
            expect(config.skipChildren(text)).toBe(false)
        })
        test('return false given a SPAN', () => {
            expect(config.skipChildren(span)).toBe(true)
        })
        test('return true given a VIDEO', () => {
            expect(config.skipChildren(video)).toBe(false)
        })
    })
})

describe('isFormat', () => {
    describe('without options', () => {
        const config = optionsToConfig()
        test('return false given a text node', () => {
            expect(config.isFormat(text)).toBe(false)
        })
        test('return true given a SPAN', () => {
            expect(config.isFormat(span)).toBe(true)
        })
        test('return false given a VIDEO', () => {
            expect(config.isFormat(video)).toBe(false)
        })
    })
    describe('without options', () => {
        const config = optionsToConfig({
            isFormat(node: Node): boolean | undefined {
                return node.nodeName === 'SPAN'
                    ? false
                    : node.nodeName === 'VIDEO'
                    ? true
                    : undefined
            }
        })
        test('return false given a text node', () => {
            expect(config.isFormat(text)).toBe(false)
        })
        test('return true given a SPAN', () => {
            expect(config.isFormat(span)).toBe(false)
        })
        test('return false given a VIDEO', () => {
            expect(config.isFormat(video)).toBe(true)
        })
    })
})
