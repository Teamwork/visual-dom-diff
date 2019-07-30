import { CompareNodesResult, optionsToConfig } from './config'
import { isComment, isDocumentFragment, isText } from './util'

const text = document.createTextNode('text')
const span = document.createElement('SPAN')
const div = document.createElement('DIV')
const video = document.createElement('VIDEO')
const comment = document.createComment('comment')
const fragment = document.createDocumentFragment()

describe('skipChildren', () => {
    describe('without options', () => {
        const config = optionsToConfig()
        test('return true given a text node', () => {
            expect(config.skipChildren(text)).toBe(true)
        })
        test('return true given a comment node', () => {
            expect(config.skipChildren(comment)).toBe(true)
        })
        test('return false given a SPAN', () => {
            expect(config.skipChildren(span)).toBe(false)
        })
        test('return true given a VIDEO', () => {
            expect(config.skipChildren(video)).toBe(true)
        })
        test('return false given a DIV', () => {
            expect(config.skipChildren(div)).toBe(false)
        })
        test('return false given a document fragment', () => {
            expect(config.skipChildren(fragment)).toBe(false)
        })
        test('return false given a document', () => {
            expect(config.skipChildren(document)).toBe(false)
        })
    })
    describe('with options', () => {
        const config = optionsToConfig({
            skipChildren(node: Node): boolean | undefined {
                return node.nodeName === 'SPAN'
                    ? true
                    : node.nodeName === 'VIDEO'
                    ? false
                    : isText(node) || isComment(node)
                    ? false
                    : isDocumentFragment(node)
                    ? true
                    : undefined
            }
        })
        test('return true given a text node', () => {
            expect(config.skipChildren(text)).toBe(true)
        })
        test('return true given a comment node', () => {
            expect(config.skipChildren(comment)).toBe(true)
        })
        test('return true given a SPAN', () => {
            expect(config.skipChildren(span)).toBe(true)
        })
        test('return false given a VIDEO', () => {
            expect(config.skipChildren(video)).toBe(false)
        })
        test('return false given a DIV', () => {
            expect(config.skipChildren(div)).toBe(false)
        })
        test('return true given a document fragment', () => {
            expect(config.skipChildren(fragment)).toBe(true)
        })
        test('return false given a document', () => {
            expect(config.skipChildren(document)).toBe(false)
        })
    })
})

describe('skipSelf', () => {
    describe('without options', () => {
        const config = optionsToConfig()
        test('return false given a text node', () => {
            expect(config.skipSelf(text)).toBe(false)
        })
        test('return true given a comment node', () => {
            expect(config.skipSelf(comment)).toBe(true)
        })
        test('return true given a SPAN', () => {
            expect(config.skipSelf(span)).toBe(true)
        })
        test('return false given a VIDEO', () => {
            expect(config.skipSelf(video)).toBe(false)
        })
        test('return false given a DIV', () => {
            expect(config.skipSelf(div)).toBe(false)
        })
        test('return true given a document fragment', () => {
            expect(config.skipSelf(fragment)).toBe(true)
        })
    })
    describe('with options', () => {
        const config = optionsToConfig({
            skipSelf(node: Node): boolean | undefined {
                return isText(node)
                    ? true
                    : isComment(node)
                    ? false
                    : isDocumentFragment(node)
                    ? false
                    : node.nodeName === 'SPAN'
                    ? false
                    : node.nodeName === 'VIDEO'
                    ? true
                    : undefined
            }
        })
        test('return true given a text node', () => {
            expect(config.skipSelf(text)).toBe(true)
        })
        test('return true given a comment node', () => {
            expect(config.skipSelf(comment)).toBe(true)
        })
        test('return false given a SPAN', () => {
            expect(config.skipSelf(span)).toBe(false)
        })
        test('return true given a VIDEO', () => {
            expect(config.skipSelf(video)).toBe(true)
        })
        test('return false given a DIV', () => {
            expect(config.skipSelf(div)).toBe(false)
        })
        test('return true given a document fragment', () => {
            expect(config.skipSelf(fragment)).toBe(true)
        })
    })
})

describe('compareNodes', () => {
    const div1 = div.cloneNode(false) as Element
    div1.setAttribute('key', 'value 1')
    const div2 = div.cloneNode(false) as Element
    div2.setAttribute('key', 'value 2')

    const span1 = span.cloneNode(false) as Element
    span1.setAttribute('key', 'value 1')
    const span2 = span.cloneNode(false) as Element
    span2.setAttribute('key', 'value 2')

    const text1 = document.createTextNode('text 1')
    const text2 = document.createTextNode('text 2')

    describe('without options', () => {
        const config = optionsToConfig()

        test.each<[HTMLElement | Comment | DocumentFragment]>([
            [text],
            [span],
            [div],
            [video],
            [comment],
            [fragment]
        ])('return IDENTICAL #%#', node => {
            expect(config.compareNodes(node, node.cloneNode(false))).toBe(
                CompareNodesResult.IDENTICAL
            )
        })

        test.each<[Element | Comment, Element | Comment]>([
            [text, comment],
            [video, div],
            [text1, text2],
            [div1, div2],
            [span1, span2]
        ])('return different #%#', (node1, node2) => {
            expect(config.compareNodes(node1, node2)).toBe(
                CompareNodesResult.DIFFERENT
            )
        })
    })
    describe('with options', () => {
        const config = optionsToConfig({
            compareNodes(
                node1: Node,
                node2: Node
            ): CompareNodesResult | undefined {
                return node1.nodeName === 'DIV' && node2.nodeName === 'DIV'
                    ? CompareNodesResult.IDENTICAL
                    : node1.nodeType === Node.TEXT_NODE &&
                      node2.nodeType === Node.TEXT_NODE &&
                      (node1 as Text).data !== (node2 as Text).data
                    ? CompareNodesResult.SIMILAR
                    : node1.nodeType === Node.COMMENT_NODE
                    ? CompareNodesResult.DIFFERENT
                    : undefined
            }
        })
        test('override DIFFERENT -> IDENTICAL', () => {
            expect(config.compareNodes(div1, div2)).toBe(
                CompareNodesResult.IDENTICAL
            )
        })
        test('override DIFFERENT -> SIMILAR', () => {
            expect(config.compareNodes(text1, text2)).toBe(
                CompareNodesResult.SIMILAR
            )
        })
        test('override IDENTICAL -> DIFFERENT', () => {
            expect(config.compareNodes(comment, comment)).toBe(
                CompareNodesResult.DIFFERENT
            )
        })
        test('default DIFFERENT', () => {
            expect(config.compareNodes(span1, span2)).toBe(
                CompareNodesResult.DIFFERENT
            )
        })
        test('default IDENTICAL', () => {
            expect(config.compareNodes(video, video.cloneNode(false))).toBe(
                CompareNodesResult.IDENTICAL
            )
        })
    })
})

describe('simple options', () => {
    test('default', () => {
        const config = optionsToConfig()
        expect(config.addedClass).toBe('vdd-added')
        expect(config.ignoreCase).toBe(false)
        expect(config.modifiedClass).toBe('vdd-modified')
        expect(config.removedClass).toBe('vdd-removed')
    })
    test('override', () => {
        const config = optionsToConfig({
            addedClass: 'ADDED',
            ignoreCase: true,
            modifiedClass: 'MODIFIED',
            removedClass: 'REMOVED'
        })
        expect(config.addedClass).toBe('ADDED')
        expect(config.ignoreCase).toBe(true)
        expect(config.modifiedClass).toBe('MODIFIED')
        expect(config.removedClass).toBe('REMOVED')
    })
})
