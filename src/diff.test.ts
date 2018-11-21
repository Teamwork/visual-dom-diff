import { Options } from './config'
import { visualDomDiff } from './diff'
import { compareNodes, isElement, isText } from './util'

jest.setTimeout(2000)

function fragmentToHtml(documentFragment: DocumentFragment): string {
    return Array.from(documentFragment.childNodes).reduce(
        (html, node) =>
            html +
            (isText(node) ? node.data : isElement(node) ? node.outerHTML : ''),
        ''
    )
}

function htmlToFragment(html: string): DocumentFragment {
    const template = document.createElement('template')
    template.innerHTML = html
    return template.content
}

// function trimLines(text: string): string {
//     return text.replace(/(^|\n)\s*/g, '')
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
        '<div></div>',
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
        'identical text in a DIV',
        (() => {
            const div = document.createElement('DIV')
            div.textContent = 'test'
            return div
        })(),
        (() => {
            const div = document.createElement('DIV')
            div.textContent = 'test'
            return div
        })(),
        '<div>test</div>',
        undefined
    ],
    [
        'identical text in a DIV in a document fragment',
        htmlToFragment('<div>test</div>'),
        htmlToFragment('<div>test</div>'),
        '<div>test</div>',
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
    ],
    [
        'identical images',
        document.createElement('IMG'),
        document.createElement('IMG'),
        '<img>',
        undefined
    ]
    // ,
    // [
    //     'complex identical content',
    //     htmlToFragment(
    //         trimLines(`
    //             <div>
    //                 <p><strong>Paragraph 1</strong></p>
    //                 <p><strong><em>Paragraph 2</em></strong></p>
    //                 <img src="image.jpg">
    //                 <img src="image.png">
    //                 More text
    //                 <video></video>
    //             </div>
    //             <div></div>
    //             `)
    //     ),
    //     htmlToFragment(
    //         trimLines(`
    //             <div>
    //                 <p><strong>Paragraph 1</strong></p>
    //                 <p><strong><em>Paragraph 2</em></strong></p>
    //                 <img src="image.jpg">
    //                 <img src="image.png">
    //                 More text
    //                 <video></video>
    //             </div>
    //             <div></div>
    //             `)
    //     ),
    //     trimLines(`
    //         <div>
    //             <p><strong>Paragraph 1</strong></p>
    //             <p><strong><em>Paragraph 2</em></strong></p>
    //             <img src="image.jpg">
    //             <img src="image.png">
    //             More text
    //             <video></video>
    //         </div>
    //         <div></div>
    //         `),
    //     undefined
    // ]
])(
    '%s',
    (
        _message: string,
        oldNode: Node,
        newNode: Node,
        expectedHtml: string,
        options?: Options
    ) => {
        const oldClone = oldNode.cloneNode(true)
        const newClone = newNode.cloneNode(true)
        const fragment = visualDomDiff(oldNode, newNode, options)
        expect(fragment).toBeInstanceOf(DocumentFragment)
        expect(fragmentToHtml(fragment)).toBe(expectedHtml)
        expect(compareNodes(oldNode, oldClone, true)).toBe(true)
        expect(compareNodes(newNode, newClone, true)).toBe(true)
    }
)
