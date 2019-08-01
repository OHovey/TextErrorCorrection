const { remote, ipcRenderer } = require('electron') 
const { handleForm } = remote.require('./main') 
const currentWindow = remote.getCurrentWindow() 

const Form = document.querySelector('.input-container') 

// form input values
const inputFile = document.getElementById('inputFile') 
const inputEnc = document.getElementById('inputEnc') 
const outputEnc = document.getElementById('outputEnc') 
const outputDir = document.getElementById('outputDir')

handleFormSubmit = () => {
    try {
        handleForm(currentWindow)
    } catch (err) {
        console.error(err)
    }
}

ipcRenderer.on('form-submitted', (e, args) => {
    console.log(e)
    console.log('back at renderer process')
    
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

    CsvService.transmute(inputGroups)

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
    
    static transmute(inputGroups) {
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
}
