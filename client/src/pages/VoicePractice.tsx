import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mic, AlertCircle, Play, Square, Volume2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

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
        console.log('Starting recording...');
        microphoneRef.current.start(100); // Request data every 100ms for frequent chunks
        setIsRecording(true);
      } else {
        console.log('Cannot start recording, state is:', microphoneRef.current.state);
      }
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };
  
  const stopRecording = () => {
    if (!isInterviewActive || !microphoneRef.current) {
      console.log('Cannot stop recording, no active interview or microphone');
      return;
    }
    
    try {
      // Only stop if currently recording
      if (microphoneRef.current.state === 'recording') {
        isMouseDownRef.current = false;
        console.log('Stopping recording from mouse/touch action...');
        microphoneRef.current.stop();
        setIsRecording(false);
      } else {
        console.log('Cannot stop recording, state is:', microphoneRef.current.state);
      }
    } catch (error) {
      console.error('Error stopping recording:', error);
    }
  };
  
  // Complete response without waiting for mouse up
  const completeResponse = () => {
    if (isRecording && microphoneRef.current && microphoneRef.current.state !== 'inactive') {
      console.log('Completing response...');
      // Stop recording to trigger the onstop event and process the audio
      microphoneRef.current.stop();
      setIsRecording(false);
      // Set status to thinking to show the user we're processing
      setStatus('thinking');
    } else {
      console.log('Cannot complete response - recording not active');
    }
  };
  
  // Fetch job applications from the API
  const { data: applications, isLoading: isLoadingApplications } = useQuery<JobApplication[]>({
    queryKey: ['/api/job-applications'],
    queryFn: async () => {
      try {
        // First check localStorage for any saved applications
        const mockApplications = JSON.parse(localStorage.getItem('mockJobApplications') || '[]');
        
        // Try to get server applications
        try {
          const response = await apiRequest({
            url: '/api/job-applications',
            method: 'GET'
          });
          
          // If we have mock applications in localStorage, merge with server applications
          if (mockApplications.length > 0) {
            // Check if response is an array
            const serverApps = Array.isArray(response) ? response : [];
            // Create a set of existing IDs to avoid duplicates
            const existingIds = new Set(serverApps.map((app: any) => app.id));
            // Merge server and local applications
            const mergedApps = [
              ...serverApps,
              ...mockApplications.filter((app: any) => !existingIds.has(app.id))
            ];
            
            return mergedApps;
          }
          
          return Array.isArray(response) ? response : [];
        } catch (serverError) {
          // If server request fails, fall back to the localStorage applications
          console.log('Using mock job applications from localStorage due to server error');
          if (mockApplications.length > 0) {
            return mockApplications;
          }
          throw serverError; // Re-throw if no localStorage data available
        }
      } catch (error) {
        console.error('Error fetching job applications:', error);
        return [];
      }
    },
    staleTime: 60000, // Refresh every minute
  });

  // Filter applications to show only active ones
  const activeApplications = applications?.filter(app => 
    app.status === 'In Progress' || 
    app.status === 'Applied' || 
    app.status === 'Interviewing'
  ) || [];

  // Update selected job details when application selection changes
  useEffect(() => {
    if (selectedApplication && activeApplications.length > 0) {
      const selected = activeApplications.find(app => app.id.toString() === selectedApplication);
      if (selected) {
        setSelectedJobDetails({
          title: selected.title || selected.jobTitle || selected.position || 'Unknown Position',
          company: selected.company || selected.companyName || 'Unknown Company',
          description: selected.description || selected.jobDescription || ''
        });
      }
    } else {
      setSelectedJobDetails(null);
    }
  }, [selectedApplication, activeApplications]);

  // Generate interview questions mutation
  const generateQuestionMutation = useMutation({
    mutationFn: async (params: { 
      jobTitle: string, 
      company: string, 
      jobDescription: string,
      conversation: ConversationMessage[]
    }) => {
      try {
        const response = await apiRequest('POST', '/api/interview/generate-question', params);
        if (!response.ok) throw new Error('Failed to generate question');
        return await response.json();
      } catch (error) {
        console.error('Error generating question:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      // Add AI question to conversation
      const newMessage: ConversationMessage = {
        role: 'assistant',
        content: data.question,
        timestamp: new Date()
      };
      
      setConversation(prev => [...prev, newMessage]);
      
      // Speak the question using OpenAI's Text-to-Speech API
      // This will update status to speaking and then listening via the audio events
      speakText(data.question);
    },
    onError: (error) => {
      console.error('Failed to generate interview question:', error);
      setStatus('idle');
      endInterview();
    }
  });

  // Analyze user response mutation
  const analyzeResponseMutation = useMutation({
    mutationFn: async (params: {
      jobTitle: string,
      company: string,
      jobDescription: string,
      userResponse: string,
      conversation: ConversationMessage[]
    }) => {
      try {
        const response = await apiRequest('POST', '/api/interview/analyze-response', params);
        if (!response.ok) throw new Error('Failed to analyze response');
        return await response.json();
      } catch (error) {
        console.error('Error analyzing response:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      // If this is the end of the interview, show the feedback
      if (data.isLastQuestion) {
        setFeedback(data.feedback);
        endInterview();
        return;
      }
      
      // Continue with the next question
      generateQuestionMutation.mutate({
        jobTitle: selectedJobDetails!.title,
        company: selectedJobDetails!.company,
        jobDescription: selectedJobDetails!.description,
        conversation: conversation
      });
    },
    onError: (error) => {
      console.error('Failed to analyze response:', error);
      setStatus('idle');
      endInterview();
    }
  });

  // Calculate speaking time based on text length
  const calculateSpeakingTime = (text: string): number => {
    // Average speaking rate is about 150 words per minute
    // So that's 2.5 words per second
    const words = text.split(' ').length;
    const seconds = words / 2.5;
    // Add a 1-second buffer and convert to milliseconds
    return (seconds + 1) * 1000;
  };

  // Audio element reference for playing TTS responses
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Text-to-speech mutation using OpenAI's API
  const textToSpeechMutation = useMutation({
    mutationFn: async (params: { text: string, voice?: string }) => {
      try {
        const response = await apiRequest('POST', '/api/interview/text-to-speech', params);
        if (!response.ok) throw new Error('Failed to convert text to speech');
        return await response.json();
      } catch (error) {
        console.error('Error converting text to speech:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      if (data.audioUrl) {
        // Create audio element if not already created
        if (!audioRef.current) {
          audioRef.current = new Audio();
          
          // Add event listeners to update status when audio plays/ends
          audioRef.current.onplay = () => {
            setStatus('speaking');
          };
          
          audioRef.current.onended = () => {
            setStatus('listening');
            startListening();
          };
        }
        
        // Set audio source and play
        audioRef.current.src = data.audioUrl;
        audioRef.current.play().catch(err => {
          console.error('Error playing audio:', err);
          // Fallback to browser's TTS if audio fails to play
          fallbackToBuiltInTTS(data.text || '');
        });
      } else {
        console.error('No audio URL returned from TTS API');
        fallbackToBuiltInTTS(data.text || '');
      }
    },
    onError: (error, variables) => {
      console.error('Failed to generate speech:', error);
      // Fallback to browser's built-in TTS on API error
      fallbackToBuiltInTTS(variables.text);
    }
  });
  
  // Function to speak text using OpenAI's text-to-speech API
  const speakText = (text: string) => {
    // First set status to speaking to update UI
    setStatus('speaking');
    
    // Call the OpenAI TTS API
    textToSpeechMutation.mutate({ 
      text,
      voice: 'nova' // Friendly, natural female voice
    });
  };
  
  // Fallback to browser's built-in TTS if OpenAI API fails
  const fallbackToBuiltInTTS = (text: string) => {
    if ('speechSynthesis' in window) {
      console.log('Falling back to browser TTS');
      const speech = new SpeechSynthesisUtterance(text);
      speech.rate = 1.0; // Normal speaking rate
      speech.pitch = 1.0; // Normal pitch
      speech.volume = 1.0; // Full volume
      
      // Use a female voice if available
      const voices = window.speechSynthesis.getVoices();
      const femaleVoice = voices.find(voice => voice.name.includes('Female'));
      if (femaleVoice) {
        speech.voice = femaleVoice;
      }
      
      // Add event handlers to update status
      speech.onstart = () => {
        setStatus('speaking');
      };
      
      speech.onend = () => {
        setStatus('listening');
        startListening();
      };
      
      window.speechSynthesis.speak(speech);
    } else {
      console.error('Text-to-speech not supported in this browser');
      // Move to listening state anyway to allow the interview to continue
      setStatus('listening');
      startListening();
    }
  };

  // Setup microphone access
  const setupMicrophone = async () => {
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      
      // Create a MediaRecorder instance with specific MIME type and bitrate
      const options = {
        mimeType: 'audio/webm',
        audioBitsPerSecond: 128000
      };
      
      const mediaRecorder = new MediaRecorder(stream, options);
      microphoneRef.current = mediaRecorder;
      
      // Handle dataavailable event to collect audio chunks
      mediaRecorder.ondataavailable = (event) => {
        console.log('Data available event triggered', event.data.size);
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      // Handle recording stop event
      mediaRecorder.onstop = async () => {
        console.log('MediaRecorder stopped, processing audio...');
        // Create a blob from the audio chunks
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        console.log('Created audio blob of size:', audioBlob.size);
        
        if (audioBlob.size === 0) {
          console.error('Audio blob is empty, no data was recorded');
          setStatus('listening');
          return;
        }
        
        // Convert blob to base64 for sending to backend
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64data = reader.result as string;
          
          // Extract only the base64 part (remove the data URL prefix)
          const base64Audio = base64data.split(',')[1];
          console.log('Audio encoded to base64, sending for transcription...');
          
          // Clear audio chunks for next recording
          audioChunksRef.current = [];
          
          // Send to backend for transcription
          try {
            setStatus('thinking');
            console.log('Sending audio to transcription API...');
            
            const response = await apiRequest('POST', '/api/interview/transcribe', {
              audio: base64Audio
            });
            
            if (response.ok) {
              const { text } = await response.json();
              console.log('Transcription received:', text);
              setTranscription(text);
              
              // Add user response to conversation
              const newMessage: ConversationMessage = {
                role: 'user',
                content: text,
                timestamp: new Date()
              };
              
              setConversation(prev => [...prev, newMessage]);
              
              // Send for analysis
              console.log('Sending transcription for analysis...');
              analyzeResponseMutation.mutate({
                jobTitle: selectedJobDetails!.title,
                company: selectedJobDetails!.company,
                jobDescription: selectedJobDetails!.description,
                userResponse: text,
                conversation: [...conversation, newMessage]
              });
            } else {
              console.error('Failed to transcribe audio', response.status);
              setStatus('listening'); // Return to listening state to allow retry
            }
          } catch (error) {
            console.error('Error transcribing audio:', error);
            setStatus('listening'); // Return to listening state to allow retry
          }
        };
      };
      
      // Handle recording start event
      mediaRecorder.onstart = () => {
        console.log('MediaRecorder started, recording audio...');
        // Ensure array is empty at start
        audioChunksRef.current = [];
      };
      
      // Handle recording error event
      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        setStatus('idle');
      };
      
      return true;
    } catch (error) {
      console.error('Error accessing microphone:', error);
      return false;
    }
  };

  // Start listening for user response
  const startListening = () => {
    if (!microphoneRef.current) return;
    
    try {
      audioChunksRef.current = [];
      microphoneRef.current.start(1000); // Specify timeslice of 1 second to get data more frequently
      setIsRecording(true);
      setStatus('listening');
      console.log('Listening for user response started');
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  // Stop listening
  const stopListening = () => {
    if (!microphoneRef.current || microphoneRef.current.state === 'inactive') return;
    
    try {
      console.log('Stopping recording...');
      microphoneRef.current.stop();
      setIsRecording(false);
    } catch (error) {
      console.error('Error stopping recording:', error);
    }
  };

  // Start the interview
  const startInterview = async () => {
    // Reset conversation and feedback
    setConversation([]);
    setFeedback(null);
    setTranscription('');
    
    // Setup microphone
    const micSetupSuccess = await setupMicrophone();
    
    if (!micSetupSuccess) {
      console.error('Failed to set up microphone');
      return;
    }
    
    // Set interview as active
    setIsInterviewActive(true);
    setStatus('thinking');
    
    // Generate the first question
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

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Voice Interview Practice</h1>
      </div>

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
                    {status === 'speaking' && 'AI is speaking...'}
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
                      {message.timestamp.toLocaleTimeString()}
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
  );
}