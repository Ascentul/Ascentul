import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { 
  ArrowRight, 
  Briefcase, 
  GraduationCap, 
  Target, 
  Award, 
  BarChart, 
  Shield, 
  CheckCircle2, 
  Users, 
  Building, 
  BookOpen,
  LucideIcon
} from 'lucide-react';
import { motion } from "framer-motion";
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import LoginDialog from '@/components/LoginDialog';
import heroImage from '@assets/magnet-me-315vPGsAFUk-unsplash_1743396890960.jpg';

export default function Home() {
  const [showSignupDialog, setShowSignupDialog] = useState(false);
  const [, setLocation] = useLocation();
  
  // Animation variants
  const fadeIn = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.6 } }
  };
  
  const fadeInUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };
  
  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };
  
  const staggerItem = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };
  
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
              <div className="flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-4 mb-8">
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
              
              {/* Trust Badges */}
              <div className="flex flex-wrap items-center gap-4 mt-4">
                <div className="flex items-center bg-card rounded-full px-3 py-1.5 border border-border">
                  <Shield className="h-4 w-4 text-green-600 mr-1.5" />
                  <span className="text-xs font-medium">Secure & Private</span>
                </div>
                <div className="flex items-center bg-card rounded-full px-3 py-1.5 border border-border">
                  <Users className="h-4 w-4 text-primary mr-1.5" />
                  <span className="text-xs font-medium">10,000+ Users</span>
                </div>
                <div className="flex items-center bg-card rounded-full px-3 py-1.5 border border-border">
                  <CheckCircle2 className="h-4 w-4 text-primary mr-1.5" />
                  <span className="text-xs font-medium">14-Day Money Back</span>
                </div>
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
      
      {/* Partners Section */}
      <section className="py-10 border-y border-border bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Trusted by universities and companies across the globe
            </p>
          </div>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12 lg:gap-16">
            <div className="flex items-center justify-center h-8 opacity-70 hover:opacity-100 transition-opacity">
              <Building className="h-6 w-6 mr-2 text-muted-foreground" />
              <span className="text-lg font-semibold text-muted-foreground">Stanford</span>
            </div>
            <div className="flex items-center justify-center h-8 opacity-70 hover:opacity-100 transition-opacity">
              <Building className="h-6 w-6 mr-2 text-muted-foreground" />
              <span className="text-lg font-semibold text-muted-foreground">Yale</span>
            </div>
            <div className="flex items-center justify-center h-8 opacity-70 hover:opacity-100 transition-opacity">
              <Building className="h-6 w-6 mr-2 text-muted-foreground" />
              <span className="text-lg font-semibold text-muted-foreground">Princeton</span>
            </div>
            <div className="flex items-center justify-center h-8 opacity-70 hover:opacity-100 transition-opacity">
              <Building className="h-6 w-6 mr-2 text-muted-foreground" />
              <span className="text-lg font-semibold text-muted-foreground">Berkeley</span>
            </div>
            <div className="flex items-center justify-center h-8 opacity-70 hover:opacity-100 transition-opacity">
              <Building className="h-6 w-6 mr-2 text-muted-foreground" />
              <span className="text-lg font-semibold text-muted-foreground">Harvard</span>
            </div>
          </div>
        </div>
      </section>
      
      {/* Press Section */}
      <section className="py-10 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Featured in
            </p>
          </div>
          <div className="flex flex-wrap justify-center items-center gap-12 md:gap-16 lg:gap-20">
            <div className="flex items-center justify-center h-8 opacity-60 hover:opacity-100 transition-opacity">
              <BookOpen className="h-5 w-5 mr-2 text-muted-foreground" />
              <span className="text-xl font-bold text-muted-foreground tracking-tight">FORBES</span>
            </div>
            <div className="flex items-center justify-center h-8 opacity-60 hover:opacity-100 transition-opacity">
              <BookOpen className="h-5 w-5 mr-2 text-muted-foreground" />
              <span className="text-xl font-bold text-muted-foreground tracking-tight">TechCrunch</span>
            </div>
            <div className="flex items-center justify-center h-8 opacity-60 hover:opacity-100 transition-opacity">
              <BookOpen className="h-5 w-5 mr-2 text-muted-foreground" />
              <span className="text-xl font-bold text-muted-foreground tracking-tight">WIRED</span>
            </div>
            <div className="flex items-center justify-center h-8 opacity-60 hover:opacity-100 transition-opacity">
              <BookOpen className="h-5 w-5 mr-2 text-muted-foreground" />
              <span className="text-xl font-bold text-muted-foreground tracking-tight">Fast Company</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div 
            initial="hidden" 
            whileInView="visible" 
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold mb-4">Everything You Need for Career Success</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our comprehensive suite of tools helps you plan, prepare, and progress at every stage of your career.
            </p>
          </motion.div>

          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            <motion.div className="bg-card rounded-xl p-6 shadow-sm" variants={staggerItem}>
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
            </motion.div>

            <motion.div className="bg-card rounded-xl p-6 shadow-sm" variants={staggerItem}>
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
            </motion.div>

            <motion.div className="bg-card rounded-xl p-6 shadow-sm" variants={staggerItem}>
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
            </motion.div>

            <motion.div className="bg-card rounded-xl p-6 shadow-sm" variants={staggerItem}>
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
            </motion.div>

            <motion.div className="bg-card rounded-xl p-6 shadow-sm" variants={staggerItem}>
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
            </motion.div>

            <motion.div className="bg-card rounded-xl p-6 shadow-sm" variants={staggerItem}>
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
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-16 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4">
          <motion.div 
            initial="hidden" 
            whileInView="visible" 
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">Our Impact in Numbers</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              CareerTracker.io has helped thousands of professionals and students worldwide.
            </p>
          </motion.div>
          
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            <motion.div variants={staggerItem} className="bg-card rounded-xl p-6 text-center shadow-sm border border-border">
              <h3 className="text-4xl font-bold text-primary mb-2">10k+</h3>
              <p className="text-muted-foreground">Active Users</p>
            </motion.div>
            <motion.div variants={staggerItem} className="bg-card rounded-xl p-6 text-center shadow-sm border border-border">
              <h3 className="text-4xl font-bold text-primary mb-2">93%</h3>
              <p className="text-muted-foreground">Interview Success Rate</p>
            </motion.div>
            <motion.div variants={staggerItem} className="bg-card rounded-xl p-6 text-center shadow-sm border border-border">
              <h3 className="text-4xl font-bold text-primary mb-2">50+</h3>
              <p className="text-muted-foreground">University Partners</p>
            </motion.div>
            <motion.div variants={staggerItem} className="bg-card rounded-xl p-6 text-center shadow-sm border border-border">
              <h3 className="text-4xl font-bold text-primary mb-2">4.9/5</h3>
              <p className="text-muted-foreground">Average Rating</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <motion.div 
            initial="hidden" 
            whileInView="visible" 
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold mb-4">What Our Users Say</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Join thousands of professionals who have transformed their careers with CareerTracker.io.
            </p>
          </motion.div>

          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            <motion.div variants={staggerItem} className="bg-card rounded-xl p-6 shadow-sm">
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
            </motion.div>

            <motion.div variants={staggerItem} className="bg-card rounded-xl p-6 shadow-sm">
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
            </motion.div>

            <motion.div variants={staggerItem} className="bg-card rounded-xl p-6 shadow-sm">
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
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-muted/20">
        <div className="container mx-auto px-4">
          <motion.div 
            initial="hidden" 
            whileInView="visible" 
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Get answers to common questions about CareerTracker.io.
            </p>
          </motion.div>
          
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={fadeIn}
            className="max-w-3xl mx-auto"
          >
            <Accordion type="single" collapsible className="space-y-4">
              <AccordionItem value="item-1" className="bg-card rounded-lg border border-border px-6">
                <AccordionTrigger className="text-left font-medium py-4">
                  What makes CareerTracker.io different from other career platforms?
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  CareerTracker.io combines powerful AI technology with gamification elements to make career development engaging and effective. Unlike other platforms, we offer a comprehensive ecosystem of tools specifically designed to address every aspect of your career journey, from resume building to interview preparation, all in one integrated platform.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-2" className="bg-card rounded-lg border border-border px-6">
                <AccordionTrigger className="text-left font-medium py-4">
                  How does the free plan compare to the pro subscription?
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  The free plan gives you access to basic features including resume builder, work history tracking, and limited goal setting. Pro subscribers get unlimited access to all features including AI interview coaching, advanced goal tracking, personalized career recommendations, priority support, and no usage limits on document generation.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-3" className="bg-card rounded-lg border border-border px-6">
                <AccordionTrigger className="text-left font-medium py-4">
                  Is my data secure and private?
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  Absolutely. We take data security and privacy seriously. All your data is encrypted both in transit and at rest. We never share your personal information with third parties without your explicit consent. You can export or delete your data at any time through your account settings.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-4" className="bg-card rounded-lg border border-border px-6">
                <AccordionTrigger className="text-left font-medium py-4">
                  How does the University Edition work?
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  The University Edition is designed for educational institutions to provide career development tools to their students. It includes all Pro features plus specialized tools for academic planning, study modules, and administrative dashboards for university staff. Students get access through their institution's license and can use it throughout their studies.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-5" className="bg-card rounded-lg border border-border px-6">
                <AccordionTrigger className="text-left font-medium py-4">
                  Can I cancel my subscription at any time?
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  Yes, you can cancel your subscription at any time directly from your account settings. When you cancel, you'll continue to have access to Pro features until the end of your current billing period. We don't offer refunds for partial subscription periods.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-b from-primary/10 to-primary/5">
        <div className="container mx-auto px-4">
          <motion.div 
            initial="hidden" 
            whileInView="visible" 
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="max-w-3xl mx-auto text-center"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Start Your Career Journey Today</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join thousands of professionals and students who are taking control of their future with CareerTracker.io.
            </p>
            
            <Button 
              size="lg"
              className="text-lg py-6 px-8 mb-6"
              onClick={() => setShowSignupDialog(true)}
            >
              Get Started for Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            
            {/* Trust indicators */}
            <div className="flex flex-wrap justify-center gap-8 mt-10 text-sm text-muted-foreground">
              <div className="flex items-center">
                <Shield className="h-5 w-5 mr-2 text-green-600" />
                <span>Secure & Private</span>
              </div>
              <div className="flex items-center">
                <CheckCircle2 className="h-5 w-5 mr-2 text-primary" />
                <span>14-Day Money Back</span>
              </div>
              <div className="flex items-center">
                <Users className="h-5 w-5 mr-2 text-primary" />
                <span>10,000+ Active Users</span>
              </div>
            </div>
            
            {/* Urgency message */}
            <p className="mt-8 text-sm italic text-muted-foreground">
              Take the first step toward a better career today. Free accounts available for a limited time.
            </p>
          </motion.div>
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