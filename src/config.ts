import { DomIteratorOptions } from './domIterator'
import {
    IndefiniteNodePredicate,
    isDocumentFragment,
    isElement,
    isText,
    NodePredicate
} from './util'

export interface Options {
    skipChildren?: IndefiniteNodePredicate
    skipSelf?: IndefiniteNodePredicate
}

export interface Config extends Options, DomIteratorOptions {
    readonly skipChildren: NodePredicate
    readonly skipSelf: NodePredicate
}

const skipChildrenMap = new Set()
skipChildrenMap.add('IMG')
skipChildrenMap.add('VIDEO')
skipChildrenMap.add('IFRAME')
skipChildrenMap.add('OBJECT')
skipChildrenMap.add('SVG')

const skipSelfMap = new Set()
skipSelfMap.add('BDO')
skipSelfMap.add('BDI')
skipSelfMap.add('Q')
skipSelfMap.add('CITE')
skipSelfMap.add('CODE')
skipSelfMap.add('DATA')
skipSelfMap.add('TIME')
skipSelfMap.add('VAR')
skipSelfMap.add('DFN')
skipSelfMap.add('ABBR')
skipSelfMap.add('STRONG')
skipSelfMap.add('EM')
skipSelfMap.add('BIG')
skipSelfMap.add('SMALL')
skipSelfMap.add('MARK')
skipSelfMap.add('SUB')
skipSelfMap.add('SUP')
skipSelfMap.add('SAMP')
skipSelfMap.add('KBD')
skipSelfMap.add('B')
skipSelfMap.add('I')
skipSelfMap.add('S')
skipSelfMap.add('U')
skipSelfMap.add('SPAN')

export function optionsToConfig({
    skipChildren,
    skipSelf
}: Options = {}): Config {
    return {
        skipChildren(node: Node): boolean {
            if (!isElement(node) && !isDocumentFragment(node)) {
                return true
            }

            if (skipChildren) {
                const result = skipChildren(node)
                if (typeof result === 'boolean') {
                    return result
                }
            }

            return skipChildrenMap.has(node.nodeName)
        },
        skipSelf(node: Node): boolean {
            if (!isText(node) && !isElement(node)) {
                return true
            }

            if (skipSelf) {
                const result = skipSelf(node)
                if (typeof result === 'boolean') {
                    return result
                }
            }
            return skipSelfMap.has(node.nodeName)
        }
    }
}
