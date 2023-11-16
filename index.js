const { app, Tray, Menu, BrowserWindow, nativeImage, globalShortcut, ipcMain} = require('electron')

const settings = require('electron-settings')
const path = require('path')
const axios = require('axios')
const Sentry = require('@sentry/electron')

if (process.env.NODE_ENV !== 'development') {
  Sentry.init({
      dsn: 'https://cafe8add82bc452cae5a17bcd0939493@error.brth.uk/4',
  });
};

let tray = null
let isQuiting = false
let configWindow = null
let prevNumber = null

const loadConfig = async () => {
  return await settings.get()
}
const saveConfig = async (_, config) => {
  await settings.set(config)
}
const exitConfig = async () => {
  if (configWindow)
      configWindow.close()
}
const openConfig = () => {
  if (!configWindow) {
      configWindow = new BrowserWindow({
          width: 840,
          height: 560,
          autoHideMenuBar: true,
          title: 'Configuration',
          webPreferences: {
              preload: path.join(__dirname, 'scripts/config.preload.js'),
              sandbox: false
          },
          icon: nativeImage.createFromPath('assets/trayWin.png')
      })

      configWindow.on('close', (event) => {
          if (!isQuiting) {
              event.preventDefault()
              configWindow.hide()
          }
      })

      configWindow.loadFile('views/config.html')

      globalShortcut.register('CmdOrCtrl+D', () =>
          configWindow.webContents.openDevTools()
      )
  }
  else {
      configWindow.show()
  }
}
const exitApp = () => {
  app.quit()
}

const updateTrayTitle = async () => {
  try {
    const options = {
      headers: {
        'accept': 'application/json'
      }
    }
    const url = await settings.get('url')
    const headers = await settings.get('headers')
    let finalHeaders = null
      if (headers) {
        finalHeaders = headers.split(',').reduce((result, header) => {
          const [key, value] = header.split(':').map(item => item.trim());
          result[key] = value;
          return result;
        }, {});
      } else {
        finalHeaders = {}
      }
    const prefix = await settings.get('prefix')
    const multiplier = await settings.get('multiplier')
    const json = await settings.get('json')
    const length = await settings.get('length')

    let title = 'No Config'

    if (url) {
    const res = await axios.get(url, {
      headers: finalHeaders
    })
      .then((res) => {
        if (json) {
          const path = json.split('.');
          let value = res.data;
          for (let i = 0; i < path.length; i++) {
            value = value[path[i]];
          }
          if (multiplier) {
            value = value * multiplier
          }
          if (prefix) {
            title = prefix + value.toString();
          }
          if (length) {
            title = value.toString().substring(0, length)
          }
          else
          title = value.toString();
        }
        else
        {
          if (multiplier) {
            res.data = res.data * multiplier
          }
          if (prefix) {
            title = prefix + res.data.toString();
          }
          if (length) {
            title = res.data.toString().substring(0, length)
          }
          else
          title = res.data.toString()
        }
      })
      .catch(err => {
        console.error(err)
        Sentry.captureException(err)
      })
    }
    else return
    // console.log(new Date(), title, url, headers, finalHeaders, prefix, multiplier)
    tray.setTitle(title)
  }
  catch (err) {
    console.error(err)
    Sentry.captureException(err)
  }
}

app.whenReady().then(async () => {

  if (!settings.get()) {
    openConfig()
  }

  app.on('before-quit', () => {
      isQuiting = true
  })

  ipcMain.handle('config:save', saveConfig)
  ipcMain.handle('config:load', loadConfig)
  ipcMain.handle('config:exit', exitConfig)

  app.setAppUserModelId('HTTP Mac Menu')

  const contextMenu = Menu.buildFromTemplate([
      {
          label: 'Settings',
          type: 'normal',
          click: openConfig
      },
      {
          label: 'Quit',
          type: 'normal',
          click: exitApp
      }
  ])

  let icon = null
  let timer = await settings.get('timer')

  if (timer === undefined) {
    timer = 5000
  }

  if (process.platform === 'darwin') {
      icon = nativeImage.createEmpty()
      tray = new Tray(icon)
      app.dock.hide()
      tray.setTitle('No Config')
  }
  else {
      icon = nativeImage.createFromPath('assets/trayWin.png')
      tray = new Tray(icon)
      tray.setTitle('No Config')
  }

  tray.setContextMenu(contextMenu)
  tray.setToolTip('HTTP Mac Menu')
  tray.setTitle('HTTP Mac Menu')

  // Set the initial tray title
  updateTrayTitle()

  // Update the tray title every 5.1 seconds
  setInterval(() => {
    updateTrayTitle()
  }, timer)

})
