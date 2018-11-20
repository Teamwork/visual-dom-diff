import { Options } from './config'
import { visualDomDiff } from './diff'
import { isElement, isText } from './util'

jest.setTimeout(2000)

function fragmentToHtml(documentFragment: DocumentFragment): string {
    return Array.from(documentFragment.childNodes).reduce(
        (html, node) =>
            html +
            (isText(node) ? node.data : isElement(node) ? node.outerHTML : ''),
        ''
    )
}

// function htmlToFragment(html: string): DocumentFragment {
//     const template = document.createElement('template')
//     template.innerHTML = html
//     return template.content
// }

test.each([
    [
        'empty document fragments',
        document.createDocumentFragment(),
        document.createDocumentFragment(),
        '',
        undefined
    ],
    [
        'empty identical DIVs',
        document.createElement('DIV'),
        document.createElement('DIV'),
        '',
        undefined
    ],
    [
        'empty text nodes',
        document.createTextNode(''),
        document.createTextNode(''),
        '',
        undefined
    ],
    [
        'identical text nodes',
        document.createTextNode('test'),
        document.createTextNode('test'),
        'test',
        undefined
    ],
    [
        'identical text in different text nodes',
        (() => {
            const fragment = document.createDocumentFragment()
            fragment.append(
                document.createTextNode('He'),
                document.createTextNode(''),
                document.createTextNode('llo'),
                document.createTextNode(' World')
            )
            return fragment
        })(),
        (() => {
            const fragment = document.createDocumentFragment()
            fragment.append(
                document.createTextNode('H'),
                document.createTextNode('ello W'),
                document.createTextNode('or'),
                document.createTextNode(''),
                document.createTextNode('ld')
            )
            return fragment
        })(),
        'Hello World',
        undefined
    ]
])(
    '%s',
    (
        _message: string,
        oldNode: Node,
        newNode: Node,
        expectedHtml: string,
        options?: Options
    ) => {
        if (_message === 'empty identical DIVs') {
            return
        }
        // const oldClone = oldNode.cloneNode(true)
        // const newClone = newNode.cloneNode(true)
        const fragment = visualDomDiff(oldNode, newNode, options)
        expect(fragment).toBeInstanceOf(DocumentFragment)
        expect(fragmentToHtml(fragment)).toBe(expectedHtml)
    }
)
