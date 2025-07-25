import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { useEffect, useState } from 'react';
import { v4 } from 'uuid';
import cmd from '../../assets/cmd.svg';
import person from '../../assets/person.svg';
import settings from '../../assets/settings.svg';

import './App.css';

export const glass = `
border-radius: 200px;
background: rgba(255, 255, 255, 0.5);
box-shadow:
  -1px -1px 1px rgba(0, 0, 0, 0.25),
  1px 1px 1px rgba(0, 0, 0, 0.25);
border: 1px solid rgba(255, 255, 255, 0.8);
`;

// 브라우저 로깅이 확인이 어려워서 백으로 보낸다음 거기서 로깅한다.
console.log = (st: string) => {
  window.electron?.ipcRenderer.sendMessage('ipc-example', st);
};

function Hello() {
  const [animateOut, setAnimateOut] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    let uid = localStorage.getItem('userId');
    console.log(`처음 유저 아이디 ${uid}`);

    if (!uid) {
      uid = v4();
      console.log(`저장 유저 아이디 ${uid}`);
      localStorage.setItem('userId', uid);
    }
  }, []);

  useEffect(() => {
    window.electron?.ipcRenderer.on('animate-in', () => {
      setAnimateOut(false);

      const uid = localStorage.getItem('userId');
      console.log(`현재 유저 아이디 ${uid}`);
    });

    window.electron?.ipcRenderer.on('animate-out', () => {
      setAnimateOut(true);
    });

    window.electron?.ipcRenderer.on('start-record', () => {
      setIsRecording(true);
    });

    window.electron?.ipcRenderer.on('end-record', () => {
      setIsRecording(false);
    });
  }, []);

  const openSetupModal = () => {
    console.log('test');
    window.electron?.openSetup();
  };

  return (
    <BaseContainer animateOut={animateOut}>
      {isRecording ? (
        <div className="item red">
          <div>Esc to cancel</div>
        </div>
      ) : (
        <div className="item blue">
          <div>Select Area</div>
          <span>
            <img width={14} src={cmd} alt="cmd" />
          </span>
          <span>L</span>
        </div>
      )}
      <div className="item">
        <div>Show/Hide</div>
        <span>
          <img width={14} src={cmd} alt="cmd" />
        </span>
        <span>]</span>
      </div>
      <div className="item" onClick={() => openSetupModal()}>
        <img width={20} src={person} alt="cmd" />
        <div>Personalization</div>
      </div>
      <div className="item icon">
        <img width={20} src={settings} alt="cmd" />
      </div>
    </BaseContainer>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Hello />} />
      </Routes>
    </Router>
  );
}

const slideFadeIn = keyframes`
  from {
    opacity: 0;
    transform: scale(0.5);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
`;

const slideFadeOut = keyframes`
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.5);
  }
`;

const BaseContainer = styled.div<{ animateOut: boolean }>`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: 4px;
  gap: 8px;
  font-size: 0.9em;
  animation: ${({ animateOut }) => (animateOut ? slideFadeOut : slideFadeIn)}
    0.3s ease forwards;

  ${glass}

  .item {
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    gap: 4px;
    padding: 6px 14px;
    align-self: stretch;
    cursor: pointer;

    ${glass}

    span {
      background: rgba(255, 255, 255, 0.6);
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      font-size: 14px;
      font-weight: 500;
      color: black;

      ${glass}
    }
  }

  .icon {
    padding: 6px;
    width: 24px;
  }

  .blue {
    background: #3f92db;
    color: white;
  }

  .red {
    background: #ff3b30;
    color: white;
  }
`;
