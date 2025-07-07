/* eslint-disable object-shorthand */
/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import {
  app,
  BrowserWindow,
  shell,
  ipcMain,
  screen,
  globalShortcut,
  desktopCapturer,
} from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';

const { writeFile } = require('fs/promises');

ipcMain.on('open-permissions', () => {
  shell.openExternal(
    'x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenRecording',
  );
});
class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;
let overlayWindow: BrowserWindow | null = null;
let setupWindow: BrowserWindow | null = null;

ipcMain.on('ipc-example', async (event, arg) => {
  const msgTemplate = (pingPong: string) => `IPC test: ${pingPong}`;
  console.log(msgTemplate(arg));
  // event.reply('ipc-example', msgTemplate('pong'));
});

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

// if (isDebug) {
//   require('electron-debug').default(); // dev tools 열기
// }

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload,
    )
    .catch(console.log);
};

const RESOURCES_PATH = app.isPackaged
  ? path.join(process.resourcesPath, 'assets')
  : path.join(__dirname, '../../assets');

/**
 *
 * @param paths  name or path in assets, just like "icon.png"
 * @returns relative path that can be used for asset path
 */
const getAssetPath = (...paths: string[]): string => {
  return path.join(RESOURCES_PATH, ...paths);
};

const startWindow = async () => {
  // if (isDebug) await installExtensions();

  const { width: screenWidth, height: screenHeight } =
    screen.getPrimaryDisplay().workAreaSize;

  const width = 420;
  const height = 72;

  mainWindow = new BrowserWindow({
    width: width,
    height: height,
    x: screenWidth / 2 - width / 2,
    y: 10,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    hasShadow: false,
    webPreferences: {
      preload: app.isPackaged // preload 스크립트는 renderer에 안전한 API를 전달하기 위한 브릿지
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
  });

  mainWindow.loadURL(resolveHtmlPath('index.html'));
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null; // 창이 닫히면 변수 초기화 -> garbage collector 유도
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

const createWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  mainWindow = new BrowserWindow({
    show: false, // 내용이 로드될 때 까지 창을 안보이게 한다!
    width: 1024,
    height: 728,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: app.isPackaged // preload 스크립트는 renderer에 안전한 API를 전달하기 위한 브릿지
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
  });

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null; // 창이 닫히면 변수 초기화 -> garbage collector 유도
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

async function openOverlayWindow() {
  const { width, height } = screen.getPrimaryDisplay().bounds;

  overlayWindow = new BrowserWindow({
    width: width,
    height: height - 30,
    x: 0,
    y: 0,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    hasShadow: false,
    focusable: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  overlayWindow.loadURL('http://localhost:1212/index.html?overlay=1');
  overlayWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  overlayWindow.on('closed', () => {
    overlayWindow = null; // 창이 닫히면 변수 초기화 -> garbage collector 유도
  });
}

async function openSetupWindow() {
  const { width, height } = screen.getPrimaryDisplay().bounds;

  setupWindow = new BrowserWindow({
    width: width,
    height: height - 30,
    x: 0,
    y: 0,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    hasShadow: false,
    focusable: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  setupWindow.loadURL('http://localhost:1212/index.html?setup=1');
  setupWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  setupWindow.on('closed', () => {
    setupWindow = null; // 창이 닫히면 변수 초기화 -> garbage collector 유도
  });
}

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app
  .whenReady()
  .then(() => {
    startWindow();

    // Cmd + ] : 앱을 열었다 닫았다
    globalShortcut.register('CommandOrControl+]', () => {
      if (mainWindow) {
        if (mainWindow.isVisible()) {
          mainWindow.hide();
        } else {
          mainWindow.show();
          // mainWindow.focus();
        }
        // mainWindow.webContents.send('shortcut-pressed'); // renderer에 이벤트 전달
      }
      if (setupWindow) {
        setupWindow.close();
      }
      if (overlayWindow) {
        overlayWindow.close();
      }
    });

    globalShortcut.register('CommandOrControl+L', () => {
      console.log('영역 지정');
      if (overlayWindow === null) openOverlayWindow();
      if (overlayWindow !== null) {
        overlayWindow.webContents.send('reset-area');
      }
    });

    ipcMain.handle('capture-region', async (event) => {
      const disp = screen.getPrimaryDisplay();
      const dipW = disp.size.width;
      const dipH = disp.size.height;
      const sf = disp.scaleFactor;
      const sources = await desktopCapturer.getSources({
        types: ['screen'],
        thumbnailSize: {
          width: Math.round(dipW * sf),
          height: Math.round(dipH * sf),
        },
      });
      // Buffer(PNG) 리턴
      return {
        buffer: sources[0].thumbnail.toPNG(),
        base64: sources[0].thumbnail.toPNG().toString('base64'),
      };
    });

    ipcMain.handle('open-setup', async () => {
      openSetupWindow();
    });
  })
  .catch(console.log);

// app
//   .whenReady()
//   .then(() => {
//     createWindow();
//     app.on('activate', () => {
//       // On macOS it's common to re-create a window in the app when the
//       // dock icon is clicked and there are no other windows open.
//       if (mainWindow === null) startWindow();
//     });
//   })
//   .catch(console.log);
