import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import styled from 'styled-components';
import { useEffect } from 'react';
import { v4 } from 'uuid';
import cmd from '../../assets/cmd.svg';
import './App.css';

// 브라우저 로깅이 확인이 어려워서 백으로 보낸다음 거기서 로깅한다.
console.log = (st: string) => {
  window.electron?.ipcRenderer.sendMessage('ipc-example', st);
};

function Hello() {
  useEffect(() => {
    let uid = localStorage.getItem('userid');
    if (!uid) {
      uid = v4();
      localStorage.setItem('userid', uid);
    }
  }, []);

  const openSetupModal = () => {
    console.log('test');
    window.electron?.openSetup();
  };

  return (
    <BaseContainer>
      <div className="item">
        <div>Select Area</div>
        <span>
          <img width={18} src={cmd} alt="cmd" />
        </span>
        <span>L</span>
      </div>
      <div className="item">
        <div>Show/Hide</div>
        <span>
          <img width={18} src={cmd} alt="cmd" />
        </span>
        <span>]</span>
      </div>
      <div className="item">
        <button className="context" onClick={() => openSetupModal()}>
          set context
        </button>
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

const BaseContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: 4px 8px;
  gap: 8px;
  font-size: 0.9em;

  background: rgba(255, 255, 255, 0.6);
  border-radius: 8px;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);

  .item {
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    gap: 6px;

    span {
      background: rgba(255, 255, 255, 0.6);
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      font-size: 16px;
      font-weight: 700;
    }
  }

  .context {
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: green;
    height: 32px;
    border-radius: 4px;
    padding: 0px 8px;
    cursor: pointer;
  }
`;
