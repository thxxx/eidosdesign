// renderer/Overlay.tsx
import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { END_SIGNAL, startChat } from '../lib/chat';

export default function Overlay() {
  const [rect, setRect] = useState<{
    x: number;
    y: number;
    w: number;
    h: number;
  } | null>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  const [isDoneSelecting, setIsDoneSelecting] = useState(false);
  const textRef = useRef(null);
  const [text, setText] = useState<string>('');
  const [lastResponse, setLastResponse] = useState<string>('');

  const [area, setArea] = useState<{
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  } | null>(null);

  useEffect(() => {
    if (textRef.current) textRef.current.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        window.close();
      }
      window.electron?.ipcRenderer.onResetArea(() => {
        setRect(null); // 네모 없애거나 초기화
        setArea(null); // 네모 없애거나 초기화
        setIsDoneSelecting(false);
        start.current = null;
      });
    };

    const onMouseDown = (e: MouseEvent) => {
      start.current = { x: e.clientX, y: e.clientY };
      setRect(null);
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!start.current) return;
      const x1 = start.current.x;
      const y1 = start.current.y;
      const x2 = e.clientX;
      const y2 = e.clientY;

      const x = Math.min(x1, x2);
      const y = Math.min(y1, y2);
      const w = Math.abs(x2 - x1);
      const h = Math.abs(y2 - y1);

      setRect({ x, y, w, h });
    };

    const onMouseUp = () => {
      if (rect) {
        window.electron?.ipcRenderer.sendMessage('ipc-example', {
          x1: rect.x,
          y1: rect.y,
          x2: rect.x + rect.w,
          y2: rect.y + rect.h,
        });

        setArea({
          x1: rect.x,
          y1: rect.y,
          x2: rect.x + rect.w,
          y2: rect.y + rect.h,
        });

        setIsDoneSelecting(true);

        window.removeEventListener('mousedown', onMouseDown);
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      }
      // window.close();
    };

    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [rect]);

  const tempSentence = useRef('');
  const onToken = (token: string) => {
    if (token === END_SIGNAL) return;

    tempSentence.current += token;
    setLastResponse(`${tempSentence.current}`);
  };

  const sendText = async () => {
    await startChat(text, onToken);
    setText('');
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
        cursor: isDoneSelecting ? 'auto' : 'crosshair',
        userSelect: 'none',
      }}
    >
      {rect && !area && (
        <div
          style={{
            position: 'absolute',
            border: '1px solid #AAAAAA99',
            backgroundColor: 'rgba(255,255,255,0.15)',
            left: rect.x,
            top: rect.y,
            width: rect.w,
            height: rect.h,
          }}
        />
      )}
      {area && (
        <div
          className="glass-shimmer"
          style={{
            position: 'absolute',
            border: '1px solid #AAAAAA99',
            backgroundColor: 'rgba(255,255,255,0.2)',
            left: area.x1,
            top: area.y1,
            width: area.x2 - area.x1,
            height: area.y2 - area.y1,
          }}
        />
      )}
      <ChatBox>
        <div>
          <div>Chat Histories</div>
          {lastResponse && <div>{lastResponse}</div>}
        </div>
        <ChatSendBox>
          <textarea
            rows={3}
            ref={textRef}
            value={text}
            onChange={(e) => setText(e.currentTarget.value)}
            placeholder="Enter to send, Escape to close."
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault(); // 줄바꿈 방지
                sendText();
              }
            }}
          />
        </ChatSendBox>
      </ChatBox>
    </div>
  );
}

const ChatBox = styled.div`
  display: flex;
  flex-direction: column;
  position: fixed;
  left: 0;
  bottom: 0;
  padding: 8px;
  width: 300px;
  background: rgba(255, 0, 0, 0.2);
`;

const ChatSendBox = styled.form`
  textarea {
    width: 100%;
  }
`;
