import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import cmd from '../../assets/cmd.svg';
import './App.css';
import styled from 'styled-components';

function Hello() {
  return (
    <BaseContainer>
      <div className="item">
        <div>Select Area</div>
        <span>
          <img width={22} src={cmd} alt="cmd" />
        </span>
        <span>L</span>
      </div>
      <div className="item">
        <div>Show/Hide</div>
        <span>
          <img width={22} src={cmd} alt="cmd" />
        </span>
        <span>]</span>
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
  padding: 8px;
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
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      font-size: 16px;
      font-weight: 700;
    }
  }
`;
