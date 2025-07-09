/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import sb from '../lib/\bsupabase';
import { glass } from './App';

enum SetOptions {
  CONTEXT = 'context',
  REFERENCE = 'reference',
  PERSONA = 'persona',
}

const SetupModal = () => {
  const [selected, setSelected] = useState<SetOptions>(SetOptions.CONTEXT);
  const [userId, setUserId] = useState<string>('');
  const [tempContext, setTempContext] = useState<string>('');
  const [tempPersona, setTempPersona] = useState<string>('');
  const [tempReference, setTempReference] = useState<string>('');

  const loadData = async (uid: String) => {
    const res = await sb.from('user_context').select('*').eq('user_id', uid);

    if (res.data) {
      setTempContext(res.data[0].context);
      setTempPersona(res.data[0].persona);
      setTempReference(res.data[0].reference);
    }
  };

  // const loadData = async () => {
  //   const context = localStorage.getItem('context');
  //   const persona = localStorage.getItem('persona');
  //   const reference = localStorage.getItem('reference');

  //   if (context) setTempContext(context);
  //   if (persona) setTempPersona(persona);
  //   if (reference) setTempReference(reference);
  // };

  useEffect(() => {
    // renderer에서는 zustand로 전역 상태 관리가 안된다... localStorage는 공유하는 듯
    const uid = localStorage.getItem('userid');

    if (uid) {
      if (uid) setUserId(uid);
      loadData(uid);
    }
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        window.close();
      }
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  const onSave = async () => {
    console.log(`userid - ${userId}`);
    if (!userId) return;
    console.log('Save');

    const body = {
      context: tempContext ?? '',
      persona: tempPersona ?? '',
      reference: tempReference ?? '',
      user_id: userId,
    };

    await sb.from('user_context').upsert(body, { onConflict: 'user_id' });

    window.close();
  };

  return (
    <SetupOuter>
      <SetupContainer>
        <div className="left-cont">
          <div className="cancel">
            <button onClick={() => window.close()}>Cancel</button>
          </div>
          <div
            className="option"
            onClick={() => setSelected(SetOptions.CONTEXT)}
          >
            Context
          </div>
          <div
            className="option"
            onClick={() => setSelected(SetOptions.REFERENCE)}
          >
            Reference
          </div>
        </div>
        <div className="right-cont">
          <div className="topbar">
            <p>Set Context</p>
            <button className="blue" onClick={() => onSave()}>
              Confirm
            </button>
          </div>
          {selected === SetOptions.CONTEXT && (
            <div className="form">
              <p>What's your role?</p>
              <textarea
                rows={1}
                placeholder="context"
                value={tempContext}
                onChange={(e) => setTempContext(e.currentTarget.value)}
              />
              <p>What is this project about?</p>
              <textarea
                rows={1}
                placeholder="context"
                value={tempContext}
                onChange={(e) => setTempContext(e.currentTarget.value)}
              />
              <p>Who is your target persona?</p>
              <textarea
                rows={3}
                className="rows"
                placeholder="context"
                value={tempContext}
                onChange={(e) => setTempContext(e.currentTarget.value)}
              />
              <p>What's your design concept and principles?</p>
              <textarea
                rows={3}
                placeholder="context"
                className="rows"
                value={tempContext}
                onChange={(e) => setTempContext(e.currentTarget.value)}
              />
              <p>How would you like feedback delivered?</p>
              <textarea
                rows={3}
                placeholder="context"
                className="rows"
                value={tempContext}
                onChange={(e) => setTempContext(e.currentTarget.value)}
              />
            </div>
          )}
          {selected === SetOptions.PERSONA && (
            <div>
              <textarea
                rows={1}
                placeholder="persona"
                value={tempPersona}
                onChange={(e) => setTempPersona(e.currentTarget.value)}
              />
            </div>
          )}
          {selected === SetOptions.REFERENCE && <div></div>}
        </div>
      </SetupContainer>
    </SetupOuter>
  );
};

export default React.memo(SetupModal);

const SetupOuter = styled.div`
  display: flex;
  align-items: center;
  justify-content: end;
  position: fixed;
  inset: 0;
  backgroundcolor: rgba(255, 0, 0, 0.4);
  user-select: none;
`;

const SetupContainer = styled.div`
  width: 580px;
  height: 580px;
  max-height: 80vh;
  padding: 8px;
  ${glass}
  border-radius: 8px;
  display: flex;
  flex-direction: row;
  gap: 16px;
  background: rgba(255, 255, 255, 0.8);

  .left-cont {
    width: 25%;
    display: flex;
    flex-direction: column;
    ${glass}
    border-radius:8px;
    padding: 8px;
    gap: 4px;

    .cancel {
      margin-bottom: 12px;
    }

    .option {
      cursor: pointer;
      ${glass}
      background: rgba(255,255,255,0.0);
      padding: 8px 12px;
      font-size: 0.9em;

      &:hover {
        background: rgba(255, 255, 255, 0.25);
      }
    }
  }

  .right-cont {
    width: 75%;
    display: flex;
    flex-direction: column;
    justify-content: start;
    align-items: start;

    .topbar {
      display: flex;
      flex-direction: row;
      width: 100%;
      justify-content: space-between;
      align-items: center;
      height: 10%;

      p {
        font-size: 1.1em;
        font-weight: 700;
        margin: 0px;
      }

      button {
        ${glass}
        background: #3f92db;
        font-size: 0.9em;
        padding: 8px 16px;
      }
    }

    .form {
      width: 100%;
      display: flex;
      flex-direction: column;
      font-family: Pretendard;
      padding-top: 8px;

      p {
        margin: 0px;
        font-size: 0.9em;
        font-weight: 600;
      }
      textarea {
        margin-bottom: 18px;
        margin-top: 12px;
        font-family: Pretendard;
        width: 90%;
        ${glass}
        align-items:center;
        display: flex;
        resize: none;
        padding: 8px 12px;
      }

      .rows {
        border-radius: 16px;
      }
    }
  }
`;
