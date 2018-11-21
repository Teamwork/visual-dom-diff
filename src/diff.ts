import { diffWords } from 'diff'
import { Config, Options, optionsToConfig } from './config'
import { DomIterator } from './domIterator'
import { compareNodes, getAncestors, isText, never } from './util'

const serialize = (root: Node, config: Config): string =>
    [...new DomIterator(root, config)].reduce(
        (text, node) => text + (isText(node) ? node.data : '\0'),
        ''
    )

const getLength = (node: Node): number => (isText(node) ? node.length : 1)

export function visualDomDiff(
    oldRootNode: Node,
    newRootNode: Node,
    options: Options = {}
): DocumentFragment {
    const config = optionsToConfig(options)
    const { skipSelf } = config
    const notSkipSelf = (node: Node): boolean => !skipSelf(node)
    const getDepth = (node: Node, rootNode: Node): number =>
        getAncestors(node, rootNode).filter(notSkipSelf).length

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
    let outputDepth = 0
    // let addedDepth = -1
    // let removedDepth = -1
    // let modifiedDepth = -1

    function appendChild(node: Node, depth: number): void {
        // Make sure we append the new child to the correct parent node.
        while (outputDepth > depth) {
            /* istanbul ignore if */
            if (!outputNode.parentNode) {
                return never()
            }
            outputNode = outputNode.parentNode
            outputDepth--
        }

        /* istanbul ignore if */
        if (outputDepth !== depth) {
            return never()
        }

        // Append the child node.
        outputNode.appendChild(node)
        outputNode = node
        outputDepth++
    }

    function nextDiff(step: number): void {
        const length = diffItem.value.length
        diffOffset += step
        if (diffOffset === length) {
            ;({ done: diffDone, value: diffItem } = diffIterator.next())
            diffOffset = 0
        } else if (diffOffset > length) {
            return never()
        }
    }

    function nextOld(step: number): void {
        const length = getLength(oldNode)
        oldOffset += step
        if (oldOffset === length) {
            ;({ done: oldDone, value: oldNode } = oldIterator.next())
            oldOffset = 0
        } else if (oldOffset > length) {
            return never()
        }
    }

    function nextNew(step: number): void {
        const length = getLength(newNode)
        newOffset += step
        if (newOffset === length) {
            ;({ done: newDone, value: newNode } = newIterator.next())
            newOffset = 0
        } else if (newOffset > length) {
            return never()
        }
    }

    while (!diffDone) {
        if (diffItem.value.length === 0) {
            nextDiff(0)
        } else if (diffItem.added) {
            if (newDone) {
                return never()
            }
            // TODO
        } else if (diffItem.removed) {
            if (oldDone) {
                return never()
            }
            // TODO
        } else {
            if (oldDone || newDone) {
                return never()
            }
            if (isText(oldNode) && isText(newNode)) {
                const length = Math.min(
                    diffItem.value.length - diffOffset,
                    oldNode.length - oldOffset,
                    newNode.length - newOffset
                )
                const node = document.createTextNode(
                    diffItem.value.substring(diffOffset, diffOffset + length)
                )
                appendChild(node, getDepth(newNode, newRootNode))
                nextDiff(length)
                nextOld(length)
                nextNew(length)
            } else if (compareNodes(oldNode, newNode)) {
                appendChild(
                    newNode.cloneNode(false),
                    getDepth(newNode, newRootNode)
                )
                nextDiff(1)
                nextOld(1)
                nextNew(1)
            } else {
                // TODO
            }
        }
    }

    return outputRootNode
}
