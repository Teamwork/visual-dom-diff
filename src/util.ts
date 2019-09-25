import { Diff, DIFF_EQUAL, diff_match_patch } from 'diff-match-patch'

export type NodePredicate = (node: Node) => boolean
export type IndefiniteNodePredicate = (node: Node) => boolean | undefined

export function isElement(node: Node): node is HTMLElement {
    return node.nodeType === node.ELEMENT_NODE
}

export function isText(node: Node): node is Text {
    return node.nodeType === node.TEXT_NODE
}

export function isDocument(node: Node): node is Document {
    return node.nodeType === node.DOCUMENT_NODE
}

export function isDocumentFragment(node: Node): node is DocumentFragment {
    return node.nodeType === node.DOCUMENT_FRAGMENT_NODE
}

export function isComment(node: Node): node is Comment {
    return node.nodeType === node.COMMENT_NODE
}

export type Comparator<T> = (item1: T, item2: T) => boolean

export function strictEqual<T>(item1: T, item2: T): boolean {
    return item1 === item2
}

export function areArraysEqual<T>(
    array1: T[],
    array2: T[],
    comparator: Comparator<T> = strictEqual,
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
    deep: boolean = false,
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
    message: string = 'visual-dom-diff: Should never happen',
): never {
    throw new Error(message)
}

// Source: https://stackoverflow.com/a/7616484/706807 (simplified)
export function hashCode(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
        // tslint:disable-next-line:no-bitwise
        hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0
    }
    return hash
}

/**
 * Returns a single character which should replace the given node name
 * when serializing a non-text node.
 */
export function charForNodeName(nodeName: string): string {
    return String.fromCharCode(
        0xe000 + (hashCode(nodeName) % (0xf900 - 0xe000)),
    )
}

/**
 * Moves trailing HTML tag markers in the DIFF_INSERT and DIFF_DELETE diff items to the front,
 * if possible, in order to improve quality of the DOM diff.
 */
export function cleanUpNodeMarkers(diff: Diff[]): void {
    for (let i = 0; i < diff.length - 2; ) {
        const diff0 = diff[i]
        const diff1 = diff[i + 1]
        const diff2 = diff[i + 2]

        if (
            diff0[0] !== DIFF_EQUAL ||
            diff1[0] === DIFF_EQUAL ||
            diff2[0] !== DIFF_EQUAL
        ) {
            i++
            continue
        }

        const string0 = diff0[1]
        const string1 = diff1[1]
        const string2 = diff2[1]
        const lastChar0 = string0[string0.length - 1]
        const lastChar1 = string1[string1.length - 1]

        if (
            lastChar0 !== lastChar1 ||
            lastChar0 < '\uE000' ||
            lastChar0 >= '\uF900'
        ) {
            i++
            continue
        }

        diff0[1] = string0.substring(0, string0.length - 1)
        diff1[1] = lastChar0 + string1.substring(0, string1.length - 1)
        diff2[1] = lastChar0 + string2

        if (diff0[1].length === 0) {
            diff.splice(i, 1)
        }
    }
}

const dmp = new diff_match_patch()

/**
 * Diffs the 2 strings and cleans up the result before returning it.
 */
export function diffText(text1: string, text2: string): Diff[] {
    const diff = dmp.diff_main(text1, text2)
    const result: Diff[] = []
    const temp: Diff[] = []

    cleanUpNodeMarkers(diff)

    // Execute `dmp.diff_cleanupSemantic` excluding equal node markers.
    for (let i = 0, l = diff.length; i < l; ++i) {
        const item = diff[i]

        if (item[0] === DIFF_EQUAL) {
            const text = item[1]
            const totalLength = text.length
            const prefixLength = /^[^\uE000-\uF8FF]*/.exec(text)![0].length

            if (prefixLength < totalLength) {
                const suffixLength = /[^\uE000-\uF8FF]*$/.exec(text)![0].length

                if (prefixLength > 0) {
                    temp.push([DIFF_EQUAL, text.substring(0, prefixLength)])
                }

                dmp.diff_cleanupSemantic(temp)
                pushAll(result, temp)
                temp.length = 0

                result.push([
                    DIFF_EQUAL,
                    text.substring(prefixLength, totalLength - suffixLength),
                ])

                if (suffixLength > 0) {
                    temp.push([
                        DIFF_EQUAL,
                        text.substring(totalLength - suffixLength),
                    ])
                }
            } else {
                temp.push(item)
            }
        } else {
            temp.push(item)
        }
    }

    dmp.diff_cleanupSemantic(temp)
    pushAll(result, temp)
    temp.length = 0

    dmp.diff_cleanupMerge(result)
    cleanUpNodeMarkers(result)
    return result
}

function pushAll<T>(array: T[], items: T[]): void {
    let destination = array.length
    let source = 0
    const length = items.length

    while (source < length) {
        array[destination++] = items[source++]
    }
}

export function markUpNode(
    node: Node,
    elementName: string,
    className: string,
): void {
    const document = node.ownerDocument!
    const parentNode = node.parentNode!
    const previousSibling = node.previousSibling

    if (isElement(node)) {
        node.classList.add(className)
    } else if (
        previousSibling &&
        previousSibling.nodeName === elementName &&
        (previousSibling as Element).classList.contains(className)
    ) {
        previousSibling.appendChild(node)
    } else {
        const wrapper = document.createElement(elementName)
        wrapper.classList.add(className)
        parentNode.insertBefore(wrapper, node)
        wrapper.appendChild(node)
    }
}
