'use server';

/**
 * @fileOverview An AI agent to generate summaries of uploaded documents.
 *
 * - generateDocumentSummary - A function that handles the document summarization process.
 * - GenerateDocumentSummaryInput - The input type for the generateDocumentSummary function.
 * - GenerateDocumentSummaryOutput - The return type for the generateDocumentSummary function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateDocumentSummaryInputSchema = z.object({
  documentText: z
    .string()
    .describe('The text content of the document to be summarized.'),
});
export type GenerateDocumentSummaryInput = z.infer<
  typeof GenerateDocumentSummaryInputSchema
>;

const GenerateDocumentSummaryOutputSchema = z.object({
  summary: z
    .string()
    .describe('A concise summary of the document content.'),
});
export type GenerateDocumentSummaryOutput = z.infer<
  typeof GenerateDocumentSummaryOutputSchema
>;

export async function generateDocumentSummary(
  input: GenerateDocumentSummaryInput
): Promise<GenerateDocumentSummaryOutput> {
  return generateDocumentSummaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateDocumentSummaryPrompt',
  input: {schema: GenerateDocumentSummaryInputSchema},
  output: {schema: GenerateDocumentSummaryOutputSchema},
  prompt: `You are an AI assistant tasked with summarizing documents.
  Please provide a concise and informative summary of the following document:
  \n\n  {{{documentText}}}
  \n\n  Summary:`,
});

const generateDocumentSummaryFlow = ai.defineFlow(
  {
    name: 'generateDocumentSummaryFlow',
    inputSchema: GenerateDocumentSummaryInputSchema,
    outputSchema: GenerateDocumentSummaryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
