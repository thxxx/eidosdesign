/* eslint-disable react/button-has-type */
import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { chatVision, END_SIGNAL } from '../lib/chat';

// 브라우저 로깅이 확인이 어려워서 백으로 보낸다음 거기서 로깅한다.
console.log = (st: string) => {
  window.electron?.ipcRenderer.sendMessage('ipc-example', st);
};

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
  const [histories, setHistories] = useState<
    {
      type: 'user' | 'assistant';

      content: string;
    }[]
  >([]);
  const [area, setArea] = useState<{
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  } | null>(null);
  const [capturedURL, setCapturedURL] = useState<string | null>(null);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [isTakingScreen, setIsTakingScreen] = useState(false);

  const takeScreenshot = async (selected: boolean) => {
    const { buffer: pngBuffer, base64: base64String } =
      await window.electron?.sendCoords(rect);
    const blob = new Blob([pngBuffer], { type: 'image/png' });

    if (selected && rect) {
      const dataUrl = `data:image/png;base64,${base64String}`;
      setImageDataUrl(dataUrl);

      const bitmap = await createImageBitmap(blob);

      // 3) Canvas로 크롭
      const canvas = document.createElement('canvas');
      canvas.width = rect.w;
      canvas.height = rect.h;

      // 일반적으로 받는 픽셀 좌표는 디바이스에 따른 크기 비율에 영향을 받음
      const scaleX = bitmap.width / window.innerWidth;
      const scaleY = bitmap.height / window.innerHeight;

      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(
        bitmap,
        Math.round(rect.x * scaleX) * 1.0,
        Math.round(rect.y * scaleY) + 50,
        Math.round(rect.w * scaleX) * 1.01,
        Math.round(rect.h * scaleY),
        0,
        0,
        rect.w,
        rect.h,
      );

      // 4) Blob → ArrayBuffer → 저장 요청
      canvas.toBlob(async (croppedBlob) => {
        if (!croppedBlob) return;
        // const ab = await croppedBlob.arrayBuffer();
        const url = URL.createObjectURL(croppedBlob);
        setCapturedURL(url);
      }, 'image/png');
    } else {
      // 2. base64 인코딩
      const dataUrl = `data:image/png;base64,${base64String}`;
      setImageDataUrl(dataUrl);
    }
  };

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

    const onMouseUp = async () => {
      setIsTakingScreen(true);
      if (rect) {
        console.log(rect.w, rect.h);
        // 너무 작게 지정하면 취소(실수로 클릭만 했을 가능성 높음)
        if (rect.w + rect.h < 20) {
          setIsTakingScreen(false);

          return;
        }

        setArea({
          x1: rect.x,
          y1: rect.y,
          x2: rect.x + rect.w,
          y2: rect.y + rect.h,
        });

        await takeScreenshot(true);

        setIsDoneSelecting(true);

        window.removeEventListener('mousedown', onMouseDown);
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      }

      setIsTakingScreen(false);
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
    if (token === END_SIGNAL) {
      return;
    }

    tempSentence.current += token;

    setLastResponse(`${tempSentence.current}`);
  };

  /**
   * 만약 영역을 지정하지 않고 보냈다면, 전체 스크린을 기준으로.
   */
  const sendText = async (input: string) => {
    if (!input) return;
    if (!isDoneSelecting) {
      takeScreenshot(false);
    }

    setText('');

    if (!lastResponse) {
      setHistories([
        ...histories,
        {
          type: 'user',
          content: input,
        },
      ]);
    } else {
      setHistories([
        ...histories,
        {
          type: 'assistant',
          content: lastResponse,
        },
        {
          type: 'user',
          content: input,
        },
      ]);
    }
    tempSentence.current = '';
    setLastResponse('');

    console.log(imageDataUrl?.slice(0, 30));

    if (imageDataUrl) {
      await chatVision(input, imageDataUrl, onToken);
    } else {
      console.log('Error!');
    }
  };
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        // backgroundColor: 'rgba(0, 0, 0, 0.1)',
        cursor: isDoneSelecting ? 'auto' : `crosshair`,
        userSelect: 'none',
        border: '1px solid green',
      }}
    >
      {/* Display when dragging */}
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
          style={{
            position: 'absolute',
            border: '1px solid #AAAAAA99',
            backgroundColor: isTakingScreen
              ? 'rgba(0,0,0,0)'
              : 'rgba(255,255,255,0.0)',
            left: area.x1,
            top: area.y1,
            width: area.x2 - area.x1,
            height: area.y2 - area.y1,
          }}
        />
      )}

      {area && !isTakingScreen && isDoneSelecting && (
        <DefaultActions
          style={{
            left: area.x1,
            top: area.y2 + 6,
            width: area.x2 - area.x1,
          }}
        >
          <button className="btn" onClick={() => sendText('Persona Feedback')}>
            Persona Feedback
          </button>

          <button
            className="btn"
            onClick={() => sendText('What do you think about this design?')}
          >
            What do you think about this design?
          </button>

          <button className="btn" onClick={() => sendText('Draw me options')}>
            Draw me options
          </button>
        </DefaultActions>
      )}

      <ChatBox>
        <div>
          <div>Chat Histories</div>
          {capturedURL && <img src={capturedURL} width={200} alt="ew" />}
          {histories && (
            <Chattings>
              {histories.map((item) => {
                if (item.type === 'assistant') {
                  return (
                    <div className="oneline assistant">{item.content}</div>
                  );
                }

                if (item.type === 'user') {
                  return <div className="oneline user">{item.content}</div>;
                }
              })}
            </Chattings>
          )}

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

                sendText(text);
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
  background: rgba(255, 0, 0, 0.5);

  .oneline {
    margin: 4px 0px;
  }
`;

const Chattings = styled.div`
  display: flex;
  flex-direction: column;

  .oneline {
    margin: 2px;
  }

  .assistant {
    background: green;
  }

  .user {
    background: blue;
  }
`;

const ChatSendBox = styled.div`
  textarea {
    width: 100%;
  }
`;

const DefaultActions = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: start;
  align-items: end;
  width: 100%;
  position: absolute;
  gap: 1px;
  margin: 4px;

  .btn {
    display: inline-block;
    border: 1px solid black;
    border-radius: 4px;
    padding: 4px 8px;
    background: rgba(255, 255, 255, 0.8);
    cursor: pointer;
    font-size: 1em;
    opacity: 0;
    transform: translateY(-10px);
    animation: slideIn 0.3s forwards;
  }

  .btn:nth-child(1) {
    animation-delay: 0s;
  }

  .btn:nth-child(2) {
    animation-delay: 0.05s;
  }

  .btn:nth-child(3) {
    animation-delay: 0.1s;
  }

  @keyframes slideIn {
    to {
      opacity: 1;

      transform: translateY(0);
    }
  }
`;
