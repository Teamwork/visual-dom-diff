const benchmark_1 = require("benchmark");
const diff_match_patch_1 = require("diff-match-patch");
const jsdom_1 = require("jsdom");
const diff_1 = require("../lib/diff");
function htmlToFragment(html) {
    const template = new jsdom_1.JSDOM('Hello').window.document.createElement('template');
    template.innerHTML = html;
    return template.content;
}
const suite = new benchmark_1.Suite();
const sampleData = [
    [
        'same structure but different nodes',
        htmlToFragment('Prefix <ul><li>Test</li></ul> Suffix'),
        htmlToFragment('Prefix <ol><li>Test</li></ol> Suffix'),
        undefined,
    ],
    [
        'formatting added',
        htmlToFragment('Prefix StrongEm Suffix'),
        htmlToFragment('Prefix <strong>Strong</strong><em>Em</em> Suffix'),
        undefined,
    ],
    [
        'custom diffText option',
        htmlToFragment('one two'),
        htmlToFragment('one two three'),
        {
            diffText: (oldText, newText) => {
                const diff = [];
                if (oldText) {
                    diff.push([diff_match_patch_1.DIFF_DELETE, oldText]);
                }
                if (newText) {
                    diff.push([diff_match_patch_1.DIFF_INSERT, newText]);
                }
                return diff;
            },
        },
    ]
];
sampleData.forEach(sample => {
    suite.add(sample[0], () => {
        diff_1.visualDomDiff(sample[1], sample[2], sample[3]);
    });
});
suite.on('cycle', function (event) {
    console.log(String(event.target));
});
suite.run({ 'async': true });
