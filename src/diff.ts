import { diffWords } from 'diff'
import { Config, Options, optionsToConfig } from './config'
import { DomIterator } from './domIterator'
import {
    compareArrays,
    compareNodes,
    getAncestors,
    isElement,
    isText,
    never
} from './util'

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
    // Define config and simple helpers.
    const config = optionsToConfig(options)
    const { addedClass, modifiedClass, removedClass, skipSelf } = config
    const notSkipSelf = (node: Node): boolean => !skipSelf(node)
    const getDepth = (node: Node, rootNode: Node): number =>
        getAncestors(node, rootNode).filter(notSkipSelf).length
    const isFormattingNode = (node: Node): boolean =>
        isElement(node) && skipSelf(node)
    const getFormattingAncestors = (node: Node, rootNode: Node): Node[] =>
        getAncestors(node, rootNode)
            .filter(isFormattingNode)
            .reverse()

    // Input iterators.
    const diffIterator = diffWords(
        serialize(oldRootNode, config),
        serialize(newRootNode, config)
    )[Symbol.iterator]()
    const oldIterator = new DomIterator(oldRootNode, config)
    const newIterator = new DomIterator(newRootNode, config)

    // Input variables produced by the input iterators.
    let { done: diffDone, value: diffItem } = diffIterator.next()
    let { done: oldDone, value: oldNode } = oldIterator.next()
    let { done: newDone, value: newNode } = newIterator.next()
    let diffOffset = 0
    let oldOffset = 0
    let newOffset = 0

    // Output variables.
    const rootOutputNode = document.createDocumentFragment()
    let oldOutputNode: Node = rootOutputNode
    let oldOutputDepth = 0
    let newOutputNode: Node = rootOutputNode
    let newOutputDepth = 0
    let removedNode: Node | null = null
    let addedNode: Node | null = null
    const removedNodes = new Array<Node>()
    const addedNodes = new Array<Node>()
    const modifiedFormattingNodes = new Array<Node>()
    const formattingMap = new Map<Node, Node[]>()

    function prepareOldOutput(): void {
        const depth = getDepth(oldNode, oldRootNode)
        while (oldOutputDepth > depth) {
            /* istanbul ignore if */
            if (!oldOutputNode.parentNode) {
                return never()
            }
            if (oldOutputNode === removedNode) {
                removedNode = null
            }
            oldOutputNode = oldOutputNode.parentNode
            oldOutputDepth--
        }

        /* istanbul ignore if */
        if (oldOutputDepth !== depth) {
            return never()
        }
    }

    function prepareNewOutput(): void {
        const depth = getDepth(newNode, newRootNode)
        while (newOutputDepth > depth) {
            /* istanbul ignore if */
            if (!newOutputNode.parentNode) {
                return never()
            }
            if (newOutputNode === addedNode) {
                addedNode = null
            }
            newOutputNode = newOutputNode.parentNode
            newOutputDepth--
        }

        /* istanbul ignore if */
        if (newOutputDepth !== depth) {
            return never()
        }
    }

    function appendChild(node: Node): void {
        /* istanbul ignore if */
        if (oldOutputNode !== newOutputNode || addedNode || removedNode) {
            return never()
        }

        if (isText(node)) {
            const oldFormatting = getFormattingAncestors(oldNode, oldRootNode)
            const newFormatting = getFormattingAncestors(newNode, newRootNode)
            formattingMap.set(node, newFormatting)
            if (!compareArrays(oldFormatting, newFormatting, compareNodes)) {
                modifiedFormattingNodes.push(node)
            }
        }

        newOutputNode.appendChild(node)
        oldOutputNode = node
        newOutputNode = node
        oldOutputDepth++
        newOutputDepth++
    }

    function appendOldChild(node: Node): void {
        if (!removedNode) {
            removedNode = node
            removedNodes.push(node)
        }

        if (isText(node)) {
            const oldFormatting = getFormattingAncestors(oldNode, oldRootNode)
            formattingMap.set(node, oldFormatting)
        }

        oldOutputNode.appendChild(node)
        oldOutputNode = node
        oldOutputDepth++
    }

    function appendNewChild(node: Node): void {
        if (!addedNode) {
            addedNode = node
            addedNodes.push(node)
        }

        if (isText(node)) {
            const newFormatting = getFormattingAncestors(newNode, newRootNode)
            formattingMap.set(node, newFormatting)
        }

        newOutputNode.appendChild(node)
        newOutputNode = node
        newOutputDepth++
    }

    function nextDiff(step: number): void {
        const length = diffItem.value.length
        diffOffset += step
        if (diffOffset === length) {
            ;({ done: diffDone, value: diffItem } = diffIterator.next())
            diffOffset = 0
        } else {
            /* istanbul ignore if */
            if (diffOffset > length) {
                return never()
            }
        }
    }

    function nextOld(step: number): void {
        const length = getLength(oldNode)
        oldOffset += step
        if (oldOffset === length) {
            ;({ done: oldDone, value: oldNode } = oldIterator.next())
            oldOffset = 0
        } else {
            /* istanbul ignore if */
            if (oldOffset > length) {
                return never()
            }
        }
    }

    function nextNew(step: number): void {
        const length = getLength(newNode)
        newOffset += step
        if (newOffset === length) {
            ;({ done: newDone, value: newNode } = newIterator.next())
            newOffset = 0
        } else {
            /* istanbul ignore if */
            if (newOffset > length) {
                return never()
            }
        }
    }

    // Copy all content from oldRootNode and newRootNode to rootOutputNode,
    // while deduplicating identical content.
    // Difference markers and formatting are excluded at this stage.
    while (!diffDone) {
        if (diffItem.value.length === 0) {
            nextDiff(0)
        } else if (diffItem.removed) {
            /* istanbul ignore if */
            if (oldDone) {
                return never()
            }

            prepareOldOutput()

            const length = Math.min(
                diffItem.value.length - diffOffset,
                getLength(oldNode) - oldOffset
            )
            const text = diffItem.value.substring(
                diffOffset,
                diffOffset + length
            )

            appendOldChild(
                isText(oldNode)
                    ? document.createTextNode(text)
                    : oldNode.cloneNode(false)
            )

            nextDiff(length)
            nextOld(length)
        } else if (diffItem.added) {
            /* istanbul ignore if */
            if (newDone) {
                return never()
            }

            prepareNewOutput()

            const length = Math.min(
                diffItem.value.length - diffOffset,
                getLength(oldNode) - oldOffset,
                getLength(newNode) - newOffset
            )
            const text = diffItem.value.substring(
                diffOffset,
                diffOffset + length
            )

            appendNewChild(
                isText(newNode)
                    ? document.createTextNode(text)
                    : newNode.cloneNode(false)
            )

            nextDiff(length)
            nextNew(length)
        } else {
            /* istanbul ignore if */
            if (oldDone || newDone) {
                return never()
            }

            prepareOldOutput()
            prepareNewOutput()

            const length = Math.min(
                diffItem.value.length - diffOffset,
                getLength(oldNode) - oldOffset,
                getLength(newNode) - newOffset
            )
            const text = diffItem.value.substring(
                diffOffset,
                diffOffset + length
            )

            if (isText(oldNode) && isText(newNode)) {
                if (oldOutputNode === newOutputNode) {
                    appendChild(document.createTextNode(text))
                } else {
                    appendOldChild(document.createTextNode(text))
                    appendNewChild(document.createTextNode(text))
                }
            } else if (compareNodes(oldNode, newNode)) {
                if (oldOutputNode === newOutputNode) {
                    appendChild(newNode.cloneNode(false))
                } else {
                    appendOldChild(oldNode.cloneNode(false))
                    appendNewChild(newNode.cloneNode(false))
                }
            } else {
                appendOldChild(
                    isText(oldNode)
                        ? document.createTextNode(text)
                        : oldNode.cloneNode(false)
                )
                appendNewChild(
                    isText(newNode)
                        ? document.createTextNode(text)
                        : newNode.cloneNode(false)
                )
            }

            nextDiff(length)
            nextOld(length)
            nextNew(length)
        }
    }

    // Mark up the content which has been removed.
    for (removedNode of removedNodes) {
        const parentNode = removedNode.parentNode as Node
        let previousSibling = removedNode.previousSibling

        // Move the delete before inserts.
        while (previousSibling && addedNodes.includes(previousSibling)) {
            parentNode.insertBefore(removedNode, previousSibling)
            previousSibling = removedNode.previousSibling
        }

        if (
            previousSibling &&
            previousSibling.lastChild &&
            removedNodes.includes(previousSibling.lastChild)
        ) {
            previousSibling.appendChild(removedNode)
        } else {
            const marker = document.createElement('DEL')
            marker.classList.add(removedClass)
            parentNode.insertBefore(marker, removedNode)
            marker.appendChild(removedNode)
        }
    }

    // Mark up the content which has been added.
    for (addedNode of addedNodes) {
        const parentNode = addedNode.parentNode as Node
        const previousSibling = addedNode.previousSibling

        if (
            previousSibling &&
            previousSibling.lastChild &&
            addedNodes.includes(previousSibling.lastChild)
        ) {
            previousSibling.appendChild(addedNode)
        } else {
            const marker = document.createElement('INS')
            marker.classList.add(addedClass)
            parentNode.insertBefore(marker, addedNode)
            marker.appendChild(addedNode)
        }
    }

    // Mark up the content with modified formatting.
    for (const modifiedFormattingNode of modifiedFormattingNodes) {
        const parentNode = modifiedFormattingNode.parentNode as Node
        const previousSibling = modifiedFormattingNode.previousSibling

        if (
            previousSibling &&
            previousSibling.lastChild &&
            modifiedFormattingNodes.includes(previousSibling.lastChild)
        ) {
            previousSibling.appendChild(modifiedFormattingNode)
        } else {
            const marker = document.createElement('INS')
            marker.classList.add(modifiedClass)
            parentNode.insertBefore(marker, modifiedFormattingNode)
            marker.appendChild(modifiedFormattingNode)
        }
    }

    // Add formatting.
    for (const [textNode, formattingNodes] of formattingMap) {
        for (const formattingNode of formattingNodes) {
            const parentNode = textNode.parentNode as Node
            const previousSibling = textNode.previousSibling

            if (
                previousSibling &&
                compareNodes(previousSibling, formattingNode)
            ) {
                previousSibling.appendChild(textNode)
            } else {
                const clonedFormattingNode = formattingNode.cloneNode(false)
                parentNode.insertBefore(clonedFormattingNode, textNode)
                clonedFormattingNode.appendChild(textNode)
            }
        }
    }

    return rootOutputNode
}
