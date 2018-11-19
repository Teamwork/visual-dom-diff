export type NodePredicate = (node: Node) => boolean
export type IndefiniteNodePredicate = (node: Node) => boolean | undefined

export function isElement(node: Node): node is HTMLElement {
    return node.nodeType === Node.ELEMENT_NODE
}

export function isText(node: Node): node is Text {
    return node.nodeType === Node.TEXT_NODE
}

const componentNames = new Set()
componentNames.add('IMG')
componentNames.add('VIDEO')
componentNames.add('IFRAME')
componentNames.add('OBJECT')
componentNames.add('SVG')

const formatNames = new Set()
formatNames.add('BDO')
formatNames.add('BDI')
formatNames.add('Q')
formatNames.add('CITE')
formatNames.add('CODE')
formatNames.add('DATA')
formatNames.add('TIME')
formatNames.add('VAR')
formatNames.add('DFN')
formatNames.add('ABBR')
formatNames.add('STRONG')
formatNames.add('EM')
formatNames.add('BIG')
formatNames.add('SMALL')
formatNames.add('MARK')
formatNames.add('SUB')
formatNames.add('SUP')
formatNames.add('SAMP')
formatNames.add('KBD')
formatNames.add('B')
formatNames.add('I')
formatNames.add('S')
formatNames.add('U')
formatNames.add('SPAN')

export function isComponent(node: Node): boolean {
    return componentNames.has(node.nodeName)
}

export function isFormat(node: Node): boolean {
    return formatNames.has(node.nodeName)
}

export function isIgnored(_node: Node): boolean {
    return false
}

export const createNodePredicate = (
    predicate: NodePredicate,
    override?: IndefiniteNodePredicate
) => (node: Node) => {
    const result = override && override(node)
    return typeof result === 'boolean' ? result : predicate(node)
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
 * Compares Text and Element nodes for equality. Returns false for all other node types.
 * @param node1 The first node to compare.
 * @param node2 The second node to compare.
 */
export function compareNodes(node1: Node, node2: Node): boolean {
    if (
        node1.nodeType !== node2.nodeType ||
        node1.nodeName !== node2.nodeName
    ) {
        return false
    }

    if (isText(node1) && isText(node2)) {
        if (node1.data !== node2.data) {
            return false
        }
    } else if (isElement(node1) && isElement(node2)) {
        const attributeNames1 = node1.getAttributeNames().sort()
        const attributeNames2 = node2.getAttributeNames().sort()

        if (!compareArrays(attributeNames1, attributeNames2)) {
            return false
        }

        for (let i = 0, l = attributeNames1.length; i < l; ++i) {
            const name = attributeNames1[i]
            const value1 = node1.getAttribute(name)
            const value2 = node2.getAttribute(name)

            if (value1 !== value2) {
                return false
            }
        }
    } else {
        return false
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
