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
        '',
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
        undefined,
    ],
    [
        'documents with identical content',
        new JSDOM('Hello').window.document,
        new JSDOM('Hello').window.document,
        '<html><head></head><body>Hello</body></html>',
        undefined,
    ],
    [
        'documents with different content',
        new JSDOM('Prefix Old Suffix').window.document,
        new JSDOM('Prefix New Suffix').window.document,
        '<html><head></head><body>Prefix <del class="vdd-removed">Old</del><ins class="vdd-added">New</ins> Suffix</body></html>',
        undefined,
    ],
    [
        'empty document fragments',
        document.createDocumentFragment(),
        document.createDocumentFragment(),
        '',
        undefined,
    ],
    [
        'empty identical DIVs',
        document.createElement('DIV'),
        document.createElement('DIV'),
        '<div></div>',
        undefined,
    ],
    [
        'empty text nodes',
        document.createTextNode(''),
        document.createTextNode(''),
        '',
        undefined,
    ],
    [
        'identical text nodes',
        document.createTextNode('test'),
        document.createTextNode('test'),
        'test',
        undefined,
    ],
    [
        'different text nodes',
        document.createTextNode('Prefix Old Suffix'),
        document.createTextNode('Prefix New Suffix'),
        'Prefix <del class="vdd-removed">Old</del><ins class="vdd-added">New</ins> Suffix',
        undefined,
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
        undefined,
    ],
    [
        'identical text in a DIV in a document fragment',
        htmlToFragment('<div>test</div>'),
        htmlToFragment('<div>test</div>'),
        '<div>test</div>',
        undefined,
    ],
    [
        'identical text in different text nodes',
        (() => {
            const fragment = document.createDocumentFragment()
            fragment.append(
                document.createTextNode('He'),
                document.createTextNode(''),
                document.createTextNode('llo'),
                document.createTextNode(' World'),
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
                document.createTextNode('ld'),
            )
            return fragment
        })(),
        'Hello World',
        undefined,
    ],
    [
        'identical images',
        document.createElement('IMG'),
        document.createElement('IMG'),
        '<img>',
        undefined,
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
        '<img src="image.png" class="vdd-removed"><img src="image.jpg" class="vdd-added">',
        undefined,
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
            `),
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
            `),
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
        undefined,
    ],
    [
        'same structure but different nodes',
        htmlToFragment('Prefix <ul><li>Test</li></ul> Suffix'),
        htmlToFragment('Prefix <ol><li>Test</li></ol> Suffix'),
        'Prefix <ul class="vdd-removed"><li>Test</li></ul><ol class="vdd-added"><li>Test</li></ol> Suffix',
        undefined,
    ],
    [
        'a character replaces a paragraph',
        (() => {
            const p = document.createElement('P')
            p.textContent = 'Test'
            return p
        })(),
        document.createTextNode(`${pChar}Test`),
        `<p class="vdd-removed">Test</p><ins class="vdd-added">${pChar}Test</ins>`,
        undefined,
    ],
    [
        'a paragraph replaces a character',
        document.createTextNode(`${pChar}Test`),
        (() => {
            const p = document.createElement('P')
            p.textContent = 'Test'
            return p
        })(),
        `<del class="vdd-removed">${pChar}Test</del><p class="vdd-added">Test</p>`,
        undefined,
    ],
    [
        'some text removed',
        htmlToFragment('Prefix Removed Suffix'),
        htmlToFragment('Prefix Suffix'),
        'Prefix <del class="vdd-removed">Removed </del>Suffix',
        undefined,
    ],
    [
        'some text added',
        htmlToFragment('Prefix Suffix'),
        htmlToFragment('Prefix Added Suffix'),
        'Prefix <ins class="vdd-added">Added </ins>Suffix',
        undefined,
    ],
    [
        'some text and a paragraph removed',
        htmlToFragment('Prefix Removed <p>Paragraph</p>Suffix'),
        htmlToFragment('Prefix Suffix'),
        'Prefix <del class="vdd-removed">Removed </del><p class="vdd-removed">Paragraph</p>Suffix',
        undefined,
    ],
    [
        'some text and a paragraph added',
        htmlToFragment('Prefix Suffix'),
        htmlToFragment('Prefix Added <p>Paragraph</p>Suffix'),
        'Prefix <ins class="vdd-added">Added </ins><p class="vdd-added">Paragraph</p>Suffix',
        undefined,
    ],
    [
        'some content unwrapped',
        htmlToFragment('Prefix <p>Paragraph</p> Suffix'),
        htmlToFragment('Prefix Paragraph Suffix'),
        'Prefix <p class="vdd-removed">Paragraph</p><ins class="vdd-added">Paragraph</ins> Suffix',
        undefined,
    ],
    [
        'some content wrapped',
        htmlToFragment('Prefix Paragraph Suffix'),
        htmlToFragment('Prefix <p>Paragraph</p> Suffix'),
        'Prefix <del class="vdd-removed">Paragraph</del><p class="vdd-added">Paragraph</p> Suffix',
        undefined,
    ],
    [
        'formatting removed',
        htmlToFragment('Prefix <strong>Strong</strong><em>Em</em> Suffix'),
        htmlToFragment('Prefix StrongEm Suffix'),
        'Prefix <ins class="vdd-modified">StrongEm</ins> Suffix',
        undefined,
    ],
    [
        'formatting added',
        htmlToFragment('Prefix StrongEm Suffix'),
        htmlToFragment('Prefix <strong>Strong</strong><em>Em</em> Suffix'),
        'Prefix <ins class="vdd-modified"><strong>Strong</strong><em>Em</em></ins> Suffix',
        undefined,
    ],
    [
        'formatting modified',
        htmlToFragment('Prefix <strong>formatted</strong> Suffix'),
        htmlToFragment('Prefix <em>formatted</em> Suffix'),
        'Prefix <ins class="vdd-modified"><em>formatted</em></ins> Suffix',
        undefined,
    ],
    [
        'nested formatting',
        htmlToFragment('Prefix <strong><em>formatted</em></strong> Suffix'),
        htmlToFragment('Prefix <strong><em>formatted</em></strong> Suffix'),
        'Prefix <strong><em>formatted</em></strong> Suffix',
        undefined,
    ],
    [
        '2 text nodes with modified formatting',
        htmlToFragment('Prefix <strong><code>formatted</code></strong> Suffix'),
        htmlToFragment(
            'Prefix <strong><span style="color:red;">form<!-- force 2 text nodes -->atted</span></strong> Suffix',
        ),
        'Prefix <ins class="vdd-modified"><strong><span style="color:red;">formatted</span></strong></ins> Suffix',
        undefined,
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
            `),
        ),
        htmlToFragment(
            trimLines(`
                <div>
                    <p>
                        <strong><em>Prefix after Suffix</em></strong>
                    </p>
                </div>
            `),
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
        undefined,
    ],
    [
        'formatting in differing content - the same text diff',
        htmlToFragment('<ul><li><strong><em>text</em></strong></li></ul>'),
        htmlToFragment('<ol><li><strong><code>text</code></strong></li></ol>'),
        '<ul class="vdd-removed"><li><strong><em>text</em></strong></li></ul>' +
            '<ol class="vdd-added"><li><strong><code>text</code></strong></li></ol>',
        undefined,
    ],
    [
        'formatting in differing content - different text diff',
        htmlToFragment('<ul><li><strong><em>before</em></strong></li></ul>'),
        htmlToFragment('<ol><li><strong><code>after</code></strong></li></ol>'),
        '<ul class="vdd-removed"><li><strong><em>before</em></strong></li></ul>' +
            '<ol class="vdd-added"><li><strong><code>after</code></strong></li></ol>',
        undefined,
    ],
    [
        'differing image src',
        htmlToFragment('<div><img src="image.png"></div>'),
        htmlToFragment('<div><img src="image.jpg"></div>'),
        '<div><img src="image.png" class="vdd-removed"><img src="image.jpg" class="vdd-added"></div>',
        undefined,
    ],
    [
        'differing paragraph attribute - the same text diff',
        htmlToFragment('<p data-value="old">test</p>'),
        htmlToFragment('<p data-value="new">test</p>'),
        '<p data-value="new" class="vdd-modified">test</p>',
        undefined,
    ],
    [
        'differing paragraph attribute - different text diff',
        htmlToFragment('<p data-value="old">test</p>'),
        htmlToFragment('<p data-value="new">hello</p>'),
        '<p data-value="new" class="vdd-modified"><del class="vdd-removed">test</del><ins class="vdd-added">hello</ins></p>',
        undefined,
    ],
    [
        'multiple spaces between words',
        htmlToFragment('prefix  suffix'),
        htmlToFragment('prefix   suffix'),
        'prefix  <ins class="vdd-added"> </ins>suffix',
        undefined,
    ],
    [
        'custom skipChildren option',
        htmlToFragment(
            '<p>This content is skipped</p><video><source></video><div><img>Hello</div>',
        ),
        htmlToFragment(
            '<p>Ignored too</p><video><source></video><div><img>Hello</div>',
        ),
        '<p></p><video><source></video><div><img>Hello</div>',
        {
            skipChildren(node: Node): boolean | undefined {
                return node.nodeName === 'VIDEO'
                    ? false
                    : node.nodeName === 'P'
                    ? true
                    : undefined
            },
        },
    ],
    [
        'custom skipSelf option',
        htmlToFragment(
            '<a><strong>p as formatting</strong></a> <strong>em as structure</strong>',
        ),
        htmlToFragment(
            '<p><a>p as formatting</a></p> <em>em as structure</em>',
        ),
        '<a><ins class="vdd-modified"><p>p as formatting</p></ins></a> ' +
            '<del class="vdd-removed"><strong>em as structure</strong></del><em class="vdd-added">em as structure</em>',
        {
            skipSelf(node: Node): boolean | undefined {
                return node.nodeName === 'EM'
                    ? false
                    : node.nodeName === 'P'
                    ? true
                    : undefined
            },
        },
    ],
    [
        'custom class names',
        htmlToFragment('<strong>Modified</strong> Removed'),
        htmlToFragment('Modified Added'),
        '<ins class="MODIFIED">Modified</ins> <del class="REMOVED">Remov</del><ins class="ADDED">Add</ins>ed',
        {
            addedClass: 'ADDED',
            modifiedClass: 'MODIFIED',
            removedClass: 'REMOVED',
        },
    ],
    [
        'change letter case',
        htmlToFragment('Lowercase Removed'),
        htmlToFragment('lowercase Added'),
        '<del class="vdd-removed">L</del><ins class="vdd-added">l</ins>owercase ' +
            '<del class="vdd-removed">Remov</del><ins class="vdd-added">Add</ins>ed',
        undefined,
    ],
    [
        'remove paragraph',
        htmlToFragment('<p>Removed</p><p>Common</p>'),
        htmlToFragment('<p>Common</p>'),
        '<p class="vdd-removed">Removed</p><p>Common</p>',
        undefined,
    ],
    [
        'add paragraph',
        htmlToFragment('<p>Common</p>'),
        htmlToFragment('<p>Added</p><p>Common</p>'),
        '<p class="vdd-added">Added</p><p>Common</p>',
        undefined,
    ],
    [
        'a table with a changed cell and text added after',
        htmlToFragment(
            `<p>This homepage is a bit unusual but I wouldn't worry about it. Nor would I tell the authorities, EVER!</p><table border="1" style="border-collapse:collapse;width:360px;"><tbody><tr><td style="width:253px;">scsac</td><td style="width:253px;">ascasc</td><td style="width:253px;">ascsac</td></tr><tr><td style="width:253px;">ascasc</td><td style="width:253px;">ascasc</td><td style="width:253px;">ascasc</td></tr><tr><td style="width:253px;"><br></td><td style="width:253px;">ascasc</td><td style="width:253px;"><br></td></tr></tbody></table><p><br></p>`,
        ),
        htmlToFragment(
            `<p>This homepage is a bit unusual but I wouldn't worry about it. Nor would I tell the authorities, EVER!</p><table border="1" style="border-collapse:collapse;width:360px;"><tbody><tr><td style="width:253px;">scsac</td><td style="width:253px;">ascasc</td><td style="width:253px;">ascsac</td></tr><tr><td style="width:253px;">ascasc</td><td style="width:253px;">ascasc</td><td style="width:253px;">ascasc</td></tr><tr><td style="width:253px;">wdqdqwd</td><td style="width:253px;">ascasc</td><td style="width:253px;"><br></td></tr></tbody></table><p>sacascascas</p><p>sacasc</p><p>ascasc</p><p><br></p>`,
        ),
        `<p>This homepage is a bit unusual but I wouldn't worry about it. Nor would I tell the authorities, EVER!</p><table border="1" style="border-collapse:collapse;width:360px;"><tbody><tr><td style="width:253px;">scsac</td><td style="width:253px;">ascasc</td><td style="width:253px;">ascsac</td></tr><tr><td style="width:253px;">ascasc</td><td style="width:253px;">ascasc</td><td style="width:253px;">ascasc</td></tr><tr><td style="width:253px;"><br class="vdd-removed"><ins class="vdd-added">wdqdqwd</ins></td><td style="width:253px;">ascasc</td><td style="width:253px;"><br></td></tr></tbody></table><p class="vdd-added">sacascascas</p><p class="vdd-added">sacasc</p><p class="vdd-added">ascasc</p><p><br></p>`,
        undefined,
    ],
    [
        'changes with skipModified === true',
        htmlToFragment(
            '<p>prefix <strong>modified</strong> old suffix removed</p><img src="image.png"><p data-value="old">test</p>',
        ),
        htmlToFragment(
            '<p>added prefix <em><u>modified</u></em> new suffix</p><img src="image.jpg"><p data-value="new">test</p>',
        ),
        '<p><ins class="vdd-added">added </ins>prefix <em><u>modified</u></em> <del class="vdd-removed">old</del><ins class="vdd-added">new</ins> suffix<del class="vdd-removed"> removed</del></p><img src="image.png" class="vdd-removed"><img src="image.jpg" class="vdd-added"><p data-value="new">test</p>',
        {
            skipModified: true,
        },
    ],
    [
        'changes with skipModified === false',
        htmlToFragment(
            '<p>prefix <strong>modified</strong> old suffix removed</p><img src="image.png"><p data-value="old">test</p>',
        ),
        htmlToFragment(
            '<p>added prefix <em><u>modified</u></em> new suffix</p><img src="image.jpg"><p data-value="new">test</p>',
        ),
        '<p><ins class="vdd-added">added </ins>prefix <ins class="vdd-modified"><em><u>modified</u></em></ins> <del class="vdd-removed">old</del><ins class="vdd-added">new</ins> suffix<del class="vdd-removed"> removed</del></p><img src="image.png" class="vdd-removed"><img src="image.jpg" class="vdd-added"><p data-value="new" class="vdd-modified">test</p>',
        {
            skipModified: false,
        },
    ],
    [
        'equal node marker preservation',
        htmlToFragment(
            '<table><thead><tr><th>wqdwqd</th><th>qwdwqd</th><th>wqdwqd</th></tr></thead><tbody><tr><td> qwdwqd</td><td> qwdwqd</td><td> </td></tr><tr><td> </td><td> replaced</td><td> aXAXa</td></tr><tr><td> added</td><td> </td><td> </td></tr><tr><td> </td><td> </td><td><strong>wqdwqdwd</strong></td></tr></tbody></table>',
        ),
        htmlToFragment(
            '<table><thead><tr><th>wqdwqd</th><th>qwdwqd</th><th>wqdwqd</th></tr></thead><tbody><tr><td> qwdwqd</td><td> qwdwqd</td><td><br></td></tr><tr><td><br></td><td> replaced</td><td> aXAXa</td></tr><tr><td> added</td><td><br></td><td><br></td></tr><tr><td><br></td><td><br></td><td><strong>wqdwqdwd</strong></td></tr></tbody></table>',
        ),
        '<table><thead><tr><th>wqdwqd</th><th>qwdwqd</th><th>wqdwqd</th></tr></thead><tbody><tr><td> qwdwqd</td><td> qwdwqd</td><td><del class="vdd-removed"> </del><br class="vdd-added"></td></tr><tr><td><del class="vdd-removed"> </del><br class="vdd-added"></td><td> replaced</td><td> aXAXa</td></tr><tr><td> added</td><td><del class="vdd-removed"> </del><br class="vdd-added"></td><td><del class="vdd-removed"> </del><br class="vdd-added"></td></tr><tr><td><del class="vdd-removed"> </del><br class="vdd-added"></td><td><del class="vdd-removed"> </del><br class="vdd-added"></td><td><strong>wqdwqdwd</strong></td></tr></tbody></table>',
        undefined,
    ],
    [
        'add a paragraph between other paragraphs',
        htmlToFragment('<p>123</p><p>789</p>'),
        htmlToFragment('<p>123</p><p>456</p><p>789</p>'),
        '<p>123</p><p class="vdd-added">456</p><p>789</p>',
        undefined,
    ],
    [
        'remove a paragraph between other paragraphs',
        htmlToFragment('<p>123</p><p>456</p><p>789</p>'),
        htmlToFragment('<p>123</p><p>789</p>'),
        '<p>123</p><p class="vdd-removed">456</p><p>789</p>',
        undefined,
    ],
    [
        'table - add TD',
        htmlToFragment(
            '<table><tbody><tr><td>one</td><td>two</td></tr></tbody></table>',
        ),
        htmlToFragment(
            '<table><tbody><tr><td>one</td><td>two</td><td>three</td></tr></tbody></table>',
        ),
        '<table><tbody><tr><td>one</td><td>two</td><td class="vdd-added">three</td></tr></tbody></table>',
        undefined,
    ],
    [
        'table - remove TD',
        htmlToFragment(
            '<table><tbody><tr><td>one</td><td>two</td><td>three</td></tr></tbody></table>',
        ),
        htmlToFragment(
            '<table><tbody><tr><td>one</td><td>two</td></tr></tbody></table>',
        ),
        '<table><tbody><tr><td>one</td><td>two</td><td class="vdd-removed">three</td></tr></tbody></table>',
        undefined,
    ],
    [
        'table - add TH',
        htmlToFragment(
            '<table><tbody><tr><td>one</td><td>two</td></tr></tbody></table>',
        ),
        htmlToFragment(
            '<table><tbody><tr><td>one</td><td>two</td><th>three</th></tr></tbody></table>',
        ),
        '<table><tbody><tr><td>one</td><td>two</td><th class="vdd-added">three</th></tr></tbody></table>',
        undefined,
    ],
    [
        'table - remove TH',
        htmlToFragment(
            '<table><tbody><tr><td>one</td><td>two</td><th>three</th></tr></tbody></table>',
        ),
        htmlToFragment(
            '<table><tbody><tr><td>one</td><td>two</td></tr></tbody></table>',
        ),
        '<table><tbody><tr><td>one</td><td>two</td><th class="vdd-removed">three</th></tr></tbody></table>',
        undefined,
    ],
    [
        'table - replace TD with TH',
        htmlToFragment(
            '<table><tbody><tr><td>one</td><td>two</td><td>three</td></tr></tbody></table>',
        ),
        htmlToFragment(
            '<table><tbody><tr><th>one</th><td>two</td><td>three</td></tr></tbody></table>',
        ),
        '<table><tbody><tr><th class="vdd-modified">one</th><td>two</td><td>three</td></tr></tbody></table>',
        undefined,
    ],
    [
        'table - replace TH with TD',
        htmlToFragment(
            '<table><tbody><tr><th>one</th><td>two</td><td>three</td></tr></tbody></table>',
        ),
        htmlToFragment(
            '<table><tbody><tr><td>one</td><td>two</td><td>three</td></tr></tbody></table>',
        ),
        '<table><tbody><tr><td class="vdd-modified">one</td><td>two</td><td>three</td></tr></tbody></table>',
        undefined,
    ],
    [
        'table - move values between TDs',
        htmlToFragment(
            '<table><tbody><tr><td>one</td><td>two</td></tr></tbody></table>',
        ),
        htmlToFragment(
            '<table><tbody><tr><td>two</td><td>one</td></tr></tbody></table>',
        ),
        '<table><tbody><tr><td><del class="vdd-removed">one</del><ins class="vdd-added">two</ins></td><td><del class="vdd-removed">two</del><ins class="vdd-added">one</ins></td></tr></tbody></table>',
        undefined,
    ],
    [
        'table - move values between THs',
        htmlToFragment(
            '<table><tbody><tr><th>one</th><th>two</th></tr></tbody></table>',
        ),
        htmlToFragment(
            '<table><tbody><tr><th>two</th><th>one</th></tr></tbody></table>',
        ),
        '<table><tbody><tr><th><del class="vdd-removed">one</del><ins class="vdd-added">two</ins></th><th><del class="vdd-removed">two</del><ins class="vdd-added">one</ins></th></tr></tbody></table>',
        undefined,
    ],
    [
        'table - move values between a TD and TH',
        htmlToFragment(
            '<table><tbody><tr><th>one</th><td>two</td></tr></tbody></table>',
        ),
        htmlToFragment(
            '<table><tbody><tr><th>two</th><td>one</td></tr></tbody></table>',
        ),
        '<table><tbody><tr><th><del class="vdd-removed">one</del><ins class="vdd-added">two</ins></th><td><del class="vdd-removed">two</del><ins class="vdd-added">one</ins></td></tr></tbody></table>',
        undefined,
    ],
    [
        'table - swap a TD with a TH',
        htmlToFragment(
            '<table><tbody><tr><th>one</th><td>two</td></tr></tbody></table>',
        ),
        htmlToFragment(
            '<table><tbody><tr><td>two</td><th>one</th></tr></tbody></table>',
        ),
        '<table><tbody><tr><td class="vdd-modified"><del class="vdd-removed">one</del><ins class="vdd-added">two</ins></td><th class="vdd-modified"><del class="vdd-removed">two</del><ins class="vdd-added">one</ins></th></tr></tbody></table>',
        undefined,
    ],
    [
        'table - move values and add TDs',
        htmlToFragment(
            '<table><tbody><tr><td>one</td><td>two</td><td>three</td></tr></tbody></table>',
        ),
        htmlToFragment(
            '<table><tbody><tr><td>two</td><td>one</td><td>three</td><td>four</td><td>five</td></tr></tbody></table>',
        ),
        '<table><tbody><tr><td><del class="vdd-removed">one</del><ins class="vdd-added">two</ins></td><td><del class="vdd-removed">two</del><ins class="vdd-added">one</ins></td><td>three</td><td class="vdd-added">four</td><td class="vdd-added">five</td></tr></tbody></table>',
        undefined,
    ],
    [
        'table - move values and remove TDs',
        htmlToFragment(
            '<table><tbody><tr><td>one</td><td>two</td><td>three</td><td>four</td><td>five</td></tr></tbody></table>',
        ),
        htmlToFragment(
            '<table><tbody><tr><td>two</td><td>one</td><td>three</td></tr></tbody></table>',
        ),
        '<table><tbody><tr><td><del class="vdd-removed">one</del><ins class="vdd-added">two</ins></td><td><del class="vdd-removed">two</del><ins class="vdd-added">one</ins></td><td>three</td><td class="vdd-removed">four</td><td class="vdd-removed">five</td></tr></tbody></table>',
        undefined,
    ],
    [
        'table - move values with formatting',
        htmlToFragment(
            '<table><tbody><tr><td><strong>one</strong></td><td><strong>two</strong></td><td><strong>three</strong></td></tr></tbody></table>',
        ),
        htmlToFragment(
            '<table><tbody><tr><td><i>two</i></td><td><i>one</i></td><td><i>three</i></td></tr></tbody></table>',
        ),
        '<table><tbody><tr><td><del class="vdd-removed"><strong>one</strong></del><ins class="vdd-added"><i>two</i></ins></td><td><del class="vdd-removed"><strong>two</strong></del><ins class="vdd-added"><i>one</i></ins></td><td><ins class="vdd-modified"><i>three</i></ins></td></tr></tbody></table>',
        undefined,
    ],
])(
    '%s',
    (
        _message: string,
        oldNode: Node,
        newNode: Node,
        expectedHtml: string,
        options?: Options,
    ) => {
        const oldClone = oldNode.cloneNode(true)
        const newClone = newNode.cloneNode(true)
        const fragment = visualDomDiff(oldNode, newNode, options)
        expect(fragment.nodeName).toBe('#document-fragment')
        expect(fragmentToHtml(fragment)).toBe(expectedHtml)
        expect(areNodesEqual(oldNode, oldClone, true)).toBe(true)
        expect(areNodesEqual(newNode, newClone, true)).toBe(true)
    },
)
