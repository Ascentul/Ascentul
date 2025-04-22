import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { FileEdit, Search, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ApplyWizard } from '@/components/apply/ApplyWizard';
import { ApplicationCard } from '@/components/apply/ApplicationCard';

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4 } }
};

const subtleUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

export default function Apply() {
  const [showApplyWizard, setShowApplyWizard] = useState(false);
  
  // Get the most recent applications to show on this page
  const { data: recentApplications, isLoading } = useQuery({
    queryKey: ['/api/job-applications', 'recent'],
    queryFn: async () => {
      const response = await fetch('/api/job-applications?limit=3');
      if (!response.ok) throw new Error('Failed to fetch recent applications');
      return response.json();
    }
  });

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      className="container mx-auto py-8 max-w-6xl"
    >
      <motion.div 
        variants={subtleUp} 
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Application Agent</h1>
          <p className="text-muted-foreground mt-1">Apply to jobs with AI assistance and track your applications all in one place</p>
        </div>
        <Button size="lg" onClick={() => setShowApplyWizard(true)}>
          <FileEdit className="mr-2 h-5 w-5" />
          Start New Application
        </Button>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <motion.div 
          variants={subtleUp} 
          className="col-span-2 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-8 flex flex-col justify-between"
        >
          <div>
            <h2 className="text-2xl font-semibold mb-2">Let AI help you land your dream job</h2>
            <p className="text-gray-600 mb-4">
              Our Application Agent guides you through every step of the job application process, from finding jobs to sending follow-ups.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                  <Search className="h-5 w-5 text-blue-700" />
                </div>
                <h3 className="font-medium">Find Jobs</h3>
                <p className="text-sm text-gray-500 mt-1">Import job listings and save them for later</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center mb-3">
                  <FileEdit className="h-5 w-5 text-indigo-700" />
                </div>
                <h3 className="font-medium">Apply with AI</h3>
                <p className="text-sm text-gray-500 mt-1">Get tailored resumes and cover letters</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center mb-3">
                  <ArrowRight className="h-5 w-5 text-purple-700" />
                </div>
                <h3 className="font-medium">Track Progress</h3>
                <p className="text-sm text-gray-500 mt-1">Follow your applications from start to finish</p>
              </div>
            </div>
          </div>
          <Button size="lg" className="mt-8 w-full md:w-auto" onClick={() => setShowApplyWizard(true)}>
            Start a New Application
          </Button>
        </motion.div>

        <motion.div variants={subtleUp} className="col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Recent Applications</CardTitle>
              <CardDescription>Your most recent job applications</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  <div className="h-24 bg-muted rounded-md animate-pulse" />
                  <div className="h-24 bg-muted rounded-md animate-pulse" />
                </div>
              ) : recentApplications && recentApplications.length > 0 ? (
                <div className="space-y-3">
                  {recentApplications.map(app => (
                    <div key={app.id} className="border rounded-md p-2">
                      <ApplicationCard 
                        application={app} 
                        isSelected={false} 
                        onClick={() => {}} 
                        className="h-auto border-none shadow-none" 
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-muted-foreground">No applications yet</p>
                  <Button variant="link" className="mt-2" onClick={() => setShowApplyWizard(true)}>
                    Create your first application
                  </Button>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" onClick={() => window.location.href = '/interviews'}>
                View All Applications
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      </div>

      <motion.div variants={subtleUp} className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
            <CardDescription>Our AI-driven application process helps you stand out</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-slate-50 p-4 rounded-lg">
                <div className="bg-primary/10 text-primary rounded-full w-8 h-8 flex items-center justify-center font-bold mb-3">1</div>
                <h3 className="font-medium">Import Job</h3>
                <p className="text-sm text-muted-foreground mt-1">Enter a job URL or paste details to save an interesting position</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-lg">
                <div className="bg-primary/10 text-primary rounded-full w-8 h-8 flex items-center justify-center font-bold mb-3">2</div>
                <h3 className="font-medium">Analyze & Optimize</h3>
                <p className="text-sm text-muted-foreground mt-1">Our AI analyzes the job and suggests tailored resume and cover letter updates</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-lg">
                <div className="bg-primary/10 text-primary rounded-full w-8 h-8 flex items-center justify-center font-bold mb-3">3</div>
                <h3 className="font-medium">Apply with Confidence</h3>
                <p className="text-sm text-muted-foreground mt-1">Submit your optimized application and track its status</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-lg">
                <div className="bg-primary/10 text-primary rounded-full w-8 h-8 flex items-center justify-center font-bold mb-3">4</div>
                <h3 className="font-medium">Follow-up & Prepare</h3>
                <p className="text-sm text-muted-foreground mt-1">Get AI-written follow-ups and interview preparation assistance</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
      
      {/* Apply Wizard Dialog */}
      <ApplyWizard 
        isOpen={showApplyWizard}
        onClose={() => setShowApplyWizard(false)}
      />
    </motion.div>
  );
}