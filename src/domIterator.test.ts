import { JSDOM } from 'jsdom'
import { DomIterator } from './domIterator'

const document = new JSDOM('').window.document
const text = document.createTextNode('text')
const fragment = document.createDocumentFragment()
const table = document.createElement('TABLE')
const tr1 = document.createElement('TR')
const tr2 = document.createElement('TR')
const td1a = document.createElement('TD')
const td1b = document.createElement('TD')
const td2a = document.createElement('TD')
const td2b = document.createElement('TD')
const text1a = document.createTextNode('text1a')
const text1b = document.createTextNode('text1b')
const text2a = document.createTextNode('text2a')
const text2b = document.createTextNode('text2b')
const img1 = document.createElement('IMG')
const img2 = document.createElement('IMG')
const img3 = document.createElement('IMG')
fragment.append(table, img1, img2, img3)
table.append(tr1, tr2)
tr1.append(td1a, td1b)
tr2.append(td2a, td2b)
td1a.append(text1a)
td1b.append(text1b)
td2a.append(text2a)
td2b.append(text2b)

test('iterate one text node', () => {
    expect(new DomIterator(text).toArray()).toStrictEqual([text])
})

test('iterate many nodes', () => {
    expect(new DomIterator(fragment).toArray()).toStrictEqual([
        fragment,
        table,
        tr1,
        td1a,
        text1a,
        td1b,
        text1b,
        tr2,
        td2a,
        text2a,
        td2b,
        text2b,
        img1,
        img2,
        img3,
    ])
})

test('skip some nodes', () => {
    expect(
        new DomIterator(fragment, {
            skipSelf: node => node.nodeName === 'TR',
        }).toArray(),
    ).toStrictEqual([
        fragment,
        table,
        td1a,
        text1a,
        td1b,
        text1b,
        td2a,
        text2a,
        td2b,
        text2b,
        img1,
        img2,
        img3,
    ])
})

test('skip children of some nodes', () => {
    expect(
        new DomIterator(fragment, {
            skipChildren: node => node.nodeName === 'TR',
        }).toArray(),
    ).toStrictEqual([fragment, table, tr1, tr2, img1, img2, img3])
})

test('skip some nodes and their children', () => {
    expect(
        new DomIterator(fragment, {
            skipChildren: node => node.nodeName === 'TR',
            skipSelf: node => node.nodeName === 'TR',
        }).toArray(),
    ).toStrictEqual([fragment, table, img1, img2, img3])
})

test('skip the root node', () => {
    expect(
        new DomIterator(fragment, {
            skipSelf: node => node === fragment,
        }).toArray(),
    ).toStrictEqual([
        table,
        tr1,
        td1a,
        text1a,
        td1b,
        text1b,
        tr2,
        td2a,
        text2a,
        td2b,
        text2b,
        img1,
        img2,
        img3,
    ])
})

test('skip the children of the root node', () => {
    expect(
        new DomIterator(fragment, {
            skipChildren: node => node === fragment,
        }).toArray(),
    ).toStrictEqual([fragment])
})

test('skip the root node and its children', () => {
    expect(
        new DomIterator(fragment, {
            skipChildren: node => node === fragment,
            skipSelf: node => node === fragment,
        }).toArray(),
    ).toStrictEqual([])
})

test('stay within root', () => {
    expect(new DomIterator(tr1).toArray()).toStrictEqual([
        tr1,
        td1a,
        text1a,
        td1b,
        text1b,
    ])
})

describe('forEach', () => {
    test('all', () => {
        const fn = jest.fn()
        const iterator = new DomIterator(tr1)
        iterator.forEach(fn)
        expect(fn).toHaveBeenCalledTimes(5)
        expect(fn).toHaveBeenNthCalledWith(1, tr1)
        expect(fn).toHaveBeenNthCalledWith(2, td1a)
        expect(fn).toHaveBeenNthCalledWith(3, text1a)
        expect(fn).toHaveBeenNthCalledWith(4, td1b)
        expect(fn).toHaveBeenNthCalledWith(5, text1b)
    })
    test('skip one', () => {
        const fn = jest.fn()
        const iterator = new DomIterator(tr1)
        iterator.next()
        iterator.forEach(fn)
        expect(fn).toHaveBeenCalledTimes(4)
        expect(fn).toHaveBeenNthCalledWith(1, td1a)
        expect(fn).toHaveBeenNthCalledWith(2, text1a)
        expect(fn).toHaveBeenNthCalledWith(3, td1b)
        expect(fn).toHaveBeenNthCalledWith(4, text1b)
    })
    test('skip one', () => {
        const fn = jest.fn()
        const iterator = new DomIterator(tr1)
        iterator.next()
        iterator.next()
        iterator.next()
        iterator.next()
        iterator.next()
        iterator.forEach(fn)
        expect(fn).toHaveBeenCalledTimes(0)
    })
})

describe('some', () => {
    test('false - some nodes', () => {
        const fn = jest.fn(() => false)
        const iterator = new DomIterator(tr1)
        expect(iterator.some(fn)).toBe(false)
        expect(fn).toHaveBeenCalledTimes(5)
        expect(fn).toHaveBeenNthCalledWith(1, tr1)
        expect(fn).toHaveBeenNthCalledWith(2, td1a)
        expect(fn).toHaveBeenNthCalledWith(3, text1a)
        expect(fn).toHaveBeenNthCalledWith(4, td1b)
        expect(fn).toHaveBeenNthCalledWith(5, text1b)
    })
    test('false - no nodes', () => {
        const fn = jest.fn(() => false)
        const iterator = new DomIterator(tr1)
        iterator.next()
        iterator.next()
        iterator.next()
        iterator.next()
        iterator.next()
        expect(iterator.some(fn)).toBe(false)
        expect(fn).toHaveBeenCalledTimes(0)
    })
    test('true - first node', () => {
        let i = 0
        const fn = jest.fn(() => i++ === 0)
        const iterator = new DomIterator(tr1)
        expect(iterator.some(fn)).toBe(true)
        expect(fn).toHaveBeenCalledTimes(1)
        expect(fn).toHaveBeenNthCalledWith(1, tr1)
    })
    test('true - middle node', () => {
        let i = 0
        const fn = jest.fn(() => i++ === 2)
        const iterator = new DomIterator(tr1)
        expect(iterator.some(fn)).toBe(true)
        expect(fn).toHaveBeenCalledTimes(3)
        expect(fn).toHaveBeenNthCalledWith(1, tr1)
        expect(fn).toHaveBeenNthCalledWith(2, td1a)
        expect(fn).toHaveBeenNthCalledWith(3, text1a)
    })
    test('true - last node', () => {
        let i = 0
        const fn = jest.fn(() => i++ === 4)
        const iterator = new DomIterator(tr1)
        expect(iterator.some(fn)).toBe(true)
        expect(fn).toHaveBeenCalledTimes(5)
        expect(fn).toHaveBeenNthCalledWith(1, tr1)
        expect(fn).toHaveBeenNthCalledWith(2, td1a)
        expect(fn).toHaveBeenNthCalledWith(3, text1a)
        expect(fn).toHaveBeenNthCalledWith(4, td1b)
        expect(fn).toHaveBeenNthCalledWith(5, text1b)
    })
})

describe('reduce', () => {
    test('all', () => {
        const fn = jest.fn((result, current) => (current ? result + 2 : 0))
        const iterator = new DomIterator(tr1)
        expect(iterator.reduce(fn, 5)).toBe(15)
        expect(fn).toHaveBeenCalledTimes(5)
        expect(fn).toHaveBeenNthCalledWith(1, 5, tr1)
        expect(fn).toHaveBeenNthCalledWith(2, 7, td1a)
        expect(fn).toHaveBeenNthCalledWith(3, 9, text1a)
        expect(fn).toHaveBeenNthCalledWith(4, 11, td1b)
        expect(fn).toHaveBeenNthCalledWith(5, 13, text1b)
    })
    test('skip one', () => {
        const fn = jest.fn((result, current) => (current ? result + 2 : 0))
        const iterator = new DomIterator(tr1)
        iterator.next()
        expect(iterator.reduce(fn, 5)).toBe(13)
        expect(fn).toHaveBeenCalledTimes(4)
        expect(fn).toHaveBeenNthCalledWith(1, 5, td1a)
        expect(fn).toHaveBeenNthCalledWith(2, 7, text1a)
        expect(fn).toHaveBeenNthCalledWith(3, 9, td1b)
        expect(fn).toHaveBeenNthCalledWith(4, 11, text1b)
    })
    test('skip all', () => {
        const fn = jest.fn((result, current) => (current ? result + 2 : 0))
        const iterator = new DomIterator(tr1)
        iterator.next()
        iterator.next()
        iterator.next()
        iterator.next()
        iterator.next()
        expect(iterator.reduce(fn, 5)).toBe(5)
        expect(fn).toHaveBeenCalledTimes(0)
    })
})
