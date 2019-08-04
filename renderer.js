const { ipcRenderer } = require('electron') 
const remote = require('electron').remote
const { handleForm, getMenuState } = remote.require('./main') 
const currentWindow = remote.getCurrentWindow() 



const Form = document.querySelector('.input-container') 

// form input values
const textOnlyCheckbox = document.getElementById('checkbox')
const textOnlyText =  () => { 
    return document.getElementById('textOnlyText').value
}

const inputFile = document.getElementById('inputFile') 

// request menu state 
ipcRenderer.send('requestMenuState')
ipcRenderer.on('MenuStateRecieved', (e, args) => {
    console.log(args)
})

// Add event listener to the checkbox to perform relevent form alterations
// document.getElementById('textOnlyText').disabled = true
textOnlyCheckbox.addEventListener('change', () => {
    if (textOnlyCheckbox.checked == true) {
        document.getElementById('textOnlyText').disabled = false
        document.getElementById('inputFileDiv').style.opacity = 0.4
        document.getElementById('inputFile').disabled = true
        return
    }
    document.getElementById('textOnlyText').disabled = true
    document.getElementById('inputFileDiv').style.opacity = 1.0
    document.getElementById('inputFile').disabled = false
})

handleFormSubmit = () => {
    try {
        console.log('hi')
        handleForm(currentWindow)
    } catch (err) {
        console.error(err)
    }
}

// handle pasting of data into text-input 
handlePaste = (e) => {
    const text = navigator.clipboard.readText()
        .then(
            text => e.target.value = text
        )
}

// function for pasing the decoded text back to the window  
pinToFront = (string) => {
    document.getElementById('clipboard').innerText = string 

    let btn = document.createElement('button') 
    btn.className = 'btn btn-primary' 
    btn.innerText = 'copy to clipboard'
    btn.onclick = (e) => {
        let t = document.createElement('textarea') 
        t.value = document.getElementById('clipboard').innerText
        document.querySelector('body').appendChild(t)

        if (window.getSelection()) {
            if (window.getSelection.empty) window.getSelection.empty()
            else if (window.getSelection().removeAllRanges) window.getSelection().removeAllRanges() 
        } else if (document.selection) {
            document.selection.empty()
        }


        t.select() 
        let copiedText = document.execCommand('copy')
        document.querySelector('body').removeChild(t)
    }

    document.getElementById('appendCopyButton').appendChild(btn)
}

//Setup Menu State 
ipcRenderer.on('MenuStateSent', (e, args) => {
    // set selection menu of input and output encoding form inputs
    console.log('setting up menu state!')
    console.log('args: ' + args)

})

ipcRenderer.on('form-submitted', (e, args) => {
    console.log(e)
    console.log('back at renderer process')
    console.log(Form.childNodes)

    if (textOnlyCheckbox.checked) {
        let text = textOnlyText()
        let string = CsvService.transmuteText(text)
        console.log('string: ' + string)
        pinToFront(string)
    } else {
        inputGroups = {}

        Form.childNodes.forEach(node => {
            if (node.classList != undefined) {
                let input = node.childNodes.item(3)
                if (input == null) {
                    return;
                }
                if (input.className != null) {
                    if (input.className == 'custom-file') {
                        input = input.childNodes.item(1)
                        const key = input.id 
                        inputGroups[key] = input
                    } else {
                        const key = input.id
                        input.childNodes.forEach( childNode => {
                            if (childNode.tagName = 'OPTION') {
                                console.log('childNode: ' + childNode.innerText)
                                if (childNode.selected) {
                                    let value = childNode.innerText
                                    inputGroups[key] = value
                                }
                            }
                        })
                    }
                } 
            }
        })
        CsvService.transmuteFile(inputGroups)
    }
})
// EXTERNAL LIBRARIES 
// module: papaparse { required for reading and 
//                     manipulating csv data }
const Papa = require('papaparse')

// module: iconv-lite { required for encoding a decodeing 
//                         csv string data }
var Iconv = require('iconv-lite')

// module: file-saver { required for the final stage of 
//                      createing the new file }
const FileSaver = require('file-saver')

class CsvService {
    
    // send csv file data to pyhton script and return either success or 
    // error message
    static transmuteFile(inputGroups) {
        const file = inputGroups.inputFile.files[0]
        const inputEncoding = inputGroups.inputEnc
        const outputEnc = inputGroups.outputEnc
        const outputDir = inputGroups.outputDir

        let filename = file.name.split('.') 
        filename = filename[0] + '_fixed.csv'

        let rowStrings = []
        Papa.parse(file, {
            step: (row) => {
                let buf = Iconv.encode(row.data, inputEncoding)
                let string = Iconv.decode(buf, outputEnc)
                console.log(string.split(','))
                rowStrings.push(string.split(','))
            },
            complete: () => {
                var csv = Papa.unparse(rowStrings)
                let newFile = new Blob([csv], {type: 'text/csv'})
                FileSaver.saveAs(newFile, filename)
            }
        })
    }

    static transmuteText(text) {
        let inputEnc 
        let outputEnc
        document.getElementById('inputEnc').childNodes.forEach(node => {
            if (node.selected) inputEnc = node.innerText
        })
        document.getElementById('outputEnc').childNodes.forEach(node => {
            if (node.selected) outputEnc = node.innerText
        })
        
        console.log('inputEnc: ' + inputEnc)

        let buf = Iconv.encode(text, inputEnc) 
        let string = Iconv.decode(buf, outputEnc)
        return string
    }
}
