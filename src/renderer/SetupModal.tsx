/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import sb from '../lib/\bsupabase';

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
        <div className="topbar">
          <div>Set Context</div>
          <div onClick={() => window.close()}>X</div>
        </div>
        <div className="mid">
          <div className="left-cont">
            <div
              className="option"
              onClick={() => setSelected(SetOptions.CONTEXT)}
            >
              Context
            </div>
            <div
              className="option"
              onClick={() => setSelected(SetOptions.PERSONA)}
            >
              Persona
            </div>
            <div
              className="option"
              onClick={() => setSelected(SetOptions.REFERENCE)}
            >
              Reference
            </div>
          </div>
          <div className="right-cont">
            {selected === SetOptions.CONTEXT && (
              <div>
                <textarea
                  rows={5}
                  placeholder="context"
                  value={tempContext}
                  onChange={(e) => setTempContext(e.currentTarget.value)}
                />
              </div>
            )}
            {selected === SetOptions.PERSONA && (
              <div>
                <textarea
                  rows={5}
                  placeholder="persona"
                  value={tempPersona}
                  onChange={(e) => setTempPersona(e.currentTarget.value)}
                />
              </div>
            )}
            {selected === SetOptions.REFERENCE && <div></div>}
          </div>
        </div>
        <div className="bottom">
          <button onClick={() => window.close()}>Cancel</button>
          <button onClick={() => onSave()}>Confirm</button>
        </div>
      </SetupContainer>
    </SetupOuter>
  );
};

export default React.memo(SetupModal);

const SetupOuter = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  position: fixed;
  inset: 0;
  backgroundcolor: rgba(255, 0, 0, 0.4);
  user-select: none;
`;

const SetupContainer = styled.div`
  width: 400px;
  height: 300px;
  background: white;
  border-radius: 12px;
  padding: 8px;
  border: 1px solid gray;

  .topbar {
    display: flex;
    flex-direction: row;
    width: 100%;
    justify-content: space-between;
    height: 10%;
  }

  .mid {
    height: 80%;
    width: 100%;
    background: gray;
    display: flex;
    flex-direction: row;
    gap: 8px;

    .left-cont {
      width: 30%;
      display: flex;
      flex-direction: column;

      .option {
        cursor: pointer;
        border-radius: 8px;
        padding: 6px 8px;

        &:hover {
          background: rgba(0, 0, 0, 0.1);
        }
      }
    }
    .right-cont {
      width: 70%;

      div {
        width: 100%;
        textarea {
          width: 90%;
        }
      }
    }
  }

  .bottom {
    height: 10%;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: end;
  }
`;
