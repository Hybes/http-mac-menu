const {
  app,
  Tray,
  Menu,
  BrowserWindow,
  nativeImage,
  ipcMain,
} = require('electron');

const path = require('path');
const fs = require('fs');
const settings = require('electron-settings');
const axios = require('axios');
const Sentry = require('@sentry/electron');

if (process.env.NODE_ENV !== 'development') {
  Sentry.init({
    dsn: 'https://cafe8add82bc452cae5a17bcd0939493@error.brth.uk/4',
  });
}

const appSupportPath = app.getPath('userData');
const logFilePath = path.join(appSupportPath, 'http-mac-menu.log');
let tray = null;
let isQuiting = false;
let settingsCache = {};
let configWindow = null;

let updateIntervals = {}; // Object to store intervals

let trayTitles = {}; // Object to store titles for each configuration

const clearLogFile = () => {
  fs.writeFileSync(logFilePath, ''); // Clear the log file
};

const checkAndCleanLogFile = () => {
  const stats = fs.statSync(logFilePath);
  const fileSizeInBytes = stats.size;
  const fileSizeInMegabytes = fileSizeInBytes / (1024 * 1024);
  if (fileSizeInMegabytes > 10) {
    clearLogFile(); // Clear the log file if it's larger than 10MB
  }
};

const loadConfig = async () => {
  return await settings.get();
};

const saveConfig = async (_, config) => {
  await settings.set(config);
  settingsCache = { ...settingsCache, ...config };
  configWindow.close();
};

const exitConfig = async () => {
  if (configWindow) configWindow.close();
};

const openConfig = (configNumber) => {
  configWindow = new BrowserWindow({
    width: 620,
    height: 820,
    autoHideMenuBar: true,
    title: `Configuration ${configNumber}`,
    webPreferences: {
      preload: path.join(__dirname, 'scripts/config.preload.js'),
      sandbox: false,
    },
    icon: nativeImage.createFromPath(
      path.join(__dirname, 'assets/trayWin.png')
    ),
  });

  configWindow.on('close', (event) => {
    if (!isQuiting) {
      event.preventDefault();
      configWindow.hide();
    } else {
      configWindow = null; // Nullify the window object when the app is quitting
    }
  });

  configWindow.loadFile(
    path.join(__dirname, `views/config${configNumber}.html`)
  );
};

const exitApp = () => {
  app.quit();
};

const updateTrayTitleForConfig = async (configNumber) => {
  try {
    let title = 'Invalid Data';
    // Access settings specifically for this configuration
    const {
      [`url${configNumber}`]: url,
      [`headers${configNumber}`]: headers,
      [`prefix${configNumber}`]: prefix,
      [`suffix${configNumber}`]: suffix,
      [`multiplier${configNumber}`]: multiplier,
      [`json${configNumber}`]: json,
      [`length${configNumber}`]: length,
    } = settingsCache;

    let finalHeaders = headers
      ? headers.split(',').reduce((result, header) => {
          const [key, value] = header.split(':').map((item) => item.trim());
          result[key] = value;
          return result;
        }, {})
      : {};

    if (url) {
      const res = await axios.get(url, { headers: finalHeaders });
      let dataString;
      if (json) {
        const path = json.split('.');
        let value = res.data;
        for (const p of path) {
          value = value[p];
        }
        value = multiplier
          ? (value * multiplier).toLocaleString()
          : value.toString();
        dataString = value;
      } else {
        dataString = res.data.toString();
        if (multiplier) {
          dataString = (parseFloat(dataString) * multiplier).toLocaleString();
        }
      }
      if (length) {
        dataString = dataString.substring(0, length);
      }
      if (prefix) {
        dataString = prefix + dataString;
      }
      if (suffix) {
        dataString += suffix;
      }
      title = dataString;

      // Log success with specific configuration reference
      const successTimestamp = new Date()
        .toISOString()
        .replace('T', ' ')
        .substring(0, 19);
      fs.appendFileSync(
        logFilePath,
        `${successTimestamp} - Success (Config ${configNumber}): ${JSON.stringify(res.data)}\n`
      );
      checkAndCleanLogFile();
    }

    trayTitles[configNumber] = title;
    return title;
  } catch (err) {
    console.error(err.toString());
    Sentry.captureException(err);
    // Log error with specific configuration reference
    const errorTimestamp = new Date()
      .toISOString()
      .replace('T', ' ')
      .substring(0, 19);
    fs.appendFileSync(
      logFilePath,
      `${errorTimestamp} - Error (Config ${configNumber}): ${err.toString()}\n`
    );
    checkAndCleanLogFile();
  }
};

const startConfigIntervals = async () => {
  const configs = [1, 2, 3]; // Adjust based on actual configurations
  configs.forEach((configNumber) => {
    startUpdateInterval(configNumber);
  });
};

const updateCombinedTrayTitle = () => {
  const configNumbers = [1, 2, 3]; // Adjust based on actual configurations
  const titles = configNumbers.map(
    (configNumber) => trayTitles[configNumber] || 'Loading...'
  );

  // Combine titles with a separator and update the tray title
  const combinedTitle = titles.join(' | ');
  tray.setTitle(combinedTitle);
};

const startUpdateInterval = async (configNumber) => {
  if (updateIntervals[configNumber]) {
    clearInterval(updateIntervals[configNumber]);
  }

  // Fetch the timer setting specific to the configuration
  let timer = await settings.get(`timer${configNumber}`);
  if (timer === undefined || timer === null || timer < 5000) {
    timer = 5000; // Default to 5000ms if the setting is invalid
  }

  // Set a new interval for this config
  updateIntervals[configNumber] = setInterval(async () => {
    await updateTrayTitleForConfig(configNumber);
    updateCombinedTrayTitle(); // Update the combined title after fetching the new title
  }, timer);
};

app.whenReady().then(async () => {
  clearLogFile(); // Clear the log file on startup

  const settingsResult = await settings.get();
  if (!settingsResult) {
    openConfig('1');
  } else {
    settingsCache = settingsResult;
  }

  app.on('before-quit', () => {
    isQuiting = true;
  });

  ipcMain.handle('config:save', saveConfig);
  ipcMain.handle('config:load', loadConfig);
  ipcMain.handle('config:exit', exitConfig);

  app.setAppUserModelId('HTTP Mac Menu');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Request 1',
      type: 'normal',
      click: () => openConfig('1'),
    },
    {
      label: 'Request 2',
      type: 'normal',
      click: () => openConfig('2'),
    },
    {
      label: 'Request 3',
      type: 'normal',
      click: () => openConfig('3'),
    },
    {
      label: 'Open Log',
      type: 'normal',
      click: () => {
        require('electron').shell.openPath(logFilePath);
      },
    },
    {
      label: 'Quit',
      type: 'normal',
      click: exitApp,
    },
  ]);

  let icon = null;
  let timer = await settings.get('timer');

  if (timer === undefined || timer === null || timer < 5000) {
    timer = 5000;
  }

  if (process.platform === 'darwin') {
    icon = nativeImage.createEmpty();
    tray = new Tray(icon);
    app.dock.hide();
    tray.setTitle('Invalid Platform');
  } else {
    icon = nativeImage.createFromPath('assets/trayWin.png');
    tray = new Tray(icon);
    tray.setTitle('Loading...');
  }

  tray.setContextMenu(contextMenu);
  tray.setToolTip('Loading...');
  tray.setTitle('Loading...');

  await updateTrayTitleForConfig(1);
  await updateTrayTitleForConfig(2);
  await updateTrayTitleForConfig(3);

  updateCombinedTrayTitle();

  await startConfigIntervals();
});
