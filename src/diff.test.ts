import { JSDOM } from 'jsdom'
import { Options } from './config'
import { visualDomDiff } from './diff'
import { areNodesEqual, charForNodeName, isElement, isText } from './util'

jest.setTimeout(2000)

const pChar = charForNodeName('P')

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

test.each<[string, Node, Node, string, Options | undefined]>([
    [
        'empty documents',
        new JSDOM('').window.document,
        new JSDOM('').window.document,
        '<html><head></head><body></body></html>',
        undefined
    ],
    [
        'documents with identical content',
        new JSDOM('Hello').window.document,
        new JSDOM('Hello').window.document,
        '<html><head></head><body>Hello</body></html>',
        undefined
    ],
    [
        'documents with different content',
        new JSDOM('Prefix Old Suffix').window.document,
        new JSDOM('Prefix New Suffix').window.document,
        '<html><head></head><body>Prefix <del class="vdd-removed">Old</del><ins class="vdd-added">New</ins> Suffix</body></html>',
        undefined
    ],
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
        'different text nodes',
        document.createTextNode('Prefix Old Suffix'),
        document.createTextNode('Prefix New Suffix'),
        'Prefix <del class="vdd-removed">Old</del><ins class="vdd-added">New</ins> Suffix',
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
        'different images',
        (() => {
            const img = document.createElement('IMG')
            img.setAttribute('src', 'image.png')
            return img
        })(),
        (() => {
            const img = document.createElement('IMG')
            img.setAttribute('src', 'image.jpg')
            return img
        })(),
        '<del class="vdd-removed"><img src="image.png"></del><ins class="vdd-added"><img src="image.jpg"></ins>',
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
        'a character replaces a paragraph',
        (() => {
            const p = document.createElement('P')
            p.textContent = 'Test'
            return p
        })(),
        document.createTextNode(`${pChar}Test`),
        `<del class="vdd-removed"><p>Test</p></del><ins class="vdd-added">${pChar}Test</ins>`,
        undefined
    ],
    [
        'paragraph replaces a character',
        document.createTextNode(`${pChar}Test`),
        (() => {
            const p = document.createElement('P')
            p.textContent = 'Test'
            return p
        })(),
        `<del class="vdd-removed">${pChar}Test</del><ins class="vdd-added"><p>Test</p></ins>`,
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
        'prefix  <ins class="vdd-added"> </ins>suffix',
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
        '<ins class="MODIFIED">Modified</ins> <del class="REMOVED">Remov</del><ins class="ADDED">Add</ins>ed',
        {
            addedClass: 'ADDED',
            modifiedClass: 'MODIFIED',
            removedClass: 'REMOVED'
        }
    ],
    [
        'change letter case',
        htmlToFragment('Lowercase Removed'),
        htmlToFragment('lowercase Added'),
        '<del class="vdd-removed">L</del><ins class="vdd-added">l</ins>owercase ' +
            '<del class="vdd-removed">Remov</del><ins class="vdd-added">Add</ins>ed',
        undefined
    ],
    [
        'remove paragraph',
        htmlToFragment('<p>Removed</p><p>Common</p>'),
        htmlToFragment('<p>Common</p>'),
        '<del class="vdd-removed"><p>Removed</p></del><p>Common</p>',
        undefined
    ],
    [
        'add paragraph',
        htmlToFragment('<p>Common</p>'),
        htmlToFragment('<p>Added</p><p>Common</p>'),
        '<ins class="vdd-added"><p>Added</p></ins><p>Common</p>',
        undefined
    ],
    [
        'a table with a changed cell and text added after',
        htmlToFragment(
            `<p>This homepage is a bit unusual but I wouldn't worry about it. Nor would I tell the authorities, EVER!</p><table border="1" style="border-collapse:collapse;width:360px;"><tbody><tr><td style="width:253px;">scsac</td><td style="width:253px;">ascasc</td><td style="width:253px;">ascsac</td></tr><tr><td style="width:253px;">ascasc</td><td style="width:253px;">ascasc</td><td style="width:253px;">ascasc</td></tr><tr><td style="width:253px;"><br></td><td style="width:253px;">ascasc</td><td style="width:253px;"><br></td></tr></tbody></table><p><br></p>`
        ),
        htmlToFragment(
            `<p>This homepage is a bit unusual but I wouldn't worry about it. Nor would I tell the authorities, EVER!</p><table border="1" style="border-collapse:collapse;width:360px;"><tbody><tr><td style="width:253px;">scsac</td><td style="width:253px;">ascasc</td><td style="width:253px;">ascsac</td></tr><tr><td style="width:253px;">ascasc</td><td style="width:253px;">ascasc</td><td style="width:253px;">ascasc</td></tr><tr><td style="width:253px;">wdqdqwd</td><td style="width:253px;">ascasc</td><td style="width:253px;"><br></td></tr></tbody></table><p>sacascascas</p><p>sacasc</p><p>ascasc</p><p><br></p>`
        ),
        `<p>This homepage is a bit unusual but I wouldn't worry about it. Nor would I tell the authorities, EVER!</p><table border="1" style="border-collapse:collapse;width:360px;"><tbody><tr><td style="width:253px;">scsac</td><td style="width:253px;">ascasc</td><td style="width:253px;">ascsac</td></tr><tr><td style="width:253px;">ascasc</td><td style="width:253px;">ascasc</td><td style="width:253px;">ascasc</td></tr><tr><td style="width:253px;"><del class="vdd-removed"><br></del><ins class="vdd-added">wdqdqwd</ins></td><td style="width:253px;">ascasc</td><td style="width:253px;"><br></td></tr></tbody></table><ins class="vdd-added"><p>sacascascas</p><p>sacasc</p><p>ascasc</p></ins><p><br></p>`,
        undefined
    ],
    [
        'content and formatting changes when skipModified === true',
        htmlToFragment(
            '<p>prefix <strong>modified</strong> old suffix removed</p>'
        ),
        htmlToFragment(
            '<p>added prefix <em><u>modified</u></em> new suffix</p>'
        ),
        '<p><ins class="vdd-added">added </ins>prefix <em><u>modified</u></em> <del class="vdd-removed">old</del><ins class="vdd-added">new</ins> suffix<del class="vdd-removed"> removed</del></p>',
        {
            skipModified: true
        }
    ],
    [
        'content and formatting changes when skipModified === false',
        htmlToFragment(
            '<p>prefix <strong>modified</strong> old suffix removed</p>'
        ),
        htmlToFragment(
            '<p>added prefix <em><u>modified</u></em> new suffix</p>'
        ),
        '<p><ins class="vdd-added">added </ins>prefix <ins class="vdd-modified"><em><u>modified</u></em></ins> <del class="vdd-removed">old</del><ins class="vdd-added">new</ins> suffix<del class="vdd-removed"> removed</del></p>',
        {
            skipModified: false
        }
    ],
    [
        'equal node marker preservation',
        htmlToFragment(
            '<table border="1" data-style="border-collapse:collapse;height:214px;width:760px;"><thead><tr data-style="height:45px;"><th data-style="height:45px;width:253px;">wqdwqd</th><th data-style="height:45px;width:253px;">qwdwqd</th><th data-style="height:45px;width:253px;">wqdwqd</th></tr></thead><tbody><tr data-style="height:45px;"><td data-style="height:45px;width:253px;"> qwdwqd</td><td data-style="height:45px;width:253px;"> qwdwqd</td><td data-style="height:45px;width:253px;"> </td></tr><tr data-style="height:34px;"><td data-style="height:34px;width:253px;"> </td><td data-style="height:34px;width:253px;"> replaced</td><td data-style="height:34px;width:253px;"> aXAXa</td></tr><tr data-style="height:45px;"><td data-style="height:45px;width:253px;"> added</td><td data-style="height:45px;width:253px;"> </td><td data-style="height:45px;width:253px;"> </td></tr><tr data-style="height:45px;"><td data-style="height:45px;width:253px;"> </td><td data-style="height:45px;width:253px;"> </td><td data-style="height:45px;width:253px;"><strong>wqdwqdwd</strong></td></tr></tbody></table>'
        ),
        htmlToFragment(
            '<table border="1" data-style="border-collapse:collapse;height:214px;width:760px;"><thead><tr data-style="height:45px;"><th data-style="height:45px;width:253px;">wqdwqd</th><th data-style="height:45px;width:253px;">qwdwqd</th><th data-style="height:45px;width:253px;">wqdwqd</th></tr></thead><tbody><tr data-style="height:45px;"><td data-style="height:45px;width:253px;"> qwdwqd</td><td data-style="height:45px;width:253px;"> qwdwqd</td><td data-style="height:45px;width:253px;"><br></td></tr><tr data-style="height:34px;"><td data-style="height:34px;width:253px;"><br></td><td data-style="height:34px;width:253px;"> replaced</td><td data-style="height:34px;width:253px;"> aXAXa</td></tr><tr data-style="height:45px;"><td data-style="height:45px;width:253px;"> added</td><td data-style="height:45px;width:253px;"><br></td><td data-style="height:45px;width:253px;"><br></td></tr><tr data-style="height:45px;"><td data-style="height:45px;width:253px;"><br></td><td data-style="height:45px;width:253px;"><br></td><td data-style="height:45px;width:253px;"><strong>wqdwqdwd</strong></td></tr></tbody></table>'
        ),
        '<table border="1" data-style="border-collapse:collapse;height:214px;width:760px;"><thead><tr data-style="height:45px;"><th data-style="height:45px;width:253px;">wqdwqd</th><th data-style="height:45px;width:253px;">qwdwqd</th><th data-style="height:45px;width:253px;">wqdwqd</th></tr></thead><tbody><tr data-style="height:45px;"><td data-style="height:45px;width:253px;"> qwdwqd</td><td data-style="height:45px;width:253px;"> qwdwqd</td><td data-style="height:45px;width:253px;"><del class="vdd-removed"> </del><ins class="vdd-added"><br></ins></td></tr><tr data-style="height:34px;"><td data-style="height:34px;width:253px;"><del class="vdd-removed"> </del><ins class="vdd-added"><br></ins></td><td data-style="height:34px;width:253px;"> replaced</td><td data-style="height:34px;width:253px;"> aXAXa</td></tr><tr data-style="height:45px;"><td data-style="height:45px;width:253px;"> added</td><td data-style="height:45px;width:253px;"><del class="vdd-removed"> </del><ins class="vdd-added"><br></ins></td><td data-style="height:45px;width:253px;"><del class="vdd-removed"> </del><ins class="vdd-added"><br></ins></td></tr><tr data-style="height:45px;"><td data-style="height:45px;width:253px;"><del class="vdd-removed"> </del><ins class="vdd-added"><br></ins></td><td data-style="height:45px;width:253px;"><del class="vdd-removed"> </del><ins class="vdd-added"><br></ins></td><td data-style="height:45px;width:253px;"><strong>wqdwqdwd</strong></td></tr></tbody></table>',
        undefined
    ],
    [
        'add thead to table',
        htmlToFragment('<table><tbody><tr><td>body</td></tr></tbody></table>'),
        htmlToFragment(
            '<table><thead><tr><td>head</td></tr></thead><tbody><tr><td>body</td></tr></tbody></table>'
        ),
        '<table><thead><tr><td><ins class="vdd-added">head</ins></td></tr></thead><tbody><tr><td>body</td></tr></tbody></table>',
        undefined
    ],
    [
        'remove thead from table',
        htmlToFragment(
            '<table><thead><tr><td>head</td></tr></thead><tbody><tr><td>body</td></tr></tbody></table>'
        ),
        htmlToFragment('<table><tbody><tr><td>body</td></tr></tbody></table>'),
        '<table><thead><tr><td><del class="vdd-removed">head</del></td></tr></thead><tbody><tr><td>body</td></tr></tbody></table>',
        undefined
    ],
    [
        'add tr to thead',
        htmlToFragment(
            '<table><thead><tr><td>head</td></tr></thead><tbody><tr><td>body</td></tr></tbody><tfoot><tr><td>foot</td></tr></tfoot></table>'
        ),
        htmlToFragment(
            '<table><thead><tr><td>head</td></tr><tr><td>diff</td></tr></thead><tbody><tr><td>body</td></tr></tbody><tfoot><tr><td>foot</td></tr></tfoot></table>'
        ),
        '<table><thead><tr><td>head</td></tr><tr><td><ins class="vdd-added">diff</ins></td></tr></thead><tbody><tr><td>body</td></tr></tbody><tfoot><tr><td>foot</td></tr></tfoot></table>',
        undefined
    ],
    [
        'remove tr from thead',
        htmlToFragment(
            '<table><thead><tr><td>head</td></tr><tr><td>diff</td></tr></thead><tbody><tr><td>body</td></tr></tbody><tfoot><tr><td>foot</td></tr></tfoot></table>'
        ),
        htmlToFragment(
            '<table><thead><tr><td>head</td></tr></thead><tbody><tr><td>body</td></tr></tbody><tfoot><tr><td>foot</td></tr></tfoot></table>'
        ),
        '<table><thead><tr><td>head</td></tr><tr><td><del class="vdd-removed">diff</del></td></tr></thead><tbody><tr><td>body</td></tr></tbody><tfoot><tr><td>foot</td></tr></tfoot></table>',
        undefined
    ],
    [
        'add tr to tbody',
        htmlToFragment(
            '<table><thead><tr><td>head</td></tr></thead><tbody><tr><td>body</td></tr></tbody><tfoot><tr><td>foot</td></tr></tfoot></table>'
        ),
        htmlToFragment(
            '<table><thead><tr><td>head</td></tr></thead><tbody><tr><td>body</td></tr><tr><td>diff</td></tr></tbody><tfoot><tr><td>foot</td></tr></tfoot></table>'
        ),
        '<table><thead><tr><td>head</td></tr></thead><tbody><tr><td>body</td></tr><tr><td><ins class="vdd-added">diff</ins></td></tr></tbody><tfoot><tr><td>foot</td></tr></tfoot></table>',
        undefined
    ],
    [
        'remove tr from tbody',
        htmlToFragment(
            '<table><thead><tr><td>head</td></tr></thead><tbody><tr><td>body</td></tr><tr><td>diff</td></tr></tbody><tfoot><tr><td>foot</td></tr></tfoot></table>'
        ),
        htmlToFragment(
            '<table><thead><tr><td>head</td></tr></thead><tbody><tr><td>body</td></tr></tbody><tfoot><tr><td>foot</td></tr></tfoot></table>'
        ),
        '<table><thead><tr><td>head</td></tr></thead><tbody><tr><td>body</td></tr><tr><td><del class="vdd-removed">diff</del></td></tr></tbody><tfoot><tr><td>foot</td></tr></tfoot></table>',
        undefined
    ],
    [
        'add tr to tfoot',
        htmlToFragment(
            '<table><thead><tr><td>head</td></tr></thead><tbody><tr><td>body</td></tr></tbody><tfoot><tr><td>foot</td></tr></tfoot></table>'
        ),
        htmlToFragment(
            '<table><thead><tr><td>head</td></tr></thead><tbody><tr><td>body</td></tr></tbody><tfoot><tr><td>foot</td></tr><tr><td>diff</td></tr></tfoot></table>'
        ),
        '<table><thead><tr><td>head</td></tr></thead><tbody><tr><td>body</td></tr></tbody><tfoot><tr><td>foot</td></tr><tr><td><ins class="vdd-added">diff</ins></td></tr></tfoot></table>',
        undefined
    ],
    [
        'remove tr from tfoot',
        htmlToFragment(
            '<table><thead><tr><td>head</td></tr></thead><tbody><tr><td>body</td></tr></tbody><tfoot><tr><td>foot</td></tr><tr><td>diff</td></tr></tfoot></table>'
        ),
        htmlToFragment(
            '<table><thead><tr><td>head</td></tr></thead><tbody><tr><td>body</td></tr></tbody><tfoot><tr><td>foot</td></tr></tfoot></table>'
        ),
        '<table><thead><tr><td>head</td></tr></thead><tbody><tr><td>body</td></tr></tbody><tfoot><tr><td>foot</td></tr><tr><td><del class="vdd-removed">diff</del></td></tr></tfoot></table>',
        undefined
    ],
    [
        'add td to tr',
        htmlToFragment('<table><tbody><tr><td>body</td></tr></tbody></table>'),
        htmlToFragment(
            '<table><tbody><tr><td>body</td><td>diff</td></tr></tbody></table>'
        ),
        '<table><tbody><tr><td>body</td><td><ins class="vdd-added">diff</ins></td></tr></tbody></table>',
        undefined
    ],
    [
        'remove td from tr',
        htmlToFragment(
            '<table><tbody><tr><td>body</td><td>diff</td></tr></tbody></table>'
        ),
        htmlToFragment('<table><tbody><tr><td>body</td></tr></tbody></table>'),
        '<table><tbody><tr><td>body</td><td><del class="vdd-removed">diff</del></td></tr></tbody></table>',
        undefined
    ],
    [
        'add li to ul',
        htmlToFragment('<ul><li>item</li></ul>'),
        htmlToFragment('<ul><li>item</li><li>diff</li></ul>'),
        '<ul><li>item</li><li><ins class="vdd-added">diff</ins></li></ul>',
        undefined
    ],
    [
        'remove li from ul',
        htmlToFragment('<ul><li>item</li><li>diff</li></ul>'),
        htmlToFragment('<ul><li>item</li></ul>'),
        '<ul><li>item</li><li><del class="vdd-removed">diff</del></li></ul>',
        undefined
    ],
    [
        'add li to ol',
        htmlToFragment('<ol><li>item</li></ol>'),
        htmlToFragment('<ol><li>item</li><li>diff</li></ol>'),
        '<ol><li>item</li><li><ins class="vdd-added">diff</ins></li></ol>',
        undefined
    ],
    [
        'remove li from ol',
        htmlToFragment('<ol><li>item</li><li>diff</li></ol>'),
        htmlToFragment('<ol><li>item</li></ol>'),
        '<ol><li>item</li><li><del class="vdd-removed">diff</del></li></ol>',
        undefined
    ],
    [
        'add dd to dl',
        htmlToFragment('<dl><dt>term</dt></dl>'),
        htmlToFragment('<dl><dt>term</dt><dd>description</dd></dl>'),
        '<dl><dt>term</dt><dd><ins class="vdd-added">description</ins></dd></dl>',
        undefined
    ],
    [
        'remove dd from dl',
        htmlToFragment('<dl><dt>term</dt><dd>description</dd></dl>'),
        htmlToFragment('<dl><dt>term</dt></dl>'),
        '<dl><dt>term</dt><dd><del class="vdd-removed">description</del></dd></dl>',
        undefined
    ],
    [
        'add complex content to ul',
        htmlToFragment('<ul><li>item</li></ul>'),
        htmlToFragment(
            '<ul><li>item</li><li>prefix <strong>strong</strong> suffix</li><li>another<i>!</i></li></ul>'
        ),
        '<ul><li>item</li><li><ins class="vdd-added">prefix <strong>strong</strong> suffix</ins></li><li><ins class="vdd-added">another<i>!</i></ins></li></ul>',
        undefined
    ],
    [
        'add complex content to ul',
        htmlToFragment(
            '<ul><li>item</li><li>prefix <strong>strong</strong> suffix</li><li>another<i>!</i></li></ul>'
        ),
        htmlToFragment('<ul><li>item</li></ul>'),
        '<ul><li>item</li><li><del class="vdd-removed">prefix <strong>strong</strong> suffix</del></li><li><del class="vdd-removed">another<i>!</i></del></li></ul>',
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
        expect(fragment.nodeName).toBe('#document-fragment')
        expect(fragmentToHtml(fragment)).toBe(expectedHtml)
        expect(areNodesEqual(oldNode, oldClone, true)).toBe(true)
        expect(areNodesEqual(newNode, newClone, true)).toBe(true)
    }
)
