const { app, BrowserWindow, globalShortcut, Menu } = require('electron')
const windowManager = require('electron-window-manager')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win

function createWindow () {
  // Create the browser window.
  win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true
    }
  })

  // and load the index.html of the app.
  win.loadFile('index.html')

  // Open the DevTools.
  win.webContents.openDevTools()

  let contents = win.webContents

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null
  })

  // Shortcuts 
  globalShortcut.register('CommandOrControl+R', () => {
      win.reload()
  })


  // Create Menu  
  let menu = Menu.buildFromTemplate([
    {
      label: 'Main',
      submenu: [
        { label: 'Quit', click() {
          app.quit()
        }}
      ],
      label: 'Encoding',
      submenu: [
        { label: 'Set Defaults'  },
        { label: 'Add Encoding' } 
      ],
      label: 'Help',
      submenu: [
        { label: 'Launch Dev Tools', click() {
          win.webContents.openDevTools()
        }}
      ]
    }
  ])
  Menu.setApplicationMenu(menu)
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready',
 createWindow,
 windowManager.init({
   'layouts': {
     'default': 'index.html'
   }
 })
 )

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.


// Export Functions 
exports.handleForm = (targetWindow) => {
    console.log('hi there all')
    // console.log(submissionEvent)
    targetWindow.webContents.send('form-submitted', 'notification-recieved')
}