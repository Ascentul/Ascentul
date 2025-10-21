/**
 * Phase 7 - Part A: Type Verification Script
 * Quick smoke test to verify types compile correctly
 */

import type {
  AISuggestion,
  StreamChunk,
  StreamStatus,
  StreamSuggestionsRequest,
  ApplySuggestionRequest,
  ApplySuggestionResponse,
} from '../src/lib/ai/streaming/types';

// Test suggestion type
const testSuggestion: AISuggestion = {
  id: 'sug-1',
  actionType: 'rewrite_bullet',
  severity: 'warning',
  message: 'Strengthen action verb',
  blockId: 'block-1',
  itemIndex: 0,
  proposedContent: 'Led a team of 5 engineers to deliver...',
  confidence: 0.95,
};

// Test stream chunk types
const metadataChunk: StreamChunk = {
  type: 'metadata',
  timestamp: Date.now(),
  data: {
    model: 'gpt-5',
    totalSuggestions: 5,
    analyzedBlocks: 3,
  },
};

const suggestionChunk: StreamChunk = {
  type: 'suggestion',
  timestamp: Date.now(),
  data: testSuggestion,
};

const errorChunk: StreamChunk = {
  type: 'error',
  timestamp: Date.now(),
  data: {
    code: 'OPENAI_ERROR',
    message: 'Failed to generate suggestions',
  },
};

const doneChunk: StreamChunk = {
  type: 'done',
  timestamp: Date.now(),
  data: {
    totalSuggestions: 3,
    durationMs: 2500,
  },
};

// Test stream status
const streamStatus: StreamStatus = {
  state: 'streaming',
  suggestions: [testSuggestion],
  metadata: {
    model: 'gpt-5',
    analyzedBlocks: 3,
  },
};

// Test request types
const streamRequest: StreamSuggestionsRequest = {
  resumeId: 'k123...',
  blockIds: ['block-1', 'block-2'],
  targetRole: 'Senior Engineer',
  targetCompany: 'TechCorp',
};

const applyRequest: ApplySuggestionRequest = {
  resumeId: 'k123...',
  suggestion: testSuggestion,
  editedContent: 'User-edited content',
};

const applyResponse: ApplySuggestionResponse = {
  success: true,
  updatedBlock: {
    type: 'experience',
    data: {},
    title: 'Experience',
  },
  historyEntryId: 'ai-apply-123',
};

console.log('✅ All Phase 7 types compile successfully!');
console.log('Sample suggestion:', testSuggestion);
console.log('Sample chunk:', suggestionChunk);
console.log('Sample status:', streamStatus);
