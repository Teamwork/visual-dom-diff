# 0.6.0

- BREAKING CHANGE: Mark up the added and removed elements by adding the `vdd-added` and `vdd-removed` classes to the affected elements, instead of using the `<INS>` and `<DEL>` wrappers. Text and formatting changes still use the `<INS>` and `<DEL>` wrappers.
- BREAKING CHANGE: Mark up structural elements (P, TABLE, DIV, etc) with modified attributes by adding the `vdd-modified` class to the affected elements, instead of outputting 2 elements with `vdd-added` and `vdd-removed` classes. Attribute changes on content elements (eg. IMG, IFRAME, SVG, etc) still output 2 elements with the `vdd-added` and `vdd-removed` classes. Formatting elements (eg STRONG, EM, etc) are unafected by this change.
- Fix invalid characters sometimes appearing in diff results.

# 0.5.2

- Avoid adding change markers at invalid locations.

# 0.5.1

- Fix identical document structure sometimes marked up as changed.

# 0.5.0

- Expose `VisualDomDiffOption` type for TypeScript projects.

# 0.4.0

- Add `skipModified` option.

# 0.3.0

- BREAKING CHANGE: The `compareNodes` option is no longer supported.
- Improve the diff output quality.

# 0.2.0

- BREAKING CHANGE: The `ignoreCase` option is no longer supported.
- Use the `diff-match-patch` instead of the `diff` module to improve performance.

# 0.1.3

- Stop using Browser globals to support running in node with jsdom.

# 0.1.2

- Support diffing documents.

# 0.1.1

- Add the `compareNodes` option.

# 0.1.0

- Initial release.
