import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mic, PlayCircle, StopCircle, PauseCircle, Settings, Briefcase, Clock, Calendar } from 'lucide-react';

export default function VoicePractice() {
  const [isRecording, setIsRecording] = useState(false);
  const [currentTab, setCurrentTab] = useState('common');

  const interviewQuestions = {
    common: [
      "Tell me about yourself.",
      "What are your greatest strengths?",
      "What do you consider to be your weaknesses?",
      "Why do you want to work here?",
      "Where do you see yourself in 5 years?",
      "Why should we hire you?",
      "What is your greatest professional achievement?",
      "Describe a challenging work situation and how you overcame it.",
      "How do you handle stress and pressure?",
      "What are your salary expectations?"
    ],
    behavioral: [
      "Tell me about a time when you had to work with a difficult colleague.",
      "Describe a situation where you had to meet a tight deadline.",
      "Tell me about a time you failed and how you handled it.",
      "Give me an example of when you showed leadership qualities.",
      "Describe a time when you had to make a difficult decision.",
      "Tell me about a time when you had to adapt to significant changes at work.",
      "Give an example of a goal you reached and how you achieved it.",
      "Describe a situation where you had to work as part of a team.",
      "Tell me about a time you went above and beyond for a project.",
      "Describe a time when you had to resolve a conflict at work."
    ],
    technical: [
      "Explain a complex technical concept in simple terms.",
      "How do you stay updated with the latest technologies in your field?",
      "Describe a technical challenge you faced and how you solved it.",
      "What technical skills do you think are most important for this role?",
      "How do you approach learning a new technology or tool?",
      "Tell me about a technical project you're most proud of.",
      "How do you ensure quality in your technical work?",
      "Describe your experience with [specific technology/framework].",
      "How do you handle technical disagreements with team members?",
      "What's your process for troubleshooting technical issues?"
    ]
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // In a real implementation, this would start/stop recording using the browser's Web Audio API
  };

  return (
    <div className="container mx-auto py-6 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Voice Interview Practice</h1>
        <Button variant="outline" size="sm">
          <Settings className="w-4 h-4 mr-2" />
          Settings
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Practice Session</CardTitle>
              <CardDescription>
                Record your answers to common interview questions and get AI feedback on your responses.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="common" className="w-full" onValueChange={(value) => setCurrentTab(value)}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="common">Common</TabsTrigger>
                  <TabsTrigger value="behavioral">Behavioral</TabsTrigger>
                  <TabsTrigger value="technical">Technical</TabsTrigger>
                </TabsList>
                
                {Object.keys(interviewQuestions).map((category) => (
                  <TabsContent key={category} value={category} className="h-[400px] overflow-y-auto">
                    <div className="space-y-4">
                      {interviewQuestions[category as keyof typeof interviewQuestions].map((question, index) => (
                        <Card key={index} className="bg-white hover:bg-gray-50 transition-colors">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-lg">{question}</CardTitle>
                          </CardHeader>
                          <CardFooter className="flex justify-end pt-2">
                            <Button variant="secondary" size="sm">
                              <PlayCircle className="w-4 h-4 mr-2" />
                              Practice This Question
                            </Button>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Record Answer</CardTitle>
              <CardDescription>
                Click to start recording your interview response
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <div className="w-32 h-32 flex items-center justify-center bg-muted rounded-full mb-4">
                <Button
                  variant={isRecording ? "destructive" : "default"}
                  size="lg"
                  className="w-24 h-24 rounded-full"
                  onClick={toggleRecording}
                >
                  {isRecording ? (
                    <StopCircle className="w-12 h-12" />
                  ) : (
                    <Mic className="w-12 h-12" />
                  )}
                </Button>
              </div>
              <div className="text-center">
                {isRecording ? (
                  <div className="text-destructive font-medium">Recording... 00:15</div>
                ) : (
                  <div className="text-muted-foreground">Press to start recording</div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-center">
              <Button variant="outline" className="mr-2" disabled={!isRecording}>
                <PauseCircle className="w-4 h-4 mr-2" />
                Pause
              </Button>
              <Button variant="outline" disabled={!isRecording}>
                <StopCircle className="w-4 h-4 mr-2" />
                Stop
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Upcoming Interviews</CardTitle>
              <CardDescription>
                Your scheduled interviews
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <Calendar className="w-5 h-5 mt-0.5 text-primary" />
                  <div>
                    <h4 className="font-medium">Agency73</h4>
                    <p className="text-sm text-muted-foreground">April 28, 2025 at 1:00 PM</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Calendar className="w-5 h-5 mt-0.5 text-primary" />
                  <div>
                    <h4 className="font-medium">Rochester Regional Health</h4>
                    <p className="text-sm text-muted-foreground">April 30, 2025 at 10:30 AM</p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">
                <Briefcase className="w-4 h-4 mr-2" />
                View All Applications
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>

      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Practice Sessions</CardTitle>
            <CardDescription>
              Review your previous interview practice sessions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-4">
                  <Clock className="w-5 h-5 text-primary" />
                  <div>
                    <h4 className="font-medium">Tell me about yourself</h4>
                    <p className="text-sm text-muted-foreground">April 25, 2025 • 2:34 PM</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  <PlayCircle className="w-4 h-4 mr-2" />
                  Play
                </Button>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-4">
                  <Clock className="w-5 h-5 text-primary" />
                  <div>
                    <h4 className="font-medium">Why do you want to work here?</h4>
                    <p className="text-sm text-muted-foreground">April 24, 2025 • 11:15 AM</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  <PlayCircle className="w-4 h-4 mr-2" />
                  Play
                </Button>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-4">
                  <Clock className="w-5 h-5 text-primary" />
                  <div>
                    <h4 className="font-medium">What are your greatest strengths?</h4>
                    <p className="text-sm text-muted-foreground">April 22, 2025 • 4:45 PM</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  <PlayCircle className="w-4 h-4 mr-2" />
                  Play
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full">View All Practice Sessions</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}