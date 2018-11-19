import { diffWords } from 'diff'
import { DomIterator, DomIteratorOptions } from './domIterator'
import {
    createFormatPredicate,
    createSkipChildrenPredicate,
    createSkipSelfAndChildrenPredicate,
    getAncestorCount,
    IndefiniteNodePredicate,
    isDocumentFragment,
    isText,
    never,
    NodePredicate
} from './util'

export interface Options {
    skip?: IndefiniteNodePredicate
    skipChildren?: IndefiniteNodePredicate
    isFormat?: IndefiniteNodePredicate
}

interface Config extends Options, DomIteratorOptions {
    readonly skipSelfAndChildren: NodePredicate
    readonly skipChildren: NodePredicate
    readonly isFormat: NodePredicate
}

function serialize(root: Node, config: Config): string {
    return [...new DomIterator(root, config)].reduce(
        (text, node) =>
            text +
            (isText(node) ? node.data : config.skipChildren(node) ? '\0' : ''),
        ''
    )
}

export function visualDomDiff(
    oldRootNode: Node,
    newRootNode: Node,
    options: Options = {}
): DocumentFragment {
    const isFormat = createFormatPredicate(options.isFormat)
    const skipChildren = createSkipChildrenPredicate(options.skipChildren)
    const skipSelfAndChildren = createSkipSelfAndChildrenPredicate(options.skip)
    const config: Config = { isFormat, skipChildren, skipSelfAndChildren }

    const diffIterator = diffWords(
        serialize(oldRootNode, config),
        serialize(newRootNode, config)
    )[Symbol.iterator]()
    const oldIterator = new DomIterator(oldRootNode, config)
    const newIterator = new DomIterator(newRootNode, config)

    let { done: diffDone, value: diffItem } = diffIterator.next()
    let { done: oldDone, value: oldNode } = oldIterator.next()
    let { done: newDone, value: newNode } = newIterator.next()

    let diffOffset = 0
    let oldOffset = 0
    let newOffset = 0

    const outputRootNode = document.createDocumentFragment()
    let outputNode: Node = outputRootNode
    let outputDepth = -1
    // let addedDepth = -1
    // let removedDepth = -1
    // let modifiedDepth = -1

    function appendChild(node: Node, depth: number): void {
        // Make sure we append the new child to the correct parent node.
        while (outputDepth >= depth) {
            if (!outputNode.parentNode) {
                return never()
            }
            outputNode = outputNode.parentNode
            outputDepth--
        }

        if (outputDepth + 1 !== depth) {
            return never()
        }

        // Append the child node.
        outputNode.appendChild(node)
        outputNode = node
        outputDepth++
    }

    // function getOldDepth(node: Node) {
    //     return (
    //         getAncestorCount(node, oldRootNode) -
    //         (isDocumentFragment(oldRootNode) ? 1 : 0)
    //     )
    // }

    function getNewDepth(node: Node) {
        return (
            getAncestorCount(node, newRootNode) -
            (isDocumentFragment(newRootNode) ? 1 : 0)
        )
    }

    while (!diffDone || !oldDone || !newDone) {
        if (!diffDone && diffItem.value.length === 0) {
            // Skip an empty diff item.
            ;({ done: diffDone, value: diffItem } = diffIterator.next())
        } else if (
            !oldDone &&
            ((isText(oldNode) && oldNode.length === 0) ||
                isDocumentFragment(oldNode))
        ) {
            // Skip an empty text node or a document fragment.
            ;({ done: oldDone, value: oldNode } = oldIterator.next())
        } else if (
            !newDone &&
            ((isText(newNode) && newNode.length === 0) ||
                isDocumentFragment(newNode))
        ) {
            // Skip an empty text node or a document fragment.
            ;({ done: newDone, value: newNode } = newIterator.next())
        } else if (!diffDone) {
            if (diffItem.removed) {
                // Insert old content.
            } else if (diffItem.added) {
                // Insert new content.
            } else if (oldDone || newDone) {
                return never()
            } else {
                // Insert common content.
                if (isText(oldNode) && isText(newNode)) {
                    const length = Math.min(
                        diffItem.value.length - diffOffset,
                        oldNode.length - oldOffset,
                        newNode.length - newOffset
                    )
                    const node = document.createTextNode(
                        diffItem.value.substring(
                            diffOffset,
                            diffOffset + length
                        )
                    )
                    const depth = getNewDepth(newNode)

                    appendChild(node, depth)

                    diffOffset += length
                    oldOffset += length
                    newOffset += length

                    if (diffOffset === diffItem.value.length) {
                        ;({
                            done: diffDone,
                            value: diffItem
                        } = diffIterator.next())
                        diffOffset = 0
                    }
                    if (oldOffset === oldNode.length) {
                        ;({
                            done: oldDone,
                            value: oldNode
                        } = oldIterator.next())
                        oldOffset = 0
                    }
                    if (newOffset === newNode.length) {
                        ;({
                            done: newDone,
                            value: newNode
                        } = newIterator.next())
                        newOffset = 0
                    }
                }
            }
        } else if (!oldDone) {
            // Insert old content.
        } else if (!newDone) {
            // Insert new content.
        }
    }

    return outputRootNode
}
