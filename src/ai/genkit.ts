import {genkit, GenerationCommon} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import * as admin from 'firebase-admin';

if (admin.apps.length === 0) {
  admin.initializeApp();
}

export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.5-flash',
});
