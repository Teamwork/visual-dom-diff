# visual-dom-diff

Highlight differences between two DOM trees.

## Installation

```
npm i visual-dom-diff
```

## Usage

```javascript
import { visualDomDiff } from 'visualDomDiff'

const diffNode = visualDomDiff(originalNode, changedNode, options)
```

## API

### visualDomDiff(originalNode: Node, changedNode: Node, options?: Options): DocumentFragment

Returns a new document fragment with the content from the two input nodes and annotations indicating if the given fragment was removed, modified or added in the `changedNode`, ralative to the `originalNode`.

Changes to text or document structure are represented as deletions (`<del class="vdd-removed">`) followed by insertions (`<ins class="vdd-added">`). Changes to formatting are treated as content modifications (`<ins class="vdd-modified">`) and only the new formatting is carried over to the returned document fragment.

### Options

- `ignoreCase: boolean = false` Should the comparison ignore letter case.
- `addedClass: string = 'vdd-added'` The class used for annotating content additions.
- `modifiedClass: string = 'vdd-modified'` The class used for annotating content modifications.
- `removedClass: string = 'vdd-removed'` The class used for annotating content removals.
- `skipChildren: (node: Node): boolean | undefined` Indicates if the child nodes of the specified `node` should be ignored. It is useful for ignoring child nodes of an element representing some embedded content, which should not be compared. Return `undefined` for the default behaviour.
- `skipSelf: (node: Node): boolean | undefined` Indicates if the specified `node` should be ignored. Even if the `node` is ignored, its child nodes will still be processed, unless `skipChildNodes` says they should also be ignored. Ignored elements whose child nodes are processed are treated as formatting elements. Return `undefined` for the default behaviour.
