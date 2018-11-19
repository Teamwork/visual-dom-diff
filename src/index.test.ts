import * as diff from './diff'
import * as index from './index'

test('exports visualDomDiff', () => {
    expect(index.visualDomDiff).toBe(diff.visualDomDiff)
})
