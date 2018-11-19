import { NodePredicate } from './util'

export interface DomIteratorOptions {
    skipSelfAndChildren?: NodePredicate
    skipChildren?: NodePredicate
}

export class DomIterator implements IterableIterator<Node> {
    private nextNode: Node | null
    private descend: boolean = true

    public constructor(
        private rootNode: Node,
        private config?: DomIteratorOptions
    ) {
        this.nextNode = this.skipSelfAndChildren(this.rootNode)
            ? null
            : this.rootNode
    }

    public [Symbol.iterator](): IterableIterator<Node> {
        return this
    }

    public next(): IteratorResult<Node> {
        if (!this.nextNode) {
            return { done: true, value: this.rootNode }
        }

        const value = this.nextNode
        const done = false

        if (
            this.descend &&
            this.nextNode.firstChild &&
            !this.skipChildren(this.nextNode)
        ) {
            this.nextNode = this.nextNode.firstChild
        } else if (this.nextNode === this.rootNode) {
            this.nextNode = null
        } else if (this.nextNode.nextSibling) {
            this.nextNode = this.nextNode.nextSibling
            this.descend = true
        } else {
            this.nextNode = this.nextNode.parentNode
            this.descend = false
            this.next() // Skip this node, as we've visited it already.
        }

        if (this.nextNode && this.skipSelfAndChildren(this.nextNode)) {
            this.next() // Skip this node, as directed by the config.
        }

        return { done, value }
    }

    private skipSelfAndChildren(node: Node): boolean {
        return this.config && this.config.skipSelfAndChildren
            ? this.config.skipSelfAndChildren(node)
            : false
    }

    private skipChildren(node: Node): boolean {
        return (
            this.skipSelfAndChildren(node) ||
            (this.config && this.config.skipChildren
                ? this.config.skipChildren(node)
                : false)
        )
    }
}
