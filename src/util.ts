import { Change, diffWordsWithSpace, WordsOptions } from 'diff'

export type NodePredicate = (node: Node) => boolean
export type IndefiniteNodePredicate = (node: Node) => boolean | undefined

export function isElement(node: Node): node is HTMLElement {
    return node.nodeType === Node.ELEMENT_NODE
}

export function isText(node: Node): node is Text {
    return node.nodeType === Node.TEXT_NODE
}

export function isDocument(node: Node): node is Document {
    return node.nodeType === Node.DOCUMENT_NODE
}

export function isDocumentFragment(node: Node): node is DocumentFragment {
    return node.nodeType === Node.DOCUMENT_FRAGMENT_NODE
}

export function isComment(node: Node): node is Comment {
    return node.nodeType === Node.COMMENT_NODE
}

export type Comparator<T> = (item1: T, item2: T) => boolean

export function strictEqual<T>(item1: T, item2: T): boolean {
    return item1 === item2
}

export function areArraysEqual<T>(
    array1: T[],
    array2: T[],
    comparator: Comparator<T> = strictEqual
): boolean {
    if (array1.length !== array2.length) {
        return false
    }

    for (let i = 0, l = array1.length; i < l; ++i) {
        if (!comparator(array1[i], array2[i])) {
            return false
        }
    }

    return true
}

/**
 * Compares DOM nodes for equality.
 * @param node1 The first node to compare.
 * @param node2 The second node to compare.
 * @param deep If true, the child nodes are compared recursively too.
 * @returns `true`, if the 2 nodes are equal, otherwise `false`.
 */
export function areNodesEqual(
    node1: Node,
    node2: Node,
    deep: boolean = false
): boolean {
    if (node1 === node2) {
        return true
    }

    if (
        node1.nodeType !== node2.nodeType ||
        node1.nodeName !== node2.nodeName
    ) {
        return false
    }

    if (isText(node1) || isComment(node1)) {
        if (node1.data !== (node2 as typeof node1).data) {
            return false
        }
    } else if (isElement(node1)) {
        const attributeNames1 = node1.getAttributeNames().sort()
        const attributeNames2 = (node2 as typeof node1)
            .getAttributeNames()
            .sort()

        if (!areArraysEqual(attributeNames1, attributeNames2)) {
            return false
        }

        for (let i = 0, l = attributeNames1.length; i < l; ++i) {
            const name = attributeNames1[i]
            const value1 = node1.getAttribute(name)
            const value2 = (node2 as typeof node1).getAttribute(name)

            if (value1 !== value2) {
                return false
            }
        }
    }

    if (deep) {
        const childNodes1 = node1.childNodes
        const childNodes2 = node2.childNodes

        if (childNodes1.length !== childNodes2.length) {
            return false
        }

        for (let i = 0, l = childNodes1.length; i < l; ++i) {
            if (!areNodesEqual(childNodes1[i], childNodes2[i], deep)) {
                return false
            }
        }
    }

    return true
}

/**
 * Gets a list of `node`'s ancestor nodes up until and including `rootNode`.
 * @param node Node whose ancestors to get.
 * @param rootNode The root node.
 */
export function getAncestors(node: Node, rootNode: Node | null = null): Node[] {
    if (!node || node === rootNode) {
        return []
    }

    const ancestors = []
    let currentNode: Node | null = node.parentNode

    while (currentNode) {
        ancestors.push(currentNode)
        if (currentNode === rootNode) {
            break
        }
        currentNode = currentNode.parentNode
    }

    return ancestors
}

export function never(
    message: string = 'visual-dom-diff: Should never happen'
): never {
    throw new Error(message)
}

function endsWithNull(text: string): boolean {
    return text.length > 0 && text[text.length - 1] === '\0'
}

/**
 * Delegates the call to `diff.diffWordsWithSpace` and fixes the result, so that trailing `\0` characters
 * in the "added" and "removed" diff result items are moved to the front, if possible, which is necessary
 * to improve the quality of the DOM diffs.
 * Additionally, the "count" properties are set to undefined and empty diff items are removed.
 */
export function diffText(
    text1: string,
    text2: string,
    options?: WordsOptions
): Change[] {
    const results = diffWordsWithSpace(text1, text2, options)

    for (let i = 0, l = results.length - 2; i < l; ++i) {
        const result0 = results[i]
        const result1 = results[i + 1]
        const result2 = results[i + 2]

        if (
            !(result0.added || result0.removed) &&
            (result1.added || result1.removed) &&
            !(result2.added || result2.removed)
        ) {
            while (endsWithNull(result0.value) && endsWithNull(result1.value)) {
                result0.value = result0.value.substring(
                    0,
                    result0.value.length - 1
                )
                result1.value =
                    '\0' + result1.value.substring(0, result1.value.length - 1)
                result2.value = '\0' + result2.value
            }
        }
    }

    return results.filter(result => {
        result.count = undefined
        result.added = !!result.added
        result.removed = !!result.removed
        return result.value.length > 0
    })
}
