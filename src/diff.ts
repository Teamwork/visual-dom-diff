import { diffWords } from 'diff'
import { Config, Options, optionsToConfig } from './config'
import { DomIterator } from './domIterator'
import {
    compareNodes,
    getAncestorCount,
    isDocumentFragment,
    isText,
    never
} from './util'

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
    const config = optionsToConfig(options)
    const { skipChildren } = config
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

    function getNewDepth(node: Node): number {
        return (
            getAncestorCount(node, newRootNode) -
            (isDocumentFragment(newRootNode) ? 1 : 0)
        )
    }

    function nextDiff(step: number): void {
        diffOffset += step
        if (diffOffset === diffItem.value.length) {
            ;({ done: diffDone, value: diffItem } = diffIterator.next())
            diffOffset = 0
        }
    }

    function nextOld(step: number): void {
        oldOffset += step
        if (!isText(oldNode) || oldOffset === oldNode.length) {
            ;({ done: oldDone, value: oldNode } = oldIterator.next())
            oldOffset = 0
        }
    }

    function nextNew(step: number): void {
        newOffset += step
        if (!isText(newNode) || newOffset === newNode.length) {
            ;({ done: newDone, value: newNode } = newIterator.next())
            newOffset = 0
        }
    }

    while (!diffDone || !oldDone || !newDone) {
        if (!diffDone && diffItem.value.length === diffOffset) {
            // Skip an empty diff item.
            nextDiff(0)
        } else if (
            !oldDone &&
            ((isText(oldNode) && oldNode.length === oldOffset) ||
                isDocumentFragment(oldNode))
        ) {
            // Skip an empty text node or a document fragment.
            nextOld(0)
        } else if (
            !newDone &&
            ((isText(newNode) && newNode.length === newOffset) ||
                isDocumentFragment(newNode))
        ) {
            // Skip an empty text node or a document fragment.
            nextNew(0)
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
                    // Identical text nodes.
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
                    appendChild(node, getNewDepth(newNode))
                    nextDiff(length)
                    nextOld(length)
                    nextNew(length)
                } else if (compareNodes(oldNode, newNode)) {
                    // Identical non-text nodes.
                    appendChild(newNode.cloneNode(false), getNewDepth(newNode))
                    nextDiff(skipChildren(newNode) ? 1 : 0)
                    nextOld(0)
                    nextNew(0)
                } else {
                    // Different nodes.
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
