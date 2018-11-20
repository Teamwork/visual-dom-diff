export type NodePredicate = (node: Node) => boolean
export type IndefiniteNodePredicate = (node: Node) => boolean | undefined

export function isElement(node: Node): node is HTMLElement {
    return node.nodeType === Node.ELEMENT_NODE
}

export function isText(node: Node): node is Text {
    return node.nodeType === Node.TEXT_NODE
}

export function isDocumentFragment(node: Node): node is DocumentFragment {
    return node.nodeType === Node.DOCUMENT_FRAGMENT_NODE
}

export function isComment(node: Node): node is Comment {
    return node.nodeType === Node.COMMENT_NODE
}

export function compareArrays<T>(array1: T[], array2: T[]): boolean {
    if (array1.length !== array2.length) {
        return false
    }

    for (let i = 0, l = array1.length; i < l; ++i) {
        if (array1[i] !== array2[i]) {
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
 */
export function compareNodes(
    node1: Node,
    node2: Node,
    deep: boolean = false
): boolean {
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

        if (!compareArrays(attributeNames1, attributeNames2)) {
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
            if (!compareNodes(childNodes1[i], childNodes2[i], deep)) {
                return false
            }
        }
    }

    return true
}

/**
 * Returns the number of ancestors of `node`.
 * @param node The node whose ancestors should be counted.
 * @param root The optional root node.
 */
export function getAncestorCount(node: Node, root: Node | null = null) {
    let ancestorCount = 0
    let currentNode: Node = node

    while (currentNode.parentNode && currentNode !== root) {
        currentNode = currentNode.parentNode
        ancestorCount++
    }

    return ancestorCount
}

export function never(
    message: string = 'visual-dom-diff: Should never happen'
): never {
    throw new Error(message)
}
