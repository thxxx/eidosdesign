import { createRoot } from 'react-dom/client';
import App from './App';
import Overlay from './Overlay';
import './App.css';

const searchParams = new URLSearchParams(window.location.search);
const isOverlay = searchParams.get('overlay') === '1';

const container = document.getElementById('root') as HTMLElement;
const root = createRoot(container);
root.render(isOverlay ? <Overlay /> : <App />);

// calling IPC exposed from preload script
window.electron?.ipcRenderer.once('ipc-example', (arg) => {
  // eslint-disable-next-line no-console
  console.log(arg);
});
window.electron?.ipcRenderer.sendMessage('ipc-example', ['ping', isOverlay]);
