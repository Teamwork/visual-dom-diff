import { NodePredicate } from './util'

export interface DomIteratorOptions {
    skip?: NodePredicate
    skipChildNodes?: NodePredicate
}

export class DomIterator implements IterableIterator<Node> {
    private nextNode: Node | null
    private descend: boolean = true

    public constructor(
        private rootNode: Node,
        private config?: DomIteratorOptions
    ) {
        this.nextNode = this.skip(this.rootNode) ? null : this.rootNode
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
            !this.skipChildNodes(this.nextNode)
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

        if (this.nextNode && this.skip(this.nextNode)) {
            this.next() // Skip this node, as directed by the config.
        }

        return { done, value }
    }

    private skip(node: Node): boolean {
        return this.config && this.config.skip ? this.config.skip(node) : false
    }

    private skipChildNodes(node: Node): boolean {
        return (
            this.skip(node) ||
            (this.config && this.config.skipChildNodes
                ? this.config.skipChildNodes(node)
                : false)
        )
    }
}
