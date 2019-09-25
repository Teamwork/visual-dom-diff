import { Diff, DIFF_DELETE, DIFF_EQUAL, DIFF_INSERT } from 'diff-match-patch'
import { JSDOM } from 'jsdom'
import {
    areArraysEqual,
    areNodesEqual,
    charForNodeName,
    cleanUpNodeMarkers,
    diffText,
    getAncestors,
    isComment,
    isDocument,
    isDocumentFragment,
    isElement,
    isText,
    never,
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
const pChar = charForNodeName('P')
const ulChar = charForNodeName('UL')
const liChar = charForNodeName('LI')

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
                false,
            )
        })
        test('different nodes', () => {
            expect(areArraysEqual([text, text], [text, differentText])).toBe(
                false,
            )
        })
    })
    describe('node comparator', () => {
        test('the same nodes', () => {
            expect(
                areArraysEqual([text, text], [text, text], areNodesEqual),
            ).toBe(true)
        })
        test('identical nodes', () => {
            expect(
                areArraysEqual(
                    [text, text],
                    [text, identicalText],
                    areNodesEqual,
                ),
            ).toBe(true)
        })
        test('different nodes', () => {
            expect(
                areArraysEqual(
                    [text, text],
                    [text, differentText],
                    areNodesEqual,
                ),
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
                false,
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
                    true,
                ),
            ).toBe(true)
        })
        test('extraneous child', () => {
            const differentRootNode = rootNode.cloneNode(true)
            ;((differentRootNode.lastChild as Node)
                .lastChild as Node).appendChild(
                document.createTextNode('different'),
            )
            expect(
                areNodesEqual(
                    rootNode.cloneNode(true),
                    differentRootNode,
                    true,
                ),
            ).toBe(false)
        })
        test('child with a different attribute', () => {
            const differentRootNode = rootNode.cloneNode(true)
            ;((differentRootNode.lastChild as Node)
                .lastChild as Element).setAttribute('data-a', 'a')
            expect(
                areNodesEqual(
                    rootNode.cloneNode(true),
                    differentRootNode,
                    true,
                ),
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
        [node3, node3, []],
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
            'visual-dom-diff: Should never happen',
        )
    })
    test('custom message', () => {
        expect(() => never('Custom message')).toThrowError('Custom message')
    })
})

describe('diffText', () => {
    test('empty inputs', () => {
        expect(diffText('', '')).toStrictEqual([])
    })
    test('identical inputs', () => {
        expect(diffText('test', 'test')).toStrictEqual([[DIFF_EQUAL, 'test']])
    })
    test('insert into empty', () => {
        expect(diffText('', 'test')).toStrictEqual([[DIFF_INSERT, 'test']])
    })
    test('delete all', () => {
        expect(diffText('test', '')).toStrictEqual([[DIFF_DELETE, 'test']])
    })
    test('different letter case', () => {
        expect(diffText('test', 'Test')).toStrictEqual([
            [DIFF_DELETE, 't'],
            [DIFF_INSERT, 'T'],
            [DIFF_EQUAL, 'est'],
        ])
    })
    test('different whitespace', () => {
        expect(diffText('start  end', 'start     end')).toStrictEqual([
            [DIFF_EQUAL, 'start  '],
            [DIFF_INSERT, '   '],
            [DIFF_EQUAL, 'end'],
        ])
    })
    test('word added', () => {
        expect(diffText('start end', 'start add end')).toStrictEqual([
            [DIFF_EQUAL, 'start '],
            [DIFF_INSERT, 'add '],
            [DIFF_EQUAL, 'end'],
        ])
    })
    test('word removed', () => {
        expect(diffText('start remove end', 'start end')).toStrictEqual([
            [DIFF_EQUAL, 'start '],
            [DIFF_DELETE, 'remove '],
            [DIFF_EQUAL, 'end'],
        ])
    })
    test('word replaced', () => {
        expect(diffText('start remove end', 'start add end')).toStrictEqual([
            [DIFF_EQUAL, 'start '],
            [DIFF_DELETE, 'remove'],
            [DIFF_INSERT, 'add'],
            [DIFF_EQUAL, ' end'],
        ])
    })
    test('word added with a node marker', () => {
        expect(
            diffText(
                `${pChar}start${pChar}end`,
                `${pChar}start${pChar}add${pChar}end`,
            ),
        ).toStrictEqual([
            [DIFF_EQUAL, `${pChar}start`],
            [DIFF_INSERT, `${pChar}add`],
            [DIFF_EQUAL, `${pChar}end`],
        ])
    })
    test('word removed with a node marker', () => {
        expect(
            diffText(
                `${pChar}start${pChar}remove${pChar}end`,
                `${pChar}start${pChar}end`,
            ),
        ).toStrictEqual([
            [DIFF_EQUAL, `${pChar}start`],
            [DIFF_DELETE, `${pChar}remove`],
            [DIFF_EQUAL, `${pChar}end`],
        ])
    })
    test('word replaced in text with node markers', () => {
        expect(
            diffText(
                `${pChar}start${pChar}remove${pChar}end`,
                `${pChar}start${pChar}add${pChar}end`,
            ),
        ).toStrictEqual([
            [DIFF_EQUAL, `${pChar}start${pChar}`],
            [DIFF_DELETE, 'remove'],
            [DIFF_INSERT, 'add'],
            [DIFF_EQUAL, `${pChar}end`],
        ])
    })
    test('semantic diff', () => {
        expect(diffText('mouse', 'sofas')).toStrictEqual([
            [DIFF_DELETE, 'mouse'],
            [DIFF_INSERT, 'sofas'],
        ])
    })
    describe('skip node markers when running diff_cleanupSemantic', () => {
        test('equal node markers only', () => {
            expect(
                diffText(
                    '\uE000\uE001\uE002\uE003',
                    '\uE000\uE001\uE002\uE003',
                ),
            ).toStrictEqual([[DIFF_EQUAL, '\uE000\uE001\uE002\uE003']])
        })
        test('equal node markers with prefix', () => {
            expect(
                diffText(
                    'a\uE000\uE001\uE002\uE003',
                    'a\uE000\uE001\uE002\uE003',
                ),
            ).toStrictEqual([[DIFF_EQUAL, 'a\uE000\uE001\uE002\uE003']])
        })
        test('equal node markers with suffix', () => {
            expect(
                diffText(
                    '\uE000\uE001\uE002\uE003z',
                    '\uE000\uE001\uE002\uE003z',
                ),
            ).toStrictEqual([[DIFF_EQUAL, '\uE000\uE001\uE002\uE003z']])
        })
        test('equal node markers with prefix and suffix', () => {
            expect(
                diffText(
                    'a\uE000\uE001\uE002\uE003z',
                    'a\uE000\uE001\uE002\uE003z',
                ),
            ).toStrictEqual([[DIFF_EQUAL, 'a\uE000\uE001\uE002\uE003z']])
        })
        test('equal prefix only', () => {
            expect(diffText('prefix', 'prefix')).toStrictEqual([
                [DIFF_EQUAL, 'prefix'],
            ])
        })
        test('changed letter within text', () => {
            expect(diffText('prefixAsuffix', 'prefixBsuffix')).toStrictEqual([
                [DIFF_EQUAL, 'prefix'],
                [DIFF_DELETE, 'A'],
                [DIFF_INSERT, 'B'],
                [DIFF_EQUAL, 'suffix'],
            ])
        })
        test('changed node within text', () => {
            expect(
                diffText('prefix\uE000suffix', 'prefix\uE001suffix'),
            ).toStrictEqual([
                [DIFF_EQUAL, 'prefix'],
                [DIFF_DELETE, '\uE000'],
                [DIFF_INSERT, '\uE001'],
                [DIFF_EQUAL, 'suffix'],
            ])
        })
        test('multiple changed letters around equal letter', () => {
            expect(diffText('abc!def', '123!456')).toStrictEqual([
                [DIFF_DELETE, 'abc!def'],
                [DIFF_INSERT, '123!456'],
            ])
        })
        test('multiple changed node markers around equal letter', () => {
            expect(
                diffText(
                    '\uE000\uE001\uE002!\uE003\uE004\uE005',
                    '\uE006\uE007\uE008!\uE009\uE00A\uE00B',
                ),
            ).toStrictEqual([
                [DIFF_DELETE, '\uE000\uE001\uE002!\uE003\uE004\uE005'],
                [DIFF_INSERT, '\uE006\uE007\uE008!\uE009\uE00A\uE00B'],
            ])
        })
        test('multiple changed letters around equal node marker', () => {
            expect(diffText('abc\uE000def', '123\uE000456')).toStrictEqual([
                [DIFF_DELETE, 'abc'],
                [DIFF_INSERT, '123'],
                [DIFF_EQUAL, '\uE000'],
                [DIFF_DELETE, 'def'],
                [DIFF_INSERT, '456'],
            ])
        })
        test('multiple changed node markers around equal node marker', () => {
            expect(
                diffText(
                    '\uE000\uE001\uE002\uF000\uE003\uE004\uE005',
                    '\uE006\uE007\uE008\uF000\uE009\uE00A\uE00B',
                ),
            ).toStrictEqual([
                [DIFF_DELETE, '\uE000\uE001\uE002'],
                [DIFF_INSERT, '\uE006\uE007\uE008'],
                [DIFF_EQUAL, '\uF000'],
                [DIFF_DELETE, '\uE003\uE004\uE005'],
                [DIFF_INSERT, '\uE009\uE00A\uE00B'],
            ])
        })
        test.each<string>([
            '!',
            '\u0000',
            '\uDFFF',
            '\uF900',
            '\uFFFF',
            '\uDFFF\uF900',
        ])(
            'identical text without node markers inside changed text (%#)',
            string => {
                expect(
                    diffText(`abcdef${string}ghijkl`, `123456${string}7890-=`),
                ).toStrictEqual([
                    [DIFF_DELETE, `abcdef${string}ghijkl`],
                    [DIFF_INSERT, `123456${string}7890-=`],
                ])
            },
        )
        test.each<string>([
            '\uE000',
            '\uEFEF',
            '\uF8FF',
            '\uE000\uF8FF',
            '\uE000!\uF8FF',
        ])(
            'identical text with node markers inside changed text (%#)',
            string => {
                expect(
                    diffText(`abcdef${string}ghijkl`, `123456${string}7890-=`),
                ).toStrictEqual([
                    [DIFF_DELETE, 'abcdef'],
                    [DIFF_INSERT, '123456'],
                    [DIFF_EQUAL, string],
                    [DIFF_DELETE, 'ghijkl'],
                    [DIFF_INSERT, '7890-='],
                ])
            },
        )
    })
})

describe('cleanUpNodeMarkers', () => {
    test('cleans up multiple node markers in delete', () => {
        const diff: Diff[] = [
            [DIFF_EQUAL, `abc${pChar}${ulChar}${liChar}${liChar}`],
            [DIFF_DELETE, `${pChar}${ulChar}${liChar}${liChar}`],
            [DIFF_EQUAL, `${pChar}${ulChar}${liChar}${liChar}xyz`],
        ]
        cleanUpNodeMarkers(diff)
        expect(diff).toStrictEqual([
            [DIFF_EQUAL, `abc`],
            [DIFF_DELETE, `${pChar}${ulChar}${liChar}${liChar}`],
            [
                DIFF_EQUAL,
                `${pChar}${ulChar}${liChar}${liChar}${pChar}${ulChar}${liChar}${liChar}xyz`,
            ],
        ])
    })
    test('cleans up multiple node markers in insert', () => {
        const diff: Diff[] = [
            [DIFF_EQUAL, `abc${pChar}${ulChar}${liChar}${liChar}`],
            [DIFF_INSERT, `${pChar}${ulChar}${liChar}${liChar}`],
            [DIFF_EQUAL, `${pChar}${ulChar}${liChar}${liChar}xyz`],
        ]
        cleanUpNodeMarkers(diff)
        expect(diff).toStrictEqual([
            [DIFF_EQUAL, `abc`],
            [DIFF_INSERT, `${pChar}${ulChar}${liChar}${liChar}`],
            [
                DIFF_EQUAL,
                `${pChar}${ulChar}${liChar}${liChar}${pChar}${ulChar}${liChar}${liChar}xyz`,
            ],
        ])
    })
    test('cleans up a node marker in delete and removes a redundant diff item', () => {
        const diff: Diff[] = [
            [DIFF_EQUAL, `${pChar}`],
            [DIFF_DELETE, `abc${pChar}`],
            [DIFF_EQUAL, `${pChar}xyz`],
        ]
        cleanUpNodeMarkers(diff)
        expect(diff).toStrictEqual([
            [DIFF_DELETE, `${pChar}abc`],
            [DIFF_EQUAL, `${pChar}${pChar}xyz`],
        ])
    })
    test('cleans up a node marker in insert and removes a redundant diff item', () => {
        const diff: Diff[] = [
            [DIFF_EQUAL, `${pChar}`],
            [DIFF_INSERT, `abc${pChar}`],
            [DIFF_EQUAL, `${pChar}xyz`],
        ]
        cleanUpNodeMarkers(diff)
        expect(diff).toStrictEqual([
            [DIFF_INSERT, `${pChar}abc`],
            [DIFF_EQUAL, `${pChar}${pChar}xyz`],
        ])
    })
})
