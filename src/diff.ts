import { Diff, DIFF_DELETE, DIFF_INSERT } from 'diff-match-patch'
import { Config, Options, optionsToConfig } from './config'
import { DomIterator } from './domIterator'
import {
    areNodesEqual,
    charForNodeName,
    diffText,
    getAncestors,
    isElement,
    isTableValid,
    isText,
    markUpNode,
    never,
} from './util'

/**
 * A simple helper which allows us to treat TH as TD in certain situations.
 */
const nodeNameOverride = (nodeName: string): string => {
    return nodeName === 'TH' ? 'TD' : nodeName
}

/**
 * Stringifies a DOM node recursively. Text nodes are represented by their `data`,
 * while all other nodes are represented by a single Unicode code point
 * from the Private Use Area of the Basic Multilingual Plane.
 */
const serialize = (root: Node, config: Config): string =>
    [...new DomIterator(root, config)].reduce(
        (text, node) =>
            text +
            (isText(node)
                ? node.data
                : charForNodeName(nodeNameOverride(node.nodeName))),
        '',
    )

const getLength = (node: Node): number => (isText(node) ? node.length : 1)
const isTr = (node: Node): boolean => node.nodeName === 'TR'
const isNotTr = (node: Node): boolean => !isTr(node)
const trIteratorOptions = {
    skipChildren: isTr,
    skipSelf: isNotTr,
}

export { Options as VisualDomDiffOptions } from './config'
export function visualDomDiff(
    oldRootNode: Node,
    newRootNode: Node,
    options: Options = {},
): DocumentFragment {
    // Define config and simple helpers.
    const document = newRootNode.ownerDocument || (newRootNode as Document)
    const config = optionsToConfig(options)
    const {
        addedClass,
        modifiedClass,
        removedClass,
        skipSelf,
        skipChildren,
    } = config
    const notSkipSelf = (node: Node): boolean => !skipSelf(node)
    const getDepth = (node: Node, rootNode: Node): number =>
        getAncestors(node, rootNode).filter(notSkipSelf).length
    const isFormattingNode = (node: Node): boolean =>
        isElement(node) && skipSelf(node)
    const getFormattingAncestors = (node: Node, rootNode: Node): Node[] =>
        getAncestors(node, rootNode)
            .filter(isFormattingNode)
            .reverse()
    const getColumnValue = (node: Node) =>
        addedNodes.has(node) ? 1 : removedNodes.has(node) ? -1 : 0

    // Input iterators.
    const diffIterator = diffText(
        serialize(oldRootNode, config),
        serialize(newRootNode, config),
    )[Symbol.iterator]()
    const oldIterator = new DomIterator(oldRootNode, config)
    const newIterator = new DomIterator(newRootNode, config)

    // Input variables produced by the input iterators.
    let diffDone: boolean | undefined
    let oldDone: boolean | undefined
    let newDone: boolean | undefined
    let diffItem: Diff
    let oldNode: Node
    let newNode: Node
    let diffOffset = 0
    let oldOffset = 0
    let newOffset = 0
    ;({ done: diffDone, value: diffItem } = diffIterator.next())
    ;({ done: oldDone, value: oldNode } = oldIterator.next())
    ;({ done: newDone, value: newNode } = newIterator.next())

    // Output variables.
    const rootOutputNode = document.createDocumentFragment()
    let oldOutputNode: Node = rootOutputNode
    let oldOutputDepth = 0
    let newOutputNode: Node = rootOutputNode
    let newOutputDepth = 0
    let removedNode: Node | null = null
    let addedNode: Node | null = null
    const removedNodes = new Set<Node>()
    const addedNodes = new Set<Node>()
    const modifiedNodes = new Set<Node>()
    const formattingMap = new Map<Node, Node[]>()
    const equalTables = new Array<{
        oldTable: Node
        newTable: Node
        outputTable: Node
    }>()
    const equalRows = new Map<
        Node, // outputRow
        {
            oldRow: Node
            newRow: Node
        }
    >()

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

    function appendCommonChild(node: Node): void {
        /* istanbul ignore if */
        if (oldOutputNode !== newOutputNode || addedNode || removedNode) {
            return never()
        }

        if (isText(node)) {
            const oldFormatting = getFormattingAncestors(oldNode, oldRootNode)
            const newFormatting = getFormattingAncestors(newNode, newRootNode)
            formattingMap.set(node, newFormatting)

            const length = oldFormatting.length
            if (length !== newFormatting.length) {
                modifiedNodes.add(node)
            } else {
                for (let i = 0; i < length; ++i) {
                    if (!areNodesEqual(oldFormatting[i], newFormatting[i])) {
                        modifiedNodes.add(node)
                        break
                    }
                }
            }
        } else {
            if (!areNodesEqual(oldNode, newNode)) {
                modifiedNodes.add(node)
            }

            const nodeName = oldNode.nodeName
            if (nodeName === 'TABLE') {
                equalTables.push({
                    newTable: newNode,
                    oldTable: oldNode,
                    outputTable: node,
                })
            } else if (nodeName === 'TR') {
                equalRows.set(node, {
                    newRow: newNode,
                    oldRow: oldNode,
                })
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
            removedNodes.add(node)
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
            addedNodes.add(node)
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
        const length = diffItem[1].length
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
        if (diffItem[0] === DIFF_DELETE) {
            /* istanbul ignore if */
            if (oldDone) {
                return never()
            }

            prepareOldOutput()

            const length = Math.min(
                diffItem[1].length - diffOffset,
                getLength(oldNode) - oldOffset,
            )
            const text = diffItem[1].substring(diffOffset, diffOffset + length)

            appendOldChild(
                isText(oldNode)
                    ? document.createTextNode(text)
                    : oldNode.cloneNode(false),
            )

            nextDiff(length)
            nextOld(length)
        } else if (diffItem[0] === DIFF_INSERT) {
            /* istanbul ignore if */
            if (newDone) {
                return never()
            }

            prepareNewOutput()

            const length = Math.min(
                diffItem[1].length - diffOffset,
                getLength(newNode) - newOffset,
            )
            const text = diffItem[1].substring(diffOffset, diffOffset + length)

            appendNewChild(
                isText(newNode)
                    ? document.createTextNode(text)
                    : newNode.cloneNode(false),
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
                diffItem[1].length - diffOffset,
                getLength(oldNode) - oldOffset,
                getLength(newNode) - newOffset,
            )
            const text = diffItem[1].substring(diffOffset, diffOffset + length)

            if (
                oldOutputNode === newOutputNode &&
                ((isText(oldNode) && isText(newNode)) ||
                    (nodeNameOverride(oldNode.nodeName) ===
                        nodeNameOverride(newNode.nodeName) &&
                        !skipChildren(oldNode) &&
                        !skipChildren(newNode)) ||
                    areNodesEqual(oldNode, newNode))
            ) {
                appendCommonChild(
                    isText(newNode)
                        ? document.createTextNode(text)
                        : newNode.cloneNode(false),
                )
            } else {
                appendOldChild(
                    isText(oldNode)
                        ? document.createTextNode(text)
                        : oldNode.cloneNode(false),
                )
                appendNewChild(
                    isText(newNode)
                        ? document.createTextNode(text)
                        : newNode.cloneNode(false),
                )
            }

            nextDiff(length)
            nextOld(length)
            nextNew(length)
        }
    }

    // Move deletes before inserts.
    for (removedNode of removedNodes) {
        const parentNode = removedNode.parentNode as Node
        let previousSibling = removedNode.previousSibling

        while (previousSibling && addedNodes.has(previousSibling)) {
            parentNode.insertBefore(removedNode, previousSibling)
            previousSibling = removedNode.previousSibling
        }
    }

    // Ensure a user friendly result for tables.
    for (const { newTable, oldTable, outputTable } of equalTables) {
        // Handle tables which can't be diffed nicely.
        if (
            !isTableValid(oldTable, true) ||
            !isTableValid(newTable, true) ||
            !isTableValid(outputTable, false)
        ) {
            // Remove all values which were previously recorded for outputTable.
            for (const node of new DomIterator(outputTable)) {
                addedNodes.delete(node)
                removedNodes.delete(node)
                modifiedNodes.delete(node)
                formattingMap.delete(node)
            }

            // Display both the old and new table.
            const parentNode = outputTable.parentNode!
            const oldTableClone = oldTable.cloneNode(true)
            const newTableClone = newTable.cloneNode(true)
            parentNode.insertBefore(oldTableClone, outputTable)
            parentNode.insertBefore(newTableClone, outputTable)
            parentNode.removeChild(outputTable)
            removedNodes.add(oldTableClone)
            addedNodes.add(newTableClone)
            continue
        }

        // Figure out which columns have been added or removed
        // based on the first row appearing in both tables.
        //
        // -  1: column added
        // -  0: column equal
        // - -1: column removed
        const columns: number[] = []
        for (const row of new DomIterator(outputTable, trIteratorOptions)) {
            const diffedRows = equalRows.get(row)
            if (!diffedRows) {
                continue
            }
            const { oldRow, newRow } = diffedRows
            const oldColumnCount = oldRow.childNodes.length
            const newColumnCount = newRow.childNodes.length
            const maxColumnCount = Math.max(oldColumnCount, newColumnCount)
            const minColumnCount = Math.min(oldColumnCount, newColumnCount)

            if (row.childNodes.length === maxColumnCount) {
                // The generic diff algorithm worked properly in this case,
                // so we can rely on its results.
                const cells = row.childNodes
                for (let i = 0, l = cells.length; i < l; ++i) {
                    columns.push(getColumnValue(cells[i]))
                }
            } else {
                // Fallback to a simple but correct algorithm.
                let i = 0
                let columnValue = 0
                while (i < minColumnCount) {
                    columns[i++] = columnValue
                }
                columnValue = oldColumnCount < newColumnCount ? 1 : -1
                while (i < maxColumnCount) {
                    columns[i++] = columnValue
                }
            }
            break
        }
        const columnCount = columns.length
        /* istanbul ignore if */
        if (columnCount === 0) {
            return never()
        }

        // Fix up the rows which do not align with `columns`.
        for (const row of new DomIterator(outputTable, trIteratorOptions)) {
            const cells = row.childNodes

            if (addedNodes.has(row)) {
                if (cells.length < columnCount) {
                    for (let i = 0; i < columnCount; ++i) {
                        if (columns[i] === -1) {
                            const td = document.createElement('TD')
                            row.insertBefore(td, cells[i])
                            removedNodes.add(td)
                        }
                    }
                }
            } else if (removedNodes.has(row)) {
                if (cells.length < columnCount) {
                    for (let i = 0; i < columnCount; ++i) {
                        if (columns[i] === 1) {
                            const td = document.createElement('TD')
                            row.insertBefore(td, cells[i])
                        }
                    }
                }
            } else {
                // Check, if the columns in this row are aligned with those in the reference row.
                let isAligned = true
                for (let i = 0, l = cells.length; i < l; ++i) {
                    if (getColumnValue(cells[i]) !== columns[i]) {
                        isAligned = false
                        break
                    }
                }

                if (!isAligned) {
                    // Remove all values which were previously recorded for row's content.
                    const iterator = new DomIterator(row)
                    iterator.next() // Skip the row itself.
                    for (const node of iterator) {
                        addedNodes.delete(node)
                        removedNodes.delete(node)
                        modifiedNodes.delete(node)
                        formattingMap.delete(node)
                    }

                    // Remove the row's content.
                    while (row.firstChild) {
                        row.removeChild(row.firstChild)
                    }

                    // Diff the individual cells.
                    const { newRow, oldRow } = equalRows.get(row)!
                    const newCells = newRow.childNodes
                    const oldCells = oldRow.childNodes
                    let oldIndex = 0
                    let newIndex = 0
                    for (let i = 0; i < columnCount; ++i) {
                        if (columns[i] === 1) {
                            const newCellClone = newCells[newIndex++].cloneNode(
                                true,
                            )
                            row.appendChild(newCellClone)
                            addedNodes.add(newCellClone)
                        } else if (columns[i] === -1) {
                            const oldCellClone = oldCells[oldIndex++].cloneNode(
                                true,
                            )
                            row.appendChild(oldCellClone)
                            removedNodes.add(oldCellClone)
                        } else {
                            row.appendChild(
                                visualDomDiff(
                                    oldCells[oldIndex++],
                                    newCells[newIndex++],
                                    options,
                                ),
                            )
                        }
                    }
                }
            }
        }
    }

    // Mark up the content which has been removed.
    for (removedNode of removedNodes) {
        markUpNode(removedNode, 'DEL', removedClass)
    }

    // Mark up the content which has been added.
    for (addedNode of addedNodes) {
        markUpNode(addedNode, 'INS', addedClass)
    }

    // Mark up the content which has been modified.
    if (!config.skipModified) {
        for (const modifiedNode of modifiedNodes) {
            markUpNode(modifiedNode, 'INS', modifiedClass)
        }
    }

    // Add formatting.
    for (const [textNode, formattingNodes] of formattingMap) {
        for (const formattingNode of formattingNodes) {
            const parentNode = textNode.parentNode as Node
            const previousSibling = textNode.previousSibling

            if (
                previousSibling &&
                areNodesEqual(previousSibling, formattingNode)
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
