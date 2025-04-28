import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mic, AlertCircle, Play, Square, Volume2, Settings, Bug } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VoiceDiagnostics } from '@/components/voice-diagnostics';
import { logVoiceEvent } from '@/lib/voice-debug';

// Type definition for job applications
interface JobApplication {
  id: number | string;
  title?: string;
  jobTitle?: string;
  position?: string;
  company?: string;
  companyName?: string;
  description?: string;
  jobDescription?: string;
  status?: string;
}

// Type definition for conversation messages
interface ConversationMessage {
  role: 'assistant' | 'user';
  content: string;
  timestamp: Date;
}

export default function VoicePractice() {
  // Get toast utility
  const { toast } = useToast();
  
  // State for application selection
  const [selectedApplication, setSelectedApplication] = useState<string>('');
  const [selectedJobDetails, setSelectedJobDetails] = useState<{
    title: string;
    company: string;
    description: string;
  } | null>(null);

  // State for interview session
  const [isInterviewActive, setIsInterviewActive] = useState(false);
  const [status, setStatus] = useState('idle'); // 'idle', 'listening', 'thinking', 'speaking'
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  
  // Conversation history
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  
  // Refs for audio elements
  const microphoneRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const isMouseDownRef = useRef<boolean>(false);
  
  // Function definitions for recording audio
  const startRecording = () => {
    if (!isInterviewActive || status !== 'listening' || !microphoneRef.current) {
      console.log('Cannot start recording:', { isInterviewActive, status, hasMicrophone: !!microphoneRef.current });
      return;
    }
    
    try {
      // Only start if not already recording
      if (microphoneRef.current.state === 'inactive') {
        isMouseDownRef.current = true;
        audioChunksRef.current = [];
        logVoiceEvent('StartRecording', 'Starting recording...');
        microphoneRef.current.start(50); // Request data every 50ms for more frequent chunks
        setIsRecording(true);
      } else {
        logVoiceEvent('StartRecording', 'Cannot start recording, state is:', microphoneRef.current.state);
      }
    } catch (error) {
      logVoiceEvent('StartRecordingError', 'Error starting recording:', error);
    }
  };
  
  const stopRecording = () => {
    if (!isInterviewActive || !microphoneRef.current) {
      logVoiceEvent('StopRecording', 'Cannot stop recording, no active interview or microphone');
      return;
    }
    
    try {
      // Only stop if currently recording
      if (microphoneRef.current.state === 'recording') {
        isMouseDownRef.current = false;
        logVoiceEvent('StopRecording', 'Stopping recording from mouse/touch action...');
        microphoneRef.current.stop();
        setIsRecording(false);
      } else {
        logVoiceEvent('StopRecording', 'Cannot stop recording, state is:', microphoneRef.current.state);
      }
    } catch (error) {
      logVoiceEvent('StopRecordingError', 'Error stopping recording:', error);
    }
  };
  
  // Complete response without waiting for mouse up
  const completeResponse = () => {
    logVoiceEvent('CompleteResponse', 'Complete response button clicked', {
      isRecording,
      microphoneState: microphoneRef.current?.state,
      status,
      audioChunks: audioChunksRef.current?.length || 0
    });
    
    // Ensure we change to thinking state to indicate processing
    setStatus('thinking');
    
    // Show toast notification to inform user
    toast({
      title: "Processing your response",
      description: "Please wait while I analyze your answer...",
      duration: 3000
    });
    
    if (isRecording && microphoneRef.current && microphoneRef.current.state !== 'inactive') {
      logVoiceEvent('CompleteResponse', 'Active recording found, completing response...');
      
      // Stop recording to trigger the onstop event and process the audio
      microphoneRef.current.stop();
      setIsRecording(false);
      
      // The mediaRecorder.onstop event will handle processing the audio chunks
      logVoiceEvent('CompleteResponse', 'Stopped active recording - onstop handler will process audio chunks:', 
        audioChunksRef.current?.length || 0);
    } else {
      logVoiceEvent('CompleteResponse', 'No active recording found');
      
      // If we have audio chunks but recording was already stopped, process them directly
      if (audioChunksRef.current && audioChunksRef.current.length > 0) {
        logVoiceEvent('CompleteResponse', 'Found existing audio chunks to process:', audioChunksRef.current.length);
        
        // Create a blob from existing audio chunks - use the same type that MediaRecorder initialized with
        // Try to get the mime type from the actual recorder if available
        const recorderMimeType = microphoneRef.current?.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: recorderMimeType });
        logVoiceEvent('CompleteResponse', `Created audio blob from existing chunks, type: ${recorderMimeType}, size: ${audioBlob.size} bytes`);
        
        // Process this audio blob manually since onstop won't trigger
        processAudioBlob(audioBlob);
        
        // Clear audio chunks for next recording
        audioChunksRef.current = [];
      } else if (status === 'listening' || status === 'thinking') {
        // If we're in listening state but have no recording or chunks, try to create a minimal recording
        logVoiceEvent('CompleteResponse', 'No audio chunks found, creating a fallback response...');
        
        // If we can't even get a recording started, create a fallback message
        logVoiceEvent('CompleteResponse', 'Creating fallback user message to continue conversation');
        const fallbackText = "I need more time to think about this question. Can you please elaborate?";
        setTranscription(fallbackText);
        
        // Add fallback message to conversation - ensure it's added to the UI immediately
        const newMessage: ConversationMessage = {
          role: 'user',
          content: fallbackText,
          timestamp: new Date()
        };
        
        // Create a new array with the fallback message to ensure state update
        const updatedConversation = [...conversation, newMessage];
        logVoiceEvent('CompleteResponse', 'Setting conversation with fallback message:', updatedConversation);
        setConversation(updatedConversation);
        
        // Show toast notification for processing
        toast({
          title: "Analyzing response",
          description: "Processing your response and preparing AI feedback...",
          duration: 3000
        });
        
        // Ensure we use the updated conversation that includes the fallback message
        logVoiceEvent('CompleteResponse', 'Sending fallback message for analysis...', fallbackText);
        setTimeout(() => {
          analyzeResponseMutation.mutate({
            jobTitle: selectedJobDetails!.title,
            company: selectedJobDetails!.company,
            jobDescription: selectedJobDetails!.description,
            userResponse: fallbackText,
            conversation: updatedConversation
          });
        }, 100); // Small delay to ensure state update
      }
    }
  };
  
  // Helper function to process audio blob directly
  const processAudioBlob = async (audioBlob: Blob) => {
    // Detailed debug info about the audio blob
    logVoiceEvent('ProcessAudioBlob', 'Processing audio blob:', {
      size: audioBlob.size,
      type: audioBlob.type,
      lastModified: new Date().toISOString(),
      chunkCount: audioChunksRef.current?.length || 0,
      recorderType: microphoneRef.current?.mimeType || 'unknown'
    });
    
    // Check if the audio blob is empty or too short
    // OpenAI requires at least 0.1 seconds of audio
    if (audioBlob.size === 0 || audioBlob.size < 1000) { // 1KB as a minimum size threshold
      logVoiceEvent('ProcessAudioBlob', 'Audio blob is empty or too short, creating fallback message', {
        size: audioBlob.size,
        type: audioBlob.type
      });
      
      // Show toast notification with error
      toast({
        title: "Recording too short",
        description: "Your recording was too short. Please hold the microphone button longer when speaking.",
        variant: "destructive"
      });
      
      // Create a fallback message
      const fallbackText = "I'm sorry, I didn't catch that. Could you repeat the question?";
      setTranscription(fallbackText);
      
      // Add fallback message to conversation
      const newMessage: ConversationMessage = {
        role: 'user',
        content: fallbackText,
        timestamp: new Date()
      };
      
      // Update conversation with the fallback message
      const updatedConversation = [...conversation, newMessage];
      setConversation(updatedConversation);
      
      // Send for analysis
      analyzeResponseMutation.mutate({
        jobTitle: selectedJobDetails!.title,
        company: selectedJobDetails!.company,
        jobDescription: selectedJobDetails!.description,
        userResponse: fallbackText,
        conversation: updatedConversation
      });
      
      return;
    }
    
    try {
      // Ensure the audio blob has the correct type
      // If the type is empty or not supported, create a new blob with a supported MIME type
      let processedBlob = audioBlob;
      if (!audioBlob.type || !audioBlob.type.includes('audio/')) {
        logVoiceEvent('ProcessAudioBlob', `Recreating blob with explicit audio MIME type, original type: ${audioBlob.type}`);
        // Use webm as the default format as it's widely supported
        processedBlob = new Blob([await audioBlob.arrayBuffer()], { type: 'audio/webm' });
      }
      
      // Convert blob to base64 for sending to backend
      const reader = new FileReader();
      
      // Create a promise to handle FileReader async operation
      const readBlobAsBase64 = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            resolve(reader.result);
          } else {
            reject(new Error("FileReader didn't return a string"));
          }
        };
        reader.onerror = () => {
          reject(reader.error || new Error("Error reading file"));
        };
        reader.readAsDataURL(processedBlob);
      });
      
      // Wait for FileReader to complete
      const base64data = await readBlobAsBase64;
      logVoiceEvent('ProcessAudioBlob', `Successfully read blob as base64, length: ${base64data.length}`);
      
      // Check if data is in expected format and extract only the base64 part
      let base64Audio;
      let mimeType = '';
      
      if (base64data.includes('base64,')) {
        // Extract both MIME type and base64 data
        const matches = base64data.match(/^data:([^;]+);base64,(.+)$/);
        if (matches && matches.length >= 3) {
          mimeType = matches[1];
          base64Audio = matches[2]; 
          logVoiceEvent('ProcessAudioBlob', `Extracted MIME type: ${mimeType}, base64 length: ${base64Audio.length}`);
        } else {
          // If no proper match found but there's a comma, split at the comma
          base64Audio = base64data.split(',')[1];
          logVoiceEvent('ProcessAudioBlob', 'Could not extract MIME type, but split at comma');
        }
      } else {
        // If no data URL prefix, use as is
        base64Audio = base64data;
        logVoiceEvent('ProcessAudioBlob', 'No data URL prefix found, using raw base64 data');
      }
        
        logVoiceEvent('ProcessAudioBlob', 'Audio encoded to base64, sending for transcription...');
        logVoiceEvent('ProcessAudioBlob', 'Base64 data length:', base64Audio?.length || 'MISSING');
        
        if (!base64Audio) {
          toast({
            title: "Audio processing error",
            description: "Failed to prepare audio for transcription. Please try again.",
            variant: "destructive"
          });
          setStatus('listening');
          return;
        }
        
        // Check for base64 validity - must be a reasonable length and match base64 pattern
        if (base64Audio.length < 100 || !(/^[A-Za-z0-9+/=]+$/.test(base64Audio))) {
          logVoiceEvent('ProcessAudioBlob', 'Invalid base64 data detected', { 
            length: base64Audio.length,
            isValidPattern: /^[A-Za-z0-9+/=]+$/.test(base64Audio)
          });
          toast({
            title: "Audio format error",
            description: "The recorded audio couldn't be properly encoded. Please try again.",
            variant: "destructive"
          });
          setStatus('listening');
          return;
        }
        
        // Clear audio chunks for next recording
        audioChunksRef.current = [];
        
        // Show toast notification to indicate processing
        toast({
          title: "Transcribing audio",
          description: "Converting your speech to text...",
          duration: 3000
        });
        
        // Send to backend for transcription
        logVoiceEvent('ProcessAudioBlob', 'Sending audio to transcription API...');
        
        const response = await apiRequest('POST', '/api/interview/transcribe', {
          audio: base64Audio
        });
        
        logVoiceEvent('ProcessAudioBlob', 'Transcription API response status:', response.status);
        
        if (response.ok) {
          const responseData = await response.json();
          logVoiceEvent('ProcessAudioBlob', 'Transcription API response:', responseData);
          const { text } = responseData;
          
          if (!text || text.trim() === '') {
            logVoiceEvent('ProcessAudioBlob', 'Empty transcription received, using fallback');
            
            toast({
              title: "No speech detected",
              description: "We couldn't detect any speech in your recording. Please try again.",
              variant: "destructive"
            });
            
            setStatus('listening');
            return;
          }
          
          logVoiceEvent('ProcessAudioBlob', 'Valid transcription received:', text);
          setTranscription(text);
          
          // Add user response to conversation
          const newMessage: ConversationMessage = {
            role: 'user',
            content: text,
            timestamp: new Date()
          };
          
          // Update conversation with the new message
          const updatedConversation = [...conversation, newMessage];
          setConversation(updatedConversation);
          
          // Show toast notification for analyzing
          toast({
            title: "Analyzing response",
            description: "Processing your response and preparing AI feedback...",
            duration: 3000
          });
          
          // Send for analysis
          analyzeResponseMutation.mutate({
            jobTitle: selectedJobDetails!.title,
            company: selectedJobDetails!.company,
            jobDescription: selectedJobDetails!.description,
            userResponse: text,
            conversation: updatedConversation
          });
        } else {
          // Try to get more detailed error information
          try {
            const errorData = await response.json();
            logVoiceEvent('ProcessAudioBlob', 'Transcription API error:', {
              status: response.status,
              statusText: response.statusText,
              errorDetails: errorData
            });
            
            // Show more specific error message if available
            let errorMessage = `Failed to transcribe audio (${response.status}).`;
            if (errorData.error) {
              errorMessage = errorData.error;
              
              // Add specific guidance for common errors
              if (errorData.details) {
                if (errorData.details.includes('format') || errorData.details.includes('Content-Type')) {
                  logVoiceEvent('ProcessAudioBlob', 'Format error detected in API response');
                  errorMessage = "Audio format error. Your browser's recording format isn't compatible. Try a different browser like Chrome.";
                } else if (errorData.details.includes('too short')) {
                  errorMessage = "Recording too short. Please hold the microphone button longer when speaking.";
                }
              }
            }
            
            toast({
              title: "Transcription failed",
              description: errorMessage,
              variant: "destructive"
            });
          } catch (jsonError) {
            // Fallback if we can't parse JSON error response
            logVoiceEvent('ProcessAudioBlob', 'Transcription API error:', { 
              status: response.status, 
              statusText: response.statusText 
            });
            
            toast({
              title: "Transcription failed",
              description: `Failed to transcribe audio (${response.status}). Please try again.`,
              variant: "destructive"
            });
          }
          
          setStatus('listening');
        }
      } catch (error) {
        logVoiceEvent('ProcessAudioBlob', 'Error processing audio:', error);
        
        toast({
          title: "Processing error",
          description: "An error occurred while processing your audio. Please try again.",
          variant: "destructive"
        });
        
        setStatus('listening');
      }
  };
  
  // Get applications from the server
  const { data: applications = [], isLoading: isLoadingApplications } = useQuery({
    queryKey: ['/api/job-applications'],
    staleTime: 60 * 1000, // 1 minute
  });
  
  // Filter for active applications
  const activeApplications = (applications as JobApplication[]).filter(app => {
    // Include applications with active statuses
    return ['active', 'interviewing', 'offer', 'pending', 'applied'].includes(app.status?.toLowerCase() || '');
  });
  
  // Mutation for generating interview questions
  const generateQuestionMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/interview/generate-question', data);
      if (!response.ok) {
        throw new Error(`Failed to generate question: ${response.status}`);
      }
      return await response.json();
    },
    onSuccess: (data) => {
      const question = data.aiResponse || data.question;
      
      // Create a new message for the assistant's question
      const newMessage: ConversationMessage = {
        role: 'assistant',
        content: question,
        timestamp: new Date()
      };
      
      // Add to conversation
      setConversation(prev => [...prev, newMessage]);
      
      // Update status to listening
      setStatus('listening');
      
      // Try converting text to speech
      textToSpeechMutation.mutate({
        text: question
      });
    },
    onError: (error) => {
      logVoiceEvent('GenerateQuestionError', 'Error generating question:', error);
      
      toast({
        title: "Error",
        description: "Failed to generate interview question. Please try again.",
        variant: "destructive"
      });
      
      // Reset to idle state
      setStatus('idle');
    }
  });
  
  // Mutation for analyzing responses
  const analyzeResponseMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/interview/analyze-response', data);
      if (!response.ok) {
        throw new Error(`Failed to analyze response: ${response.status}`);
      }
      return await response.json();
    },
    onSuccess: (data) => {
      // Check if this is the last question and we have feedback
      if (data.isLastQuestion && data.feedback) {
        // Set feedback text
        setFeedback(data.feedback);
        
        // Show toast notification
        toast({
          title: "Interview Complete",
          description: "Your practice interview is complete. Review your feedback below.",
        });
        
        // End the interview session
        setIsInterviewActive(false);
        setStatus('idle');
        return;
      }
      
      // For ongoing interview, get assistant's response and add to conversation
      if (data.aiResponse) {
        // Create a message for the assistant
        const newMessage: ConversationMessage = {
          role: 'assistant',
          content: data.aiResponse,
          timestamp: new Date()
        };
        
        // Add to conversation
        setConversation(prev => [...prev, newMessage]);
        
        // Play the response using text-to-speech
        textToSpeechMutation.mutate({
          text: data.aiResponse
        });
      }
    },
    onError: (error) => {
      logVoiceEvent('AnalyzeResponseError', 'Error analyzing response:', error);
      
      toast({
        title: "Error",
        description: "Failed to analyze your response. Please try again.",
        variant: "destructive"
      });
      
      // Reset to listening state
      setStatus('listening');
    }
  });
  
  // Mutation for text-to-speech
  const textToSpeechMutation = useMutation({
    mutationFn: async (data: { text: string }) => {
      // Set status to speaking while fetching audio
      setStatus('speaking');
      
      const response = await apiRequest('POST', '/api/interview/text-to-speech', {
        text: data.text,
        voice: 'nova' // Using Nova voice for consistency
      });
      
      if (!response.ok) {
        throw new Error(`Failed to convert text to speech: ${response.status}`);
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      if (data.audio) {
        try {
          // Create audio element and play
          const audio = new Audio(`data:audio/mpeg;base64,${data.audio}`);
          
          // Add event listeners for audio playback
          audio.addEventListener('ended', () => {
            // Set status back to listening when audio finishes
            setStatus('listening');
          });
          
          audio.addEventListener('error', (event) => {
            const errorEvent = event as Event & { error?: DOMException };
            logVoiceEvent('TextToSpeechPlaybackError', 'Audio playback error:', errorEvent.error);
            
            // Fallback to browser's speech synthesis if audio playback fails
            if ('speechSynthesis' in window) {
              const lastMessage = conversation[conversation.length - 1];
              if (lastMessage && lastMessage.role === 'assistant') {
                const utterance = new SpeechSynthesisUtterance(lastMessage.content);
                utterance.onend = () => setStatus('listening');
                window.speechSynthesis.speak(utterance);
              } else {
                setStatus('listening');
              }
            } else {
              // If speech synthesis is not available, just continue
              setStatus('listening');
            }
          });
          
          // Play the audio
          audio.play().catch(error => {
            logVoiceEvent('TextToSpeechPlaybackError', 'Audio play error:', error);
            setStatus('listening');
          });
        } catch (error) {
          logVoiceEvent('TextToSpeechPlaybackError', 'Error creating/playing audio:', error);
          
          // Fallback to status update
          setStatus('listening');
        }
      } else {
        logVoiceEvent('TextToSpeechError', 'No audio data received');
        
        // Fallback to browser's speech synthesis
        if ('speechSynthesis' in window) {
          const lastMessage = conversation[conversation.length - 1];
          if (lastMessage && lastMessage.role === 'assistant') {
            const utterance = new SpeechSynthesisUtterance(lastMessage.content);
            utterance.onend = () => setStatus('listening');
            window.speechSynthesis.speak(utterance);
          } else {
            setStatus('listening');
          }
        } else {
          // If speech synthesis is not available, just continue
          setStatus('listening');
        }
      }
    },
    onError: (error) => {
      logVoiceEvent('TextToSpeechError', 'Text-to-speech error:', error);
      
      // Try to use browser's speech synthesis as fallback
      if ('speechSynthesis' in window) {
        try {
          const lastMessage = conversation[conversation.length - 1];
          if (lastMessage && lastMessage.role === 'assistant') {
            const utterance = new SpeechSynthesisUtterance(lastMessage.content);
            utterance.onend = () => setStatus('listening');
            window.speechSynthesis.speak(utterance);
          } else {
            setStatus('listening');
          }
        } catch (e) {
          // Even speech synthesis failed, just continue
          setStatus('listening');
        }
      } else {
        // If speech synthesis is not available, just continue
        setStatus('listening');
      }
    }
  });
  
  // Effects
  
  // Update selected job details when application selection changes
  useEffect(() => {
    if (selectedApplication) {
      const application = applications.find((app: JobApplication) => 
        app.id.toString() === selectedApplication
      );
      
      if (application) {
        setSelectedJobDetails({
          title: application.title || application.jobTitle || application.position || 'Unknown Position',
          company: application.company || application.companyName || 'Unknown Company',
          description: application.description || application.jobDescription || 'No description available'
        });
      }
    } else {
      setSelectedJobDetails(null);
    }
  }, [selectedApplication, applications]);
  
  // Initialize media recording
  useEffect(() => {
    if (isInterviewActive && status === 'listening') {
      const setupMicrophone = async () => {
        try {
          // Check if we already have a stream
          if (!audioStreamRef.current) {
            logVoiceEvent('MicrophoneSetup', 'Getting microphone stream');
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioStreamRef.current = stream;
          }
          
          // Create MediaRecorder if not already available
          if (!microphoneRef.current) {
            logVoiceEvent('MicrophoneSetup', 'Creating MediaRecorder');
            // Try preferred formats first (MP3), then fall back if not supported
            // MP3 is the most compatible with OpenAI's Whisper API
            const preferredMimeTypes = [
              'audio/mp3',
              'audio/mpeg',
              'audio/webm;codecs=opus',
              'audio/webm',
              'audio/ogg;codecs=opus',
              'audio/wav',
              'audio/mp4'
            ];
            
            // Log available mime types for debugging
            logVoiceEvent('MicrophoneSetup', 'Checking supported MIME types...');
            let mimeType = '';
            
            // Find the first supported mime type from our preferred list
            for (const type of preferredMimeTypes) {
              if (MediaRecorder.isTypeSupported(type)) {
                mimeType = type;
                logVoiceEvent('MicrophoneSetup', `Found supported MIME type: ${type}`);
                break;
              } else {
                logVoiceEvent('MicrophoneSetup', `MIME type not supported: ${type}`);
              }
            }
            
            // If no preferred types are supported, use browser default
            if (!mimeType) {
              logVoiceEvent('MicrophoneSetup', 'No preferred MIME types supported, using browser default');
              mimeType = '';
            }
            
            logVoiceEvent('MicrophoneSetup', `Creating MediaRecorder with mime type: ${mimeType}`);
            const recorder = new MediaRecorder(audioStreamRef.current, {
              mimeType: mimeType,
              audioBitsPerSecond: 128000 // Higher quality audio
            });
            
            // Set up event listeners
            recorder.addEventListener('dataavailable', (event) => {
              if (event.data.size > 0) {
                audioChunksRef.current.push(event.data);
              }
            });
            
            recorder.addEventListener('stop', () => {
              logVoiceEvent('MicrophoneSetup', 'MediaRecorder stopped with', audioChunksRef.current.length, 'chunks');
              
              // Get the actual mime type from the recorder
              const recorderMimeType = recorder.mimeType;
              logVoiceEvent('MicrophoneSetup', `Recorder actual mime type: ${recorderMimeType}`);
              
              // Only process chunks if we have data and aren't already processing
              if (audioChunksRef.current.length > 0 && status !== 'thinking') {
                // First check if we have any chunks with actual data
                const hasData = audioChunksRef.current.some(chunk => chunk.size > 0);
                
                if (!hasData) {
                  logVoiceEvent('MicrophoneSetup', 'No audio data found in chunks, skipping processing');
                  setStatus('listening');
                  return;
                }
                
                // Use the detected MIME type from the recorder for better consistency
                const actualMimeType = recorderMimeType || 'audio/mpeg'; // Fallback to MP3 if no MIME type detected
                
                // Create a blob from all chunks
                const audioBlob = new Blob(audioChunksRef.current, { type: actualMimeType });
                logVoiceEvent('MicrophoneSetup', `Created audio blob with type: ${actualMimeType}, size: ${audioBlob.size} bytes`);
                
                // Check if the blob size is reasonable
                if (audioBlob.size < 100) { // Extremely small blobs likely indicate an error
                  logVoiceEvent('MicrophoneSetup', 'Blob size too small, possibly empty recording');
                  toast({
                    title: "Recording too short",
                    description: "Your recording was too short. Please hold the microphone button longer when speaking.",
                    variant: "destructive"
                  });
                  setStatus('listening');
                  return;
                }
                
                // Update status and process the audio
                setStatus('thinking');
                processAudioBlob(audioBlob);
              }
            });
            
            // Store the recorder in the ref
            microphoneRef.current = recorder;
          }
        } catch (error) {
          logVoiceEvent('MicrophoneSetupError', 'Error setting up microphone:', error);
          
          toast({
            title: "Microphone Error",
            description: "Could not access your microphone. Please check your permissions and try again.",
            variant: "destructive",
          });
          
          // End the interview if we can't set up the microphone
          setIsInterviewActive(false);
          setStatus('idle');
        }
      };
      
      setupMicrophone();
    }
    
    // Clean up on unmount or when interview ends
    return () => {
      if (!isInterviewActive && audioStreamRef.current) {
        // Stop all tracks in the stream
        audioStreamRef.current.getTracks().forEach(track => track.stop());
        audioStreamRef.current = null;
        microphoneRef.current = null;
      }
    };
  }, [isInterviewActive, status]);
  
  // Start listening when mouseDown is true
  const stopListening = () => {
    if (microphoneRef.current && audioStreamRef.current) {
      // Stop any ongoing recording
      if (microphoneRef.current.state === 'recording') {
        microphoneRef.current.stop();
      }
      
      // Stop all tracks in the stream
      audioStreamRef.current.getTracks().forEach(track => track.stop());
      audioStreamRef.current = null;
      microphoneRef.current = null;
    }
  };
  
  // Start the interview
  const startInterview = () => {
    // Reset interview state
    setIsInterviewActive(true);
    setStatus('thinking');
    setConversation([]);
    setFeedback(null);
    
    // Generate first question
    generateQuestionMutation.mutate({
      jobTitle: selectedJobDetails!.title,
      company: selectedJobDetails!.company,
      jobDescription: selectedJobDetails!.description,
      conversation: []
    });
  };

  // End the interview
  const endInterview = () => {
    // Stop any ongoing recording
    stopListening();
    
    // Close microphone stream
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop());
      audioStreamRef.current = null;
    }
    
    // Reset interview state
    setIsInterviewActive(false);
    setStatus('idle');
    setIsRecording(false);
    
    // If no feedback was generated, create a simple one
    if (!feedback && conversation.length > 0) {
      setFeedback("Interview ended. Thank you for practicing!");
    }
  };

  // Track the active tab
  const [activeTab, setActiveTab] = useState<string>("interview");
  
  // Function to add debug logs when changing tabs
  const handleTabChange = (tab: string) => {
    logVoiceEvent('TabChange', `Switching to ${tab} tab`);
    setActiveTab(tab);
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Voice Interview Practice</h1>
      </div>

      <Tabs 
        defaultValue="interview" 
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full"
      >
        <TabsList className="mb-6 grid grid-cols-2 w-full max-w-md mx-auto">
          <TabsTrigger value="interview" className="flex items-center gap-2">
            <Mic className="h-4 w-4" />
            Interview Practice
          </TabsTrigger>
          <TabsTrigger value="diagnostics" className="flex items-center gap-2">
            <Bug className="h-4 w-4" />
            Voice Diagnostics
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="interview">
          <div className="space-y-6">
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Practice for your interviews</CardTitle>
                <CardDescription>
                  Use voice commands to practice answering interview questions specific to your job applications.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <div className="w-full max-w-md mb-8">
                  <label className="block text-sm font-medium mb-2">Select Active Application</label>
                  {isLoadingApplications ? (
                    <div className="flex items-center justify-center p-4">
                      <div className="animate-spin h-5 w-5 border-2 border-primary rounded-full border-t-transparent"></div>
                      <span className="ml-2 text-sm text-muted-foreground">Loading applications...</span>
                    </div>
                  ) : activeApplications.length === 0 ? (
                    <Alert variant="destructive" className="mb-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>No active applications</AlertTitle>
                      <AlertDescription>
                        You must have an active application to start interview practice.
                        Go to the Application Tracker to create or update applications.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Select 
                      value={selectedApplication} 
                      onValueChange={setSelectedApplication}
                      disabled={isInterviewActive}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a job to practice for" />
                      </SelectTrigger>
                      <SelectContent>
                        {activeApplications.map(app => (
                          <SelectItem key={app.id} value={app.id.toString()}>
                            {(app.title || app.jobTitle || app.position || 'Unknown Position')} at {(app.company || app.companyName || 'Unknown Company')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* Start/End Interview buttons */}
                <div className="w-full max-w-md flex gap-4 justify-center mb-6">
                  <Button
                    variant="default"
                    size="lg"
                    className="flex items-center gap-2"
                    onClick={startInterview}
                    disabled={!selectedJobDetails || isInterviewActive || activeApplications.length === 0 || generateQuestionMutation.isPending}
                  >
                    <Play size={18} />
                    Start Interview
                  </Button>
                  <Button
                    variant="secondary"
                    size="lg"
                    className="flex items-center gap-2"
                    onClick={endInterview}
                    disabled={!isInterviewActive}
                  >
                    <Square size={18} />
                    End Interview
                  </Button>
                </div>
          
                {/* Status indicator */}
                <div className="w-full max-w-md mb-4">
                  {isInterviewActive && (
                    <div className={`p-3 rounded-md text-center ${
                      status === 'idle' ? 'bg-muted' : 
                      status === 'listening' ? 'bg-green-100 dark:bg-green-900/30' : 
                      status === 'thinking' ? 'bg-amber-100 dark:bg-amber-900/30' : 
                      status === 'speaking' ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-muted'
                    }`}>
                      <div className="flex items-center justify-center gap-2">
                        {status === 'idle' && <Play size={18} />}
                        {status === 'listening' && <Mic className="animate-pulse" size={18} />}
                        {status === 'thinking' && (
                          <div className="animate-spin h-4 w-4 border-2 border-current rounded-full border-t-transparent" />
                        )}
                        {status === 'speaking' && <Volume2 className="animate-pulse" size={18} />}
                        <span className="font-medium">
                          {status === 'idle' && 'Ready to start'}
                          {status === 'listening' && 'Listening to your response...'}
                          {status === 'thinking' && 'Processing your response...'}
                          {status === 'speaking' && 'Speaking... (OpenAI Nova Voice)'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Microphone button and Complete Response button (only shown during active listening) */}
                {isInterviewActive && status === 'listening' && (
                  <div className="flex flex-col items-center justify-center mt-6 mb-6">
                    <div className="flex gap-4 mb-4">
                      <button
                        className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                          isRecording ? 'bg-red-500 animate-pulse' : 'bg-muted'
                        }`}
                        onMouseDown={startRecording}
                        onMouseUp={stopRecording}
                        onTouchStart={startRecording}
                        onTouchEnd={stopRecording}
                        disabled={!selectedJobDetails}
                      >
                        <Mic className="w-8 h-8" />
                      </button>
                      
                      <Button 
                        variant="secondary"
                        size="lg"
                        onClick={completeResponse}
                        disabled={!isRecording}
                        className="self-center"
                      >
                        Complete Response
                      </Button>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground text-center">
                      {isRecording ? 'Recording in progress...' : 'Hold to speak'}
                    </p>
                  </div>
                )}
                
                {/* Tips card (only shown when not in an interview) */}
                {!isInterviewActive && (
                  <div className="mt-6 w-full max-w-md">
                    <Card className="bg-muted/40">
                      <CardContent className="p-4">
                        <h3 className="font-medium mb-2">Tips:</h3>
                        <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                          <li>Speak clearly and at a moderate pace</li>
                          <li>Select a specific job application for tailored practice</li>
                          <li>Click "Start Interview" to begin the conversation</li>
                          <li>The AI will ask questions and listen to your responses</li>
                          <li>Click "End Interview" to finish and get feedback</li>
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Conversation History</CardTitle>
                  <CardDescription>
                    Your conversation with the AI interview assistant
                  </CardDescription>
                </div>
                {selectedJobDetails && (
                  <Badge variant="outline" className="px-3 py-1">
                    {selectedJobDetails.title} at {selectedJobDetails.company}
                  </Badge>
                )}
              </CardHeader>
              <CardContent>
                {conversation.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    {isInterviewActive 
                      ? "The interview will begin momentarily..." 
                      : "Start an interview to see the conversation"}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {conversation.map((message, index) => (
                      <div 
                        key={index}
                        className={`flex ${message.role === 'assistant' ? 'justify-start' : 'justify-end'}`}
                      >
                        <div 
                          className={`max-w-[80%] rounded-lg px-4 py-2 ${
                            message.role === 'assistant' 
                              ? 'bg-muted border border-border' 
                              : 'bg-primary/10 border border-primary/20'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {message.timestamp instanceof Date 
                              ? message.timestamp.toLocaleTimeString()
                              : new Date(message.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Feedback section */}
                {feedback && !isInterviewActive && (
                  <>
                    <Separator className="my-6" />
                    <div className="bg-muted/30 border rounded-lg p-4 mt-4">
                      <h3 className="font-semibold text-lg mb-2">Interview Feedback</h3>
                      <p className="text-sm whitespace-pre-line">{feedback}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="diagnostics">
          <VoiceDiagnostics />
        </TabsContent>
      </Tabs>
    </div>
  );
}