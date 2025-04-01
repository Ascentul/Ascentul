import React from 'react';
import { Link } from 'wouter';
import { ArrowRight, Briefcase, GraduationCap, Users, Building, Award, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';

export default function Solutions() {
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
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="max-w-4xl mx-auto text-center"
          >
            <h1 className="text-3xl md:text-4xl font-bold mb-6">Comprehensive Career Solutions</h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              CareerTracker.io provides tailored solutions for individuals at every career stage and organizations supporting professional development.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Solutions Tabs */}
      <section className="pb-20">
        <div className="container mx-auto px-4">
          <Tabs defaultValue="individuals" className="max-w-4xl mx-auto">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="individuals">For Individuals</TabsTrigger>
              <TabsTrigger value="universities">For Universities</TabsTrigger>
            </TabsList>

            <TabsContent value="individuals" className="mt-6">
              <motion.div 
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                variants={staggerContainer}
                className="space-y-12"
              >
                <motion.div variants={staggerItem} className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                  <div>
                    <div className="bg-primary/10 h-14 w-14 rounded-lg flex items-center justify-center mb-4">
                      <Briefcase className="h-8 w-8 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold mb-4">Career Exploration & Planning</h2>
                    <p className="text-muted-foreground mb-6">
                      Discover career paths that match your skills and interests. Set meaningful professional 
                      goals and track your progress towards achieving them with our intuitive goal tracking system.
                    </p>
                    <ul className="space-y-2 mb-6">
                      <li className="flex items-start">
                        <span className="text-primary mr-2">✓</span>
                        AI-powered career recommendations
                      </li>
                      <li className="flex items-start">
                        <span className="text-primary mr-2">✓</span>
                        Personalized goal setting and tracking
                      </li>
                      <li className="flex items-start">
                        <span className="text-primary mr-2">✓</span>
                        Progress visualization and milestone tracking
                      </li>
                    </ul>
                    <Link href="/auth">
                      <Button className="flex items-center">
                        Get Started <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                  <div className="rounded-lg bg-gradient-to-br from-primary/5 to-primary/20 p-8 h-80 flex items-center justify-center">
                    <div className="text-center">
                      <Target className="h-16 w-16 text-primary/60 mx-auto mb-4" />
                      <p className="text-xl font-medium text-primary/70">Career Roadmap</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div variants={staggerItem} className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                  <div className="order-2 md:order-1 rounded-lg bg-gradient-to-br from-primary/5 to-primary/20 p-8 h-80 flex items-center justify-center">
                    <div className="text-center">
                      <Award className="h-16 w-16 text-primary/60 mx-auto mb-4" />
                      <p className="text-xl font-medium text-primary/70">Professional Development</p>
                    </div>
                  </div>
                  <div className="order-1 md:order-2">
                    <div className="bg-primary/10 h-14 w-14 rounded-lg flex items-center justify-center mb-4">
                      <Award className="h-8 w-8 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold mb-4">Professional Document Creation</h2>
                    <p className="text-muted-foreground mb-6">
                      Create polished, tailored resumes and cover letters that stand out to employers. 
                      Our AI tools help you highlight your strengths and match job requirements with precision.
                    </p>
                    <ul className="space-y-2 mb-6">
                      <li className="flex items-start">
                        <span className="text-primary mr-2">✓</span>
                        Multiple resume templates and customization options
                      </li>
                      <li className="flex items-start">
                        <span className="text-primary mr-2">✓</span>
                        AI-powered content suggestions specific to job postings
                      </li>
                      <li className="flex items-start">
                        <span className="text-primary mr-2">✓</span>
                        Cover letter generation with personalization
                      </li>
                    </ul>
                    <Link href="/auth">
                      <Button className="flex items-center">
                        Get Started <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </motion.div>

                <motion.div variants={staggerItem} className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                  <div>
                    <div className="bg-primary/10 h-14 w-14 rounded-lg flex items-center justify-center mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-primary">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                        <path d="M8 14h.01"></path>
                        <path d="M12 14h.01"></path>
                        <path d="M16 14h.01"></path>
                        <path d="M8 18h.01"></path>
                        <path d="M12 18h.01"></path>
                        <path d="M16 18h.01"></path>
                      </svg>
                    </div>
                    <h2 className="text-2xl font-bold mb-4">Interview Preparation & Tracking</h2>
                    <p className="text-muted-foreground mb-6">
                      Master the interview process with realistic practice sessions and AI feedback. 
                      Track your job applications and interview stages all in one place.
                    </p>
                    <ul className="space-y-2 mb-6">
                      <li className="flex items-start">
                        <span className="text-primary mr-2">✓</span>
                        AI-generated interview questions specific to job roles
                      </li>
                      <li className="flex items-start">
                        <span className="text-primary mr-2">✓</span>
                        Practice interview sessions with feedback
                      </li>
                      <li className="flex items-start">
                        <span className="text-primary mr-2">✓</span>
                        Interview process tracking with follow-up reminders
                      </li>
                    </ul>
                    <Link href="/auth">
                      <Button className="flex items-center">
                        Get Started <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                  <div className="rounded-lg bg-gradient-to-br from-primary/5 to-primary/20 p-8 h-80 flex items-center justify-center">
                    <div className="text-center">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-16 w-16 text-primary/60 mx-auto mb-4">
                        <path d="M21 2H3v16h5v4l4-4h5l4-4V2z"></path>
                        <path d="M12 6v4"></path>
                        <path d="M12 14h.01"></path>
                      </svg>
                      <p className="text-xl font-medium text-primary/70">Interview Mastery</p>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </TabsContent>

            <TabsContent value="universities" className="mt-6">
              <motion.div 
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                variants={staggerContainer}
                className="space-y-12"
              >
                <motion.div variants={staggerItem} className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                  <div>
                    <div className="bg-primary/10 h-14 w-14 rounded-lg flex items-center justify-center mb-4">
                      <GraduationCap className="h-8 w-8 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold mb-4">University Edition Platform</h2>
                    <p className="text-muted-foreground mb-6">
                      Provide your students with comprehensive career development tools that integrate with their 
                      academic journey. Our University Edition helps bridge the gap between education and career success.
                    </p>
                    <ul className="space-y-2 mb-6">
                      <li className="flex items-start">
                        <span className="text-primary mr-2">✓</span>
                        University branding and customization
                      </li>
                      <li className="flex items-start">
                        <span className="text-primary mr-2">✓</span>
                        Admin dashboard for monitoring and support
                      </li>
                      <li className="flex items-start">
                        <span className="text-primary mr-2">✓</span>
                        Integration with university career services
                      </li>
                      <li className="flex items-start">
                        <span className="text-primary mr-2">✓</span>
                        Bulk license management for student access
                      </li>
                    </ul>
                    <Button variant="outline" className="flex items-center">
                      Contact Us <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                  <div className="rounded-lg bg-gradient-to-br from-primary/5 to-primary/20 p-8 h-80 flex items-center justify-center">
                    <div className="text-center">
                      <GraduationCap className="h-16 w-16 text-primary/60 mx-auto mb-4" />
                      <p className="text-xl font-medium text-primary/70">University Solution</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div variants={staggerItem} className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                  <div className="order-2 md:order-1 rounded-lg bg-gradient-to-br from-primary/5 to-primary/20 p-8 h-80 flex items-center justify-center">
                    <div className="text-center">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-16 w-16 text-primary/60 mx-auto mb-4">
                        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path>
                      </svg>
                      <p className="text-xl font-medium text-primary/70">Academic Planning</p>
                    </div>
                  </div>
                  <div className="order-1 md:order-2">
                    <div className="bg-primary/10 h-14 w-14 rounded-lg flex items-center justify-center mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-primary">
                        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path>
                      </svg>
                    </div>
                    <h2 className="text-2xl font-bold mb-4">Learning Management Features</h2>
                    <p className="text-muted-foreground mb-6">
                      Enhance your students' academic journey with tools that connect coursework to career outcomes. 
                      Study planning, assignment tracking, and learning modules help create well-rounded professionals.
                    </p>
                    <ul className="space-y-2 mb-6">
                      <li className="flex items-start">
                        <span className="text-primary mr-2">✓</span>
                        Study plan creation and management
                      </li>
                      <li className="flex items-start">
                        <span className="text-primary mr-2">✓</span>
                        Course tracking and assignment management
                      </li>
                      <li className="flex items-start">
                        <span className="text-primary mr-2">✓</span>
                        Learning modules with career relevance
                      </li>
                      <li className="flex items-start">
                        <span className="text-primary mr-2">✓</span>
                        Progress tracking and reporting
                      </li>
                    </ul>
                    <Button variant="outline" className="flex items-center">
                      Learn More <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              </motion.div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="max-w-3xl mx-auto text-center"
          >
            <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Career Journey?</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join thousands of professionals and organizations who trust CareerTracker.io for their career development needs.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/auth">
                <Button size="lg" className="w-full sm:w-auto">
                  Get Started <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/pricing">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  View Pricing <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}