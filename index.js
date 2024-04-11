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
let settingsCache = {}
let configWindow = null
let prevNumber = null

const loadConfig = async () => {
  return await settings.get()
}
const saveConfig = async (_, config) => {
  await settings.set(config);
  settingsCache = { ...settingsCache, ...config }; // Update the cache
  configWindow.close();
};
const exitConfig = async () => {
  if (configWindow)
      configWindow.close()
}
const openConfig = () => {
  if (!configWindow) {
      configWindow = new BrowserWindow({
          width: 780,
          height: 680,
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
    const { url, headers, prefix, suffix, multiplier, json, length } = settingsCache;

    let finalHeaders = null;
    if (headers) {
      finalHeaders = headers.split(',').reduce((result, header) => {
        const [key, value] = header.split(':').map(item => item.trim());
        result[key] = value;
        return result;
      }, {});
    } else {
      finalHeaders = {};
    }

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
            value *= multiplier;
          }
          let stringValue = value.toString();
          if (prefix) {
            stringValue = prefix + stringValue;
          }
          if (suffix) {
            stringValue += suffix;
          }
          if (length) {
            stringValue = stringValue.substring(0, length);
          }
          title = stringValue;
        }
        else
        {
          let dataString = res.data.toString();
          if (multiplier) {
            dataString = (parseFloat(dataString) * multiplier).toString();
          }
          if (prefix) {
            dataString = prefix + dataString;
          }
          if (suffix) {
            dataString += suffix;
          }
          if (length) {
            dataString = dataString.substring(0, length);
          }
          title = dataString;
        }
      })
      .catch(err => {
        console.error(err)
        Sentry.captureException(err)
      })
    }
    else return
    tray.setTitle(title)
  }
  catch (err) {
    console.error(err)
    Sentry.captureException(err)
  }
}

let updateInterval = null;

const startUpdateInterval = async () => {
  if (updateInterval) {
    clearInterval(updateInterval);
  }

  let timer = await settings.get('timer');
  if (timer === undefined || timer === null || timer < 5000) {
    timer = 5000; // Default to 5000ms if the setting is invalid
  }

  updateInterval = setInterval(() => {
    updateTrayTitle();
  }, timer);
};

app.whenReady().then(async () => {

  if (!settings.get()) {
    openConfig()
  } else {
    settingsCache = await settings.get()
  }

  openConfig()

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

  if (timer === undefined || timer === null || timer < 5000) {
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
  tray.setToolTip('Loading...')
  tray.setTitle('Loading...')

  // Set the initial tray title
  updateTrayTitle()
  startUpdateInterval();

  // Update the tray title every 5.1 seconds
  setInterval(async () => {
    const currentTimer = await settings.get('timer');
    if (currentTimer !== undefined && currentTimer !== null && currentTimer >= 5000 && currentTimer !== timer) {
      startUpdateInterval(); // Restart the interval with the new timer value
    }
  }, 10000);

})
