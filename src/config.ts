import { DomIteratorOptions } from './domIterator'
import {
    areNodesEqual,
    IndefiniteNodePredicate,
    isDocumentFragment,
    isElement,
    isText,
    NodePredicate
} from './util'

/**
 * The type of the result returned by the `compareNodes` option.
 */
export enum CompareNodesResult {
    /**
     * Nodes are identical and should not be marked up in the diff result.
     */
    IDENTICAL,
    /**
     * Nodes are similar and should be marked up in the diff result as modified.
     */
    SIMILAR,
    /**
     * Nodes are different and should be marked up in the diff result as a removal followed by an insertion.
     */
    DIFFERENT
}
type IndefiniteCompareNodes = (
    node1: Node,
    node2: Node
) => CompareNodesResult | undefined
type CompareNodes = (node1: Node, node2: Node) => CompareNodesResult

/**
 * The options for `visualDomDiff`.
 */
export interface Options {
    /**
     * The class name to use to mark up inserted content.
     * Default is `'vdd-added'`.
     */
    addedClass?: string
    /**
     * Should the letter case be ignored.
     * Default is `false`.
     */
    ignoreCase?: boolean
    /**
     * The class name to use to mark up modified content.
     * Default is `'vdd-modified'`.
     */
    modifiedClass?: string
    /**
     * The class name to use to mark up removed content.
     * Default is `'vdd-removed'`.
     */
    removedClass?: string
    /**
     * Indicates if the child nodes of the specified `node` should be ignored.
     * It is useful for ignoring child nodes of an element representing some embedded content,
     * which should not be compared. Return `undefined` for the default behaviour.
     */
    skipChildren?: IndefiniteNodePredicate
    /**
     * Indicates if the specified `node` should be ignored.
     * Even if the `node` is ignored, its child nodes will still be processed,
     * unless `skipChildNodes` says they should also be ignored.
     * Ignored elements whose child nodes are processed are treated as formatting elements.
     * Return `undefined` for the default behaviour.
     */
    skipSelf?: IndefiniteNodePredicate
    /**
     * Determines whether the specified nodes are identical, similar or different.
     * Return `undefined` for the default behaviour.
     */
    compareNodes?: IndefiniteCompareNodes
}

export interface Config extends Options, DomIteratorOptions {
    readonly addedClass: string
    readonly ignoreCase: boolean
    readonly modifiedClass: string
    readonly removedClass: string
    readonly skipChildren: NodePredicate
    readonly skipSelf: NodePredicate
    readonly compareNodes: CompareNodes
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
    addedClass = 'vdd-added',
    ignoreCase = false,
    modifiedClass = 'vdd-modified',
    removedClass = 'vdd-removed',
    skipChildren,
    skipSelf,
    compareNodes
}: Options = {}): Config {
    return {
        addedClass,
        ignoreCase,
        modifiedClass,
        removedClass,
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
        },
        compareNodes(node1: Node, node2: Node): CompareNodesResult {
            if (compareNodes) {
                const result = compareNodes(node1, node2)
                if (
                    result === CompareNodesResult.IDENTICAL ||
                    result === CompareNodesResult.SIMILAR ||
                    result === CompareNodesResult.DIFFERENT
                ) {
                    return result
                }
            }
            return areNodesEqual(node1, node2)
                ? CompareNodesResult.IDENTICAL
                : CompareNodesResult.DIFFERENT
        }
    }
}
