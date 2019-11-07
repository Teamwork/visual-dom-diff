const benchmark = require('benchmark')
const fs = require('fs')
const jsdom = require('jsdom')
const path = require('path')
const diff = require('../lib/diff')

const oldPath = path.join(__dirname, 'old.html')
const newPath = path.join(__dirname, 'new.html')
const oldHtml = fs.readFileSync(oldPath, 'utf8')
const newHtml = fs.readFileSync(newPath, 'utf8')
const oldNode = new jsdom.JSDOM(oldHtml).window.document.body
const newNode = new jsdom.JSDOM(newHtml).window.document.body

const suite = new benchmark.Suite()
suite.add('diff', () => {
    diff.visualDomDiff(oldNode, newNode)
})
suite.on('cycle', function(event) {
    console.log(String(event.target))
})
suite.run({ async: true })
