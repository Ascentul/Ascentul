import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { ArrowRight, Briefcase, GraduationCap, Target, Award, BarChart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LoginDialog from '@/components/LoginDialog';
import heroImage from '@assets/magnet-me-315vPGsAFUk-unsplash_1743396890960.jpg';

export default function Home() {
  const [showSignupDialog, setShowSignupDialog] = useState(false);
  const [, setLocation] = useLocation();
  
  return (
    <div>
      {/* Hero Section */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="text-left">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6">
                Navigate Your Career Journey with <span className="text-primary">AI-Powered</span> Guidance
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                From resume building to interview prep, goal tracking to AI coaching, CareerTracker.io gives you the tools to take control of your professional future.
              </p>
              <div className="flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-4">
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto"
                  onClick={() => setShowSignupDialog(true)}
                >
                  Get Started for Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="w-full sm:w-auto"
                  onClick={() => setLocation('/solutions')}
                >
                  Learn More
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
            <div className="order-first md:order-last">
              <img 
                src={heroImage} 
                alt="Professional woman working on laptop" 
                className="w-full h-auto rounded-xl shadow-lg object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Everything You Need for Career Success</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our comprehensive suite of tools helps you plan, prepare, and progress at every stage of your career.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-card rounded-xl p-6 shadow-sm">
              <div className="mb-4 bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center">
                <Briefcase className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Professional Document Builder</h3>
              <p className="text-muted-foreground mb-4">
                Create customized resumes and cover letters tailored to specific job applications with AI assistance.
              </p>
              <button 
                onClick={() => setShowSignupDialog(true)}
                className="text-primary font-medium flex items-center hover:underline bg-transparent border-none p-0 cursor-pointer"
              >
                Get started <ArrowRight className="ml-1 h-4 w-4" />
              </button>
            </div>

            <div className="bg-card rounded-xl p-6 shadow-sm">
              <div className="mb-4 bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Career Goal Tracking</h3>
              <p className="text-muted-foreground mb-4">
                Set, track, and achieve your professional goals with intelligent progress tracking and reminders.
              </p>
              <button 
                onClick={() => setShowSignupDialog(true)}
                className="text-primary font-medium flex items-center hover:underline bg-transparent border-none p-0 cursor-pointer"
              >
                Get started <ArrowRight className="ml-1 h-4 w-4" />
              </button>
            </div>

            <div className="bg-card rounded-xl p-6 shadow-sm">
              <div className="mb-4 bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center">
                <GraduationCap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">University Edition</h3>
              <p className="text-muted-foreground mb-4">
                Specialized tools for university students including study plans, learning modules, and academic tracking.
              </p>
              <button 
                onClick={() => setShowSignupDialog(true)}
                className="text-primary font-medium flex items-center hover:underline bg-transparent border-none p-0 cursor-pointer"
              >
                Get started <ArrowRight className="ml-1 h-4 w-4" />
              </button>
            </div>

            <div className="bg-card rounded-xl p-6 shadow-sm">
              <div className="mb-4 bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center">
                <BarChart className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Interview Preparation</h3>
              <p className="text-muted-foreground mb-4">
                Practice interviews with AI-generated questions specific to your industry and role, with feedback and improvement tips.
              </p>
              <button 
                onClick={() => setShowSignupDialog(true)}
                className="text-primary font-medium flex items-center hover:underline bg-transparent border-none p-0 cursor-pointer"
              >
                Get started <ArrowRight className="ml-1 h-4 w-4" />
              </button>
            </div>

            <div className="bg-card rounded-xl p-6 shadow-sm">
              <div className="mb-4 bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center">
                <Award className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Gamified Experience</h3>
              <p className="text-muted-foreground mb-4">
                Earn XP, unlock achievements, and track your progress as you develop your career skills and hit milestones.
              </p>
              <button 
                onClick={() => setShowSignupDialog(true)}
                className="text-primary font-medium flex items-center hover:underline bg-transparent border-none p-0 cursor-pointer"
              >
                Get started <ArrowRight className="ml-1 h-4 w-4" />
              </button>
            </div>

            <div className="bg-card rounded-xl p-6 shadow-sm">
              <div className="mb-4 bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-primary">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">AI Career Coach</h3>
              <p className="text-muted-foreground mb-4">
                Get personalized career advice and guidance from our AI coach that adapts to your unique situation.
              </p>
              <button 
                onClick={() => setShowSignupDialog(true)}
                className="text-primary font-medium flex items-center hover:underline bg-transparent border-none p-0 cursor-pointer"
              >
                Get started <ArrowRight className="ml-1 h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">What Our Users Say</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Join thousands of professionals who have transformed their careers with CareerTracker.io.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-card rounded-xl p-6 shadow-sm">
              <div className="flex items-center mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    className="h-5 w-5 text-yellow-400 fill-current"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                  </svg>
                ))}
              </div>
              <p className="text-muted-foreground mb-4">
                "CareerTracker.io helped me land my dream job. The AI interview coach was incredibly useful in preparing me for tough questions."
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold mr-3">
                  JD
                </div>
                <div>
                  <p className="font-medium">Jamie Davis</p>
                  <p className="text-sm text-muted-foreground">Software Engineer</p>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl p-6 shadow-sm">
              <div className="flex items-center mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    className="h-5 w-5 text-yellow-400 fill-current"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                  </svg>
                ))}
              </div>
              <p className="text-muted-foreground mb-4">
                "The goal tracking feature helps me stay focused and motivated. I've accomplished more in 6 months than I did in the past 2 years."
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold mr-3">
                  SK
                </div>
                <div>
                  <p className="font-medium">Sarah Kim</p>
                  <p className="text-sm text-muted-foreground">Marketing Director</p>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl p-6 shadow-sm">
              <div className="flex items-center mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    className="h-5 w-5 text-yellow-400 fill-current"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                  </svg>
                ))}
              </div>
              <p className="text-muted-foreground mb-4">
                "As a university student, the University Edition has been invaluable for planning my courses and mapping my career path after graduation."
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold mr-3">
                  RJ
                </div>
                <div>
                  <p className="font-medium">Ryan Jones</p>
                  <p className="text-sm text-muted-foreground">Computer Science Student</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Start Your Career Journey Today</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join thousands of professionals and students who are taking control of their future with CareerTracker.io.
            </p>
            <Button 
              size="lg"
              onClick={() => setShowSignupDialog(true)}
            >
              Get Started for Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>
      {/* Login/Signup Dialog */}
      <LoginDialog 
        open={showSignupDialog} 
        onOpenChange={setShowSignupDialog} 
        initialTab="signup" 
      />
    </div>
  );
}