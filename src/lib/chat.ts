/* eslint-disable no-restricted-syntax */
import { client, OpenAIResponse, type OnToken } from './openai';

export const END_SIGNAL = '<END:DONE>';

export const startChat = async (prompted: string, onToken: OnToken) => {
  const stream = await client.responses.create({
    model: 'gpt-4o-mini',
    input: [
      {
        role: 'system',
        content:
          'You are a helpful assistant. And a football expert game engine.',
      },
      {
        role: 'user',
        content: prompted,
      },
    ],
    stream: true,
  });

  for await (const event of stream) {
    if (event.type === OpenAIResponse.DELTA) {
      const token = event.delta;
      if (token) {
        onToken(token);
      }
    } else if (event.type === OpenAIResponse.DONE) {
      onToken(END_SIGNAL);
    }
  }
};

export const makePrompt = () => {
  return ``;
};
