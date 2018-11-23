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
    ],
    [
        'some content removed',
        htmlToFragment('Prefix Removed <p>Paragraph</p> Suffix'),
        htmlToFragment('Prefix Suffix'),
        'Prefix <del class="vdd-removed">Removed <p>Paragraph</p> </del>Suffix',
        undefined
    ],
    [
        'some content added',
        htmlToFragment('Prefix Suffix'),
        htmlToFragment('Prefix Added <p>Paragraph</p> Suffix'),
        'Prefix <ins class="vdd-added">Added <p>Paragraph</p> </ins>Suffix',
        undefined
    ],
    [
        'some content unwrapped',
        htmlToFragment('Prefix <p>Paragraph</p> Suffix'),
        htmlToFragment('Prefix Paragraph Suffix'),
        'Prefix <del class="vdd-removed"><p>Paragraph</p></del><ins class="vdd-added">Paragraph</ins> Suffix',
        undefined
    ],
    [
        'some content wrapped',
        htmlToFragment('Prefix Paragraph Suffix'),
        htmlToFragment('Prefix <p>Paragraph</p> Suffix'),
        'Prefix <del class="vdd-removed">Paragraph</del><ins class="vdd-added"><p>Paragraph</p></ins> Suffix',
        undefined
    ],
    [
        'formatting removed',
        htmlToFragment('Prefix <strong>Strong</strong><em>Em</em> Suffix'),
        htmlToFragment('Prefix StrongEm Suffix'),
        'Prefix <ins class="vdd-modified">StrongEm</ins> Suffix',
        undefined
    ],
    [
        'formatting added',
        htmlToFragment('Prefix StrongEm Suffix'),
        htmlToFragment('Prefix <strong>Strong</strong><em>Em</em> Suffix'),
        'Prefix <ins class="vdd-modified"><strong>Strong</strong><em>Em</em></ins> Suffix',
        undefined
    ],
    [
        'formatting modified',
        htmlToFragment('Prefix <strong>formatted</strong> Suffix'),
        htmlToFragment('Prefix <em>formatted</em> Suffix'),
        'Prefix <ins class="vdd-modified"><em>formatted</em></ins> Suffix',
        undefined
    ],
    [
        'nested formatting',
        htmlToFragment('Prefix <strong><em>formatted</em></strong> Suffix'),
        htmlToFragment('Prefix <strong><em>formatted</em></strong> Suffix'),
        'Prefix <strong><em>formatted</em></strong> Suffix',
        undefined
    ],
    [
        '2 text nodes with modified formatting',
        htmlToFragment('Prefix <strong><code>formatted</code></strong> Suffix'),
        htmlToFragment(
            'Prefix <strong><span style="color:red;">form<!-- force 2 text nodes -->atted</span></strong> Suffix'
        ),
        'Prefix <ins class="vdd-modified"><strong><span style="color:red;">formatted</span></strong></ins> Suffix',
        undefined
    ],
    [
        'nested text change',
        htmlToFragment(
            trimLines(`
                <div>
                    <p>
                        <strong><em>Prefix before Suffix</em></strong>
                    </p>
                </div>
            `)
        ),
        htmlToFragment(
            trimLines(`
                <div>
                    <p>
                        <strong><em>Prefix after Suffix</em></strong>
                    </p>
                </div>
            `)
        ),
        trimLines(`
            <div>
                <p>
                    <strong><em>Prefix </em></strong>
                    <del class="vdd-removed"><strong><em>before</em></strong></del>
                    <ins class="vdd-added"><strong><em>after</em></strong></ins>
                    <strong><em> Suffix</em></strong>
                </p>
            </div>
        `),
        undefined
    ],
    [
        'formatting in differing content - the same text diff',
        htmlToFragment('<ul><li><strong><em>text</em></strong></li></ul>'),
        htmlToFragment('<ol><li><strong><code>text</code></strong></li></ol>'),
        '<del class="vdd-removed"><ul><li><strong><em>text</em></strong></li></ul></del>' +
            '<ins class="vdd-added"><ol><li><strong><code>text</code></strong></li></ol></ins>',
        undefined
    ],
    [
        'formatting in differing content - different text diff',
        htmlToFragment('<ul><li><strong><em>before</em></strong></li></ul>'),
        htmlToFragment('<ol><li><strong><code>after</code></strong></li></ol>'),
        '<del class="vdd-removed"><ul><li><strong><em>before</em></strong></li></ul></del>' +
            '<ins class="vdd-added"><ol><li><strong><code>after</code></strong></li></ol></ins>',
        undefined
    ],
    [
        'differing image src',
        htmlToFragment('<div><img src="image.png"></div>'),
        htmlToFragment('<div><img src="image.jpg"></div>'),
        '<div><del class="vdd-removed"><img src="image.png"></del><ins class="vdd-added"><img src="image.jpg"></ins></div>',
        undefined
    ],
    [
        'multiple spaces between words',
        htmlToFragment('prefix  suffix'),
        htmlToFragment('prefix   suffix'),
        'prefix<del class="vdd-removed">  </del><ins class="vdd-added">   </ins>suffix',
        undefined
    ],
    [
        'custom skipChildren option',
        htmlToFragment(
            '<p>This content is skipped</p><video><source></video><div><img>Hello</div>'
        ),
        htmlToFragment(
            '<p>Ignored too</p><video><source></video><div><img>Hello</div>'
        ),
        '<p></p><video><source></video><div><img>Hello</div>',
        {
            skipChildren(node: Node): boolean | undefined {
                return node.nodeName === 'VIDEO'
                    ? false
                    : node.nodeName === 'P'
                    ? true
                    : undefined
            }
        }
    ],
    [
        'custom skipSelf option',
        htmlToFragment(
            '<a><strong>p as formatting</strong></a> <strong>em as structure</strong>'
        ),
        htmlToFragment(
            '<p><a>p as formatting</a></p> <em>em as structure</em>'
        ),
        '<a><ins class="vdd-modified"><p>p as formatting</p></ins></a> ' +
            '<del class="vdd-removed"><strong>em as structure</strong></del><ins class="vdd-added"><em>em as structure</em></ins>',
        {
            skipSelf(node: Node): boolean | undefined {
                return node.nodeName === 'EM'
                    ? false
                    : node.nodeName === 'P'
                    ? true
                    : undefined
            }
        }
    ],
    [
        'custom class names',
        htmlToFragment('<strong>Modified</strong> Removed'),
        htmlToFragment('Modified Added'),
        '<ins class="MODIFIED">Modified</ins> <del class="REMOVED">Removed</del><ins class="ADDED">Added</ins>',
        {
            addedClass: 'ADDED',
            modifiedClass: 'MODIFIED',
            removedClass: 'REMOVED'
        }
    ],
    [
        'change letter case',
        htmlToFragment('Lowercase'),
        htmlToFragment('lowercase'),
        '<del class="vdd-removed">Lowercase</del><ins class="vdd-added">lowercase</ins>',
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
