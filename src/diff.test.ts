import { Options, visualDomDiff } from './diff'
import { isElement, isText } from './util'

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

function diffHtml(oldHtml: string, newHtml: string, options?: Options): string {
    const oldNode = htmlToFragment(oldHtml)
    const newNode = htmlToFragment(newHtml)
    const fragment = visualDomDiff(oldNode, newNode, options)
    return fragmentToHtml(fragment)
}

test('empty document fragments', () => {
    const oldNode = document.createDocumentFragment()
    const newNode = document.createDocumentFragment()
    const result = visualDomDiff(oldNode, newNode)
    expect(result).toBeInstanceOf(DocumentFragment)
    expect(fragmentToHtml(result)).toBe('')
})

// test('empty identical DIVs', () => {
//     const oldNode = document.createElement('DIV')
//     const newNode = document.createElement('DIV')
//     const result = visualDomDiff(oldNode, newNode)
//     expect(result).toBeInstanceOf(DocumentFragment)
//     expect(fragmentToHtml(result)).toBe('')
// })

test('empty text nodes', () => {
    const oldNode = document.createTextNode('')
    const newNode = document.createTextNode('')
    const result = visualDomDiff(oldNode, newNode)
    expect(result).toBeInstanceOf(DocumentFragment)
    expect(fragmentToHtml(result)).toBe('')
})

test('identical text nodes', () => {
    expect(diffHtml('test', 'test')).toBe('test')
})

test('identical text in different text nodes', () => {
    const text1 = [
        document.createTextNode('He'),
        document.createTextNode(''),
        document.createTextNode('llo'),
        document.createTextNode(' World')
    ]
    const text2 = [
        document.createTextNode('H'),
        document.createTextNode('ello W'),
        document.createTextNode('or'),
        document.createTextNode(''),
        document.createTextNode('ld')
    ]
    const fragment1 = document.createDocumentFragment()
    const fragment2 = document.createDocumentFragment()
    fragment1.append(...text1)
    fragment2.append(...text2)
    expect(fragment1.childNodes.length).toBe(text1.length)
    expect(fragment2.childNodes.length).toBe(text2.length)
    expect(fragmentToHtml(visualDomDiff(fragment1, fragment2))).toBe(
        'Hello World'
    )
})
