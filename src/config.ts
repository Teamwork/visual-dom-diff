import { DomIteratorOptions } from './domIterator'
import {
    IndefiniteNodePredicate,
    isDocumentFragment,
    isElement,
    isText,
    NodePredicate
} from './util'

export interface Options {
    skipSelfAndChildren?: IndefiniteNodePredicate
    skipChildren?: IndefiniteNodePredicate
    isFormat?: IndefiniteNodePredicate
}

export interface Config extends Options, DomIteratorOptions {
    readonly skipSelfAndChildren: NodePredicate
    readonly skipChildren: NodePredicate
    readonly isFormat: NodePredicate
}

const skipChildrenMap = new Set()
skipChildrenMap.add('IMG')
skipChildrenMap.add('VIDEO')
skipChildrenMap.add('IFRAME')
skipChildrenMap.add('OBJECT')
skipChildrenMap.add('SVG')

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

export function optionsToConfig({
    isFormat,
    skipChildren,
    skipSelfAndChildren
}: Options = {}): Config {
    return {
        isFormat(node: Node): boolean {
            if (isFormat) {
                const result = isFormat(node)
                if (typeof result === 'boolean') {
                    return result
                }
            }
            return formatNames.has(node.nodeName)
        },
        skipChildren(node: Node): boolean {
            if (skipChildren) {
                const result = skipChildren(node)
                if (typeof result === 'boolean') {
                    return result
                }
            }
            return skipChildrenMap.has(node.nodeName)
        },
        skipSelfAndChildren(node: Node): boolean {
            if (
                !isText(node) &&
                !isElement(node) &&
                !isDocumentFragment(node)
            ) {
                return true
            }
            return (skipSelfAndChildren && skipSelfAndChildren(node)) || false
        }
    }
}
