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
const inputEnc = document.getElementById('inputEnc') 
const outputEnc = document.getElementById('outputEnc') 


// request menu state 
ipcRenderer.send('requestMenuState')
ipcRenderer.on('MenuStateRecieved', (e, args) => {
    console.log(args)
})

// Add event listener to the checkbox to perform relevent form alterations
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
        CsvService.transmuteText(text)
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

    }
}
