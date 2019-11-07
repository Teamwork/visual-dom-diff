import { NodePredicate } from './util'

export interface DomIteratorOptions {
    skipSelf?: NodePredicate
    skipChildren?: NodePredicate
}

export class DomIterator implements Iterator<Node> {
    private nextNode: Node | null
    private descend: boolean = true

    public constructor(
        private rootNode: Node,
        private config?: DomIteratorOptions,
    ) {
        this.nextNode = this.rootNode
        if (this.skipSelf(this.nextNode)) {
            this.next()
        }
    }

    public toArray(): Node[] {
        const array: Node[] = []
        let { done, value } = this.next()

        while (!done) {
            array.push(value)
            ;({ done, value } = this.next())
        }

        return array
    }

    public forEach(fn: (node: Node) => void): void {
        let { done, value } = this.next()

        while (!done) {
            fn(value)
            ;({ done, value } = this.next())
        }
    }

    public reduce<T>(fn: (result: T, current: Node) => T, initial: T): T {
        let result = initial
        let { done, value } = this.next()

        while (!done) {
            result = fn(result, value)
            ;({ done, value } = this.next())
        }

        return result
    }

    public some(fn: (node: Node) => boolean): boolean {
        let { done, value } = this.next()

        while (!done) {
            if (fn(value)) {
                return true
            }
            ;({ done, value } = this.next())
        }

        return false
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

        if (this.nextNode && this.skipSelf(this.nextNode)) {
            this.next() // Skip this node, as directed by the config.
        }

        return { done, value }
    }

    private skipSelf(node: Node): boolean {
        return this.config && this.config.skipSelf
            ? this.config.skipSelf(node)
            : false
    }

    private skipChildren(node: Node): boolean {
        return this.config && this.config.skipChildren
            ? this.config.skipChildren(node)
            : false
    }
}
