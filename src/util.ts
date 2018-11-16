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
