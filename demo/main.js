import 'core-js/stable'
import 'regenerator-runtime/runtime'
import { visualDomDiff } from '../lib'
import './main.css'

window.addEventListener('load', function() {
    const input1Html = document.getElementById('input1-html')
    const input1 = document.getElementById('input1')
    const input2Html = document.getElementById('input2-html')
    const input2 = document.getElementById('input2')
    const outputHtml = document.getElementById('output-html')
    const output = document.getElementById('output')
    const updateInput1 = function() {
        input1.firstChild.innerHTML = input1Html.value
    }
    const updateInput2 = function() {
        input2.firstChild.innerHTML = input2Html.value
    }
    const updateDiff = function() {
        output.innerHTML = ''
        output.appendChild(visualDomDiff(input1.firstChild, input2.firstChild))
        outputHtml.value = output.innerHTML
    }

    input1Html.addEventListener('input', function() {
        updateInput1()
        updateDiff()
    })
    input2Html.addEventListener('input', function() {
        updateInput2()
        updateDiff()
    })
    updateInput1()
    updateInput2()
    updateDiff()
})
