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

function trimLines(text: string): string {
    return text.replace(/(^|\n)\s*/g, '')
}

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
    ],
    [
        'complex identical content',
        htmlToFragment(
            trimLines(`
                <div>
                    <p><a href="#">Paragraph 1</a></p>
                    <p><a>Paragraph 2</a></p>
                    <img src="image.jpg">
                    <img src="image.png">
                    More text
                    <video><source></video>
                </div>
                <div></div>
                `)
        ),
        htmlToFragment(
            trimLines(`
                <div>
                    <p><a href="#">Paragraph 1</a></p>
                    <p><a>Paragraph 2</a></p>
                    <img src="image.jpg">
                    <img src="image.png">
                    More text
                    <video><source></video>
                </div>
                <div></div>
                `)
        ),
        trimLines(`
            <div>
                <p><a href="#">Paragraph 1</a></p>
                <p><a>Paragraph 2</a></p>
                <img src="image.jpg">
                <img src="image.png">
                More text
                <video></video>
            </div>
            <div></div>
            `),
        undefined
    ],
    [
        'same structure but different nodes',
        htmlToFragment('Prefix <ul><li>Test</li></ul> Suffix'),
        htmlToFragment('Prefix <ol><li>Test</li></ol> Suffix'),
        'Prefix <del class="vdd-removed"><ul><li>Test</li></ul></del><ins class="vdd-added"><ol><li>Test</li></ol></ins> Suffix',
        undefined
    ],
    [
        'a \\0 character replaces a paragraph',
        (() => {
            const p = document.createElement('P')
            p.textContent = 'Test'
            return p
        })(),
        document.createTextNode('\0Test'),
        '<del class="vdd-removed"><p>Test</p></del><ins class="vdd-added">\0Test</ins>',
        undefined
    ],
    [
        'paragraph replaces a \\0 character',
        document.createTextNode('\0Test'),
        (() => {
            const p = document.createElement('P')
            p.textContent = 'Test'
            return p
        })(),
        '<del class="vdd-removed">\0Test</del><ins class="vdd-added"><p>Test</p></ins>',
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
        const oldClone = oldNode.cloneNode(true)
        const newClone = newNode.cloneNode(true)
        const fragment = visualDomDiff(oldNode, newNode, options)
        expect(fragment).toBeInstanceOf(DocumentFragment)
        expect(fragmentToHtml(fragment)).toBe(expectedHtml)
        expect(compareNodes(oldNode, oldClone, true)).toBe(true)
        expect(compareNodes(newNode, newClone, true)).toBe(true)
    }
)
