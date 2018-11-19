import { DomIterator } from './domIterator'

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
    expect([...new DomIterator(text)]).toStrictEqual([text])
})

test('iterate many nodes', () => {
    expect([...new DomIterator(fragment)]).toStrictEqual([
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
        img3
    ])
})

test('skip certain nodes', () => {
    expect([
        ...new DomIterator(fragment, {
            skip: node => node.nodeName === 'TR'
        })
    ]).toStrictEqual([fragment, table, img1, img2, img3])
})

test('skip child nodes of certain nodes', () => {
    expect([
        ...new DomIterator(fragment, {
            skipChildNodes: node => node.nodeName === 'TR'
        })
    ]).toStrictEqual([fragment, table, tr1, tr2, img1, img2, img3])
})

test('skip the root node', () => {
    expect([
        ...new DomIterator(fragment, {
            skip: node => node === fragment
        })
    ]).toStrictEqual([])
})

test('skip child nodes of the root node', () => {
    expect([
        ...new DomIterator(fragment, {
            skipChildNodes: node => node === fragment
        })
    ]).toStrictEqual([fragment])
})

test('stay within root', () => {
    expect([...new DomIterator(tr1)]).toStrictEqual([
        tr1,
        td1a,
        text1a,
        td1b,
        text1b
    ])
})
