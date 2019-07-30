import { Change } from 'diff'
import { JSDOM } from 'jsdom'
import {
    areArraysEqual,
    areNodesEqual,
    diffText,
    getAncestors,
    isComment,
    isDocument,
    isDocumentFragment,
    isElement,
    isText,
    never
} from './util'

const text = document.createTextNode('text')
const identicalText = document.createTextNode('text')
const differentText = document.createTextNode('different text')
const span = document.createElement('SPAN')
const identicalSpan = document.createElement('SPAN')
const differentAttributeNamesSpan = document.createElement('SPAN')
const differentAttributeValuesSpan = document.createElement('SPAN')
const differentChildNodesSpan = document.createElement('SPAN')
const video = document.createElement('VIDEO')
const comment = document.createComment('comment')
const identicalComment = document.createComment('comment')
const differentComment = document.createComment('different comment')
const fragment = document.createDocumentFragment()
const anotherFragment = document.createDocumentFragment()

span.setAttribute('data-a', 'a')
span.setAttribute('data-b', 'b')
identicalSpan.setAttribute('data-b', 'b')
identicalSpan.setAttribute('data-a', 'a')
differentAttributeNamesSpan.setAttribute('data-a', 'a')
differentAttributeNamesSpan.setAttribute('data-b', 'b')
differentAttributeNamesSpan.setAttribute('data-c', 'c')
differentAttributeValuesSpan.setAttribute('data-a', 'different a')
differentAttributeValuesSpan.setAttribute('data-b', 'different b')
differentChildNodesSpan.setAttribute('data-a', 'a')
differentChildNodesSpan.setAttribute('data-b', 'b')
differentChildNodesSpan.appendChild(document.createTextNode('different'))

describe('isText', () => {
    test('return true given a text node', () => {
        expect(isText(text)).toBe(true)
    })
    test('return false given a SPAN', () => {
        expect(isText(span)).toBe(false)
    })
    test('return false given a document', () => {
        expect(isText(document)).toBe(false)
    })
    test('return false given a document fragment', () => {
        expect(isText(fragment)).toBe(false)
    })
    test('return false given a comment', () => {
        expect(isText(comment)).toBe(false)
    })
})

describe('isElement', () => {
    test('return false given a text node', () => {
        expect(isElement(text)).toBe(false)
    })
    test('return true given a SPAN', () => {
        expect(isElement(span)).toBe(true)
    })
    test('return false given a document', () => {
        expect(isElement(document)).toBe(false)
    })
    test('return false given a document fragment', () => {
        expect(isElement(fragment)).toBe(false)
    })
    test('return false given a comment', () => {
        expect(isElement(comment)).toBe(false)
    })
})

describe('isDocument', () => {
    test('return false given a text node', () => {
        expect(isDocument(text)).toBe(false)
    })
    test('return false given a SPAN', () => {
        expect(isDocument(span)).toBe(false)
    })
    test('return true given a document', () => {
        expect(isDocument(document)).toBe(true)
        expect(isDocument(new JSDOM('').window.document)).toBe(true)
    })
    test('return false given a document fragment', () => {
        expect(isDocument(fragment)).toBe(false)
    })
    test('return false given a comment', () => {
        expect(isDocument(comment)).toBe(false)
    })
})

describe('isDocumentFragment', () => {
    test('return false given a text node', () => {
        expect(isDocumentFragment(text)).toBe(false)
    })
    test('return false given a SPAN', () => {
        expect(isDocumentFragment(span)).toBe(false)
    })
    test('return false given a document', () => {
        expect(isDocumentFragment(document)).toBe(false)
    })
    test('return true given a document fragment', () => {
        expect(isDocumentFragment(fragment)).toBe(true)
    })
    test('return false given a comment', () => {
        expect(isDocumentFragment(comment)).toBe(false)
    })
})

describe('isComment', () => {
    test('return false given a text node', () => {
        expect(isComment(text)).toBe(false)
    })
    test('return false given a SPAN', () => {
        expect(isComment(span)).toBe(false)
    })
    test('return false given a document', () => {
        expect(isComment(document)).toBe(false)
    })
    test('return true given a document fragment', () => {
        expect(isComment(fragment)).toBe(false)
    })
    test('return true given a comment', () => {
        expect(isComment(comment)).toBe(true)
    })
})

describe('areArraysEqual', () => {
    describe('default comparator', () => {
        test('empty arrays', () => {
            expect(areArraysEqual([], [])).toBe(true)
        })
        test('different length', () => {
            expect(areArraysEqual([1], [1, 2])).toBe(false)
        })
        test('different item types', () => {
            expect(areArraysEqual([1, 2], [1, '2'])).toBe(false)
        })
        test('identical arrays', () => {
            expect(areArraysEqual([1, '2', text], [1, '2', text])).toBe(true)
        })
        test('the same nodes', () => {
            expect(areArraysEqual([text, text], [text, text])).toBe(true)
        })
        test('identical nodes', () => {
            expect(areArraysEqual([text, text], [text, identicalText])).toBe(
                false
            )
        })
        test('different nodes', () => {
            expect(areArraysEqual([text, text], [text, differentText])).toBe(
                false
            )
        })
    })
    describe('node comparator', () => {
        test('the same nodes', () => {
            expect(
                areArraysEqual([text, text], [text, text], areNodesEqual)
            ).toBe(true)
        })
        test('identical nodes', () => {
            expect(
                areArraysEqual(
                    [text, text],
                    [text, identicalText],
                    areNodesEqual
                )
            ).toBe(true)
        })
        test('different nodes', () => {
            expect(
                areArraysEqual(
                    [text, text],
                    [text, differentText],
                    areNodesEqual
                )
            ).toBe(false)
        })
    })
})

describe('areNodesEqual', () => {
    describe('shallow', () => {
        test('the same node', () => {
            expect(areNodesEqual(text, text)).toBe(true)
        })
        test('different node types', () => {
            expect(areNodesEqual(text, span)).toBe(false)
        })
        test('different node names', () => {
            expect(areNodesEqual(video, span)).toBe(false)
        })
        test('different comment nodes', () => {
            expect(areNodesEqual(comment, differentComment)).toBe(false)
        })
        test('identical comment nodes', () => {
            expect(areNodesEqual(comment, identicalComment)).toBe(true)
        })
        test('different text nodes', () => {
            expect(areNodesEqual(text, differentText)).toBe(false)
        })
        test('identical text nodes', () => {
            expect(areNodesEqual(text, identicalText)).toBe(true)
        })
        test('elements with different attribute names', () => {
            expect(areNodesEqual(span, differentAttributeNamesSpan)).toBe(false)
        })
        test('elements with different attribute values', () => {
            expect(areNodesEqual(span, differentAttributeValuesSpan)).toBe(
                false
            )
        })
        test('elements with different childNodes', () => {
            expect(areNodesEqual(span, differentChildNodesSpan)).toBe(true)
        })
        test('identical elements', () => {
            expect(areNodesEqual(span, identicalSpan)).toBe(true)
        })
        test('document fragments', () => {
            expect(areNodesEqual(fragment, anotherFragment)).toBe(true)
        })
    })
    describe('deep', () => {
        const rootNode = document.createDocumentFragment()
        const div = document.createElement('DIV')
        const p = document.createElement('P')
        const em = document.createElement('EM')
        const strong = document.createElement('STRONG')
        rootNode.append(div, p)
        p.append(em, strong)
        em.textContent = 'em'
        strong.textContent = 'strong'

        test('identical nodes', () => {
            expect(
                areNodesEqual(
                    rootNode.cloneNode(true),
                    rootNode.cloneNode(true),
                    true
                )
            ).toBe(true)
        })
        test('extraneous child', () => {
            const differentRootNode = rootNode.cloneNode(true)
            ;((differentRootNode.lastChild as Node)
                .lastChild as Node).appendChild(
                document.createTextNode('different')
            )
            expect(
                areNodesEqual(rootNode.cloneNode(true), differentRootNode, true)
            ).toBe(false)
        })
        test('child with a different attribute', () => {
            const differentRootNode = rootNode.cloneNode(true)
            ;((differentRootNode.lastChild as Node)
                .lastChild as Element).setAttribute('data-a', 'a')
            expect(
                areNodesEqual(rootNode.cloneNode(true), differentRootNode, true)
            ).toBe(false)
        })
    })
})

describe('getAncestors', () => {
    const node1 = document.createDocumentFragment()
    const node2 = document.createElement('DIV')
    const node3 = document.createTextNode('test')

    node1.append(node2)
    node2.append(node3)

    const testData: Array<[Node, Node | undefined | null, Node[]]> = [
        [node1, undefined, []],
        [node2, undefined, [node1]],
        [node3, undefined, [node2, node1]],
        [node1, null, []],
        [node2, null, [node1]],
        [node3, null, [node2, node1]],
        [node1, node1, []],
        [node2, node1, [node1]],
        [node3, node1, [node2, node1]],
        [node1, node2, []],
        [node2, node2, []],
        [node3, node2, [node2]],
        [node1, node3, []],
        [node2, node3, [node1]],
        [node3, node3, []]
    ]

    testData.forEach(([node, rootNode, ancestors]) => {
        test(`node: ${node.nodeName}; root: ${rootNode &&
            rootNode.nodeName}`, () => {
            expect(getAncestors(node, rootNode)).toStrictEqual(ancestors)
        })
    })
})

describe('never', () => {
    test('default message', () => {
        expect(() => never()).toThrowError(
            'visual-dom-diff: Should never happen'
        )
    })
    test('custom message', () => {
        expect(() => never('Custom message')).toThrowError('Custom message')
    })
})

describe('diffText', () => {
    const result = (
        added: boolean,
        removed: boolean,
        value: string
    ): Change => ({ count: undefined, added, removed, value })

    test('empty inputs', () => {
        expect(diffText('', '')).toStrictEqual([])
    })
    test('identical inputs', () => {
        expect(diffText('test', 'test')).toStrictEqual([
            result(false, false, 'test')
        ])
    })
    test('different letter case', () => {
        expect(diffText('test', 'Test')).toStrictEqual([
            result(false, true, 'test'),
            result(true, false, 'Test')
        ])
    })
    test('different letter case with ignoreCase option', () => {
        expect(diffText('test', 'Test', { ignoreCase: true })).toStrictEqual([
            result(false, false, 'Test')
        ])
    })
    test('different whitespace', () => {
        expect(diffText('start  end', 'start     end')).toStrictEqual([
            result(false, false, 'start'),
            result(false, true, '  '),
            result(true, false, '     '),
            result(false, false, 'end')
        ])
    })
    test('word added', () => {
        expect(diffText('start end', 'start add end')).toStrictEqual([
            result(false, false, 'start '),
            result(true, false, 'add '),
            result(false, false, 'end')
        ])
    })
    test('word removed', () => {
        expect(diffText('start remove end', 'start end')).toStrictEqual([
            result(false, false, 'start '),
            result(false, true, 'remove '),
            result(false, false, 'end')
        ])
    })
    test('word replaced', () => {
        expect(diffText('start remove end', 'start add end')).toStrictEqual([
            result(false, false, 'start '),
            result(false, true, 'remove'),
            result(true, false, 'add'),
            result(false, false, ' end')
        ])
    })
    test('word added with \\0', () => {
        expect(diffText('\0start\0end', '\0start\0add\0end')).toStrictEqual([
            result(false, false, '\0start'),
            result(true, false, '\0add'),
            result(false, false, '\0end')
        ])
    })
    test('word removed with \\0', () => {
        expect(diffText('\0start\0remove\0end', '\0start\0end')).toStrictEqual([
            result(false, false, '\0start'),
            result(false, true, '\0remove'),
            result(false, false, '\0end')
        ])
    })
    test('word replaced with \\0', () => {
        expect(
            diffText('\0start\0remove\0end', '\0start\0add\0end')
        ).toStrictEqual([
            result(false, false, '\0start\0'),
            result(false, true, 'remove'),
            result(true, false, 'add'),
            result(false, false, '\0end')
        ])
    })
})
