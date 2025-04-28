import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mic } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function VoicePractice() {
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState('idle'); // 'idle', 'listening', 'thinking', 'speaking'
  const [selectedApplication, setSelectedApplication] = useState('');

  // Mock data for the dropdown
  const mockApplications = [
    { id: '1', title: 'Software Engineer at Google' },
    { id: '2', title: 'Product Manager at Amazon' },
    { id: '3', title: 'Data Scientist at Meta' }
  ];

  const startRecording = () => {
    setIsRecording(true);
    setStatus('listening');
  };

  const stopRecording = () => {
    setIsRecording(false);
    setStatus('idle');
    // In a real implementation, this would trigger AI processing
    // and then set status to 'thinking' and later 'speaking'
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
            <Select 
              value={selectedApplication} 
              onValueChange={setSelectedApplication}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a job to practice for" />
              </SelectTrigger>
              <SelectContent>
                {mockApplications.map(app => (
                  <SelectItem key={app.id} value={app.id}>
                    {app.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col items-center justify-center mt-6">
            <Button
              variant="default"
              size="lg"
              className={`w-40 h-40 rounded-full flex items-center justify-center transition-all ${
                isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-primary hover:bg-primary/90'
              }`}
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onTouchStart={startRecording}
              onTouchEnd={stopRecording}
            >
              <Mic className="w-16 h-16" />
            </Button>
            <p className="mt-4 text-center text-lg font-medium">
              {status === 'idle' && 'Hold to Speak'}
              {status === 'listening' && <span className="text-green-500">Listening...</span>}
              {status === 'thinking' && <span className="text-amber-500">Thinking...</span>}
              {status === 'speaking' && <span className="text-blue-500">Speaking...</span>}
            </p>
            <p className="mt-2 text-sm text-muted-foreground text-center">
              {status === 'idle' && 'Press and hold the microphone button to start speaking'}
              {status === 'listening' && 'Release the button when you finish speaking'}
              {status === 'thinking' && 'AI is generating a response to your answer'}
              {status === 'speaking' && 'AI is providing feedback on your answer'}
            </p>
          </div>
          
          <div className="mt-12 w-full max-w-md">
            <Card className="bg-muted/40">
              <CardContent className="p-4">
                <h3 className="font-medium mb-2">Tips:</h3>
                <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                  <li>Speak clearly and at a moderate pace</li>
                  <li>Select a specific job application for tailored practice</li>
                  <li>Try different types of questions to practice your skills</li>
                  <li>Review AI feedback to improve your interview performance</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Conversation History</CardTitle>
          <CardDescription>
            Your conversation with the AI interview assistant will appear here
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            Start speaking to see your conversation
          </div>
        </CardContent>
      </Card>
    </div>
  );
}