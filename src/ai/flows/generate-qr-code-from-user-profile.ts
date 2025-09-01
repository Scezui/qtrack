'use server';
/**
 * @fileOverview Generates a QR code from user profile data.
 *
 * - generateQrCode - A function that generates a QR code from user profile data.
 * - GenerateQrCodeInput - The input type for the generateQrCode function.
 * - GenerateQrCodeOutput - The return type for the generateQrCode function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import QRCode from 'qrcode';
import * as admin from 'firebase-admin';

const GenerateQrCodeInputSchema = z.object({
  userProfile: z
    .string()
    .describe('The user profile data to encode in the QR code.'),
});
export type GenerateQrCodeInput = z.infer<typeof GenerateQrCodeInputSchema>;

const GenerateQrCodeOutputSchema = z.object({
  qrCodeDataUri: z
    .string()
    .describe(
      'The QR code as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.'
    ),
});
export type GenerateQrCodeOutput = z.infer<typeof GenerateQrCodeOutputSchema>;

export async function generateQrCode(input: GenerateQrCodeInput): Promise<GenerateQrCodeOutput> {
  return generateQrCodeFlow(input);
}

const generateQrCodeFlow = ai.defineFlow(
  {
    name: 'generateQrCodeFlow',
    inputSchema: GenerateQrCodeInputSchema,
    outputSchema: GenerateQrCodeOutputSchema,
  },
  async input => {
    let qrCodeDataUri: string;
    if (typeof window === 'undefined') {
      // Server-side rendering
      const {getApps, initializeApp} = await import('firebase-admin/app');
      if (getApps().length === 0) {
        initializeApp();
      }
      qrCodeDataUri = await QRCode.toDataURL(input.userProfile, { width: 512 });
    } else {
      // Client-side rendering
      qrCodeDataUri = await QRCode.toDataURL(input.userProfile, { width: 512 });
    }
    return { qrCodeDataUri };
  }
);
