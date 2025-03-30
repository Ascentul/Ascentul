import React from 'react';
import { Link } from 'wouter';
import { ArrowRight, Briefcase, GraduationCap, Users, Building, Award, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Solutions() {
  return (
    <div>
      {/* Hero Section */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-6">Comprehensive Career Solutions</h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              CareerPilot provides tailored solutions for individuals at every career stage and organizations supporting professional development.
            </p>
          </div>
        </div>
      </section>

      {/* Solutions Tabs */}
      <section className="pb-20">
        <div className="container mx-auto px-4">
          <Tabs defaultValue="individuals" className="max-w-4xl mx-auto">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="individuals">For Individuals</TabsTrigger>
              <TabsTrigger value="universities">For Universities</TabsTrigger>
              <TabsTrigger value="organizations">For Organizations</TabsTrigger>
            </TabsList>
            
            <TabsContent value="individuals" className="mt-6">
              <div className="space-y-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
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
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
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
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
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
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="universities" className="mt-6">
              <div className="space-y-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
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
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
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
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="organizations" className="mt-6">
              <div className="space-y-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                  <div>
                    <div className="bg-primary/10 h-14 w-14 rounded-lg flex items-center justify-center mb-4">
                      <Building className="h-8 w-8 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold mb-4">Corporate Career Development</h2>
                    <p className="text-muted-foreground mb-6">
                      Invest in your employees' growth with tools that support their professional development. 
                      Our corporate solutions help organizations build a culture of continuous learning and advancement.
                    </p>
                    <ul className="space-y-2 mb-6">
                      <li className="flex items-start">
                        <span className="text-primary mr-2">✓</span>
                        Bulk employee access with custom branding
                      </li>
                      <li className="flex items-start">
                        <span className="text-primary mr-2">✓</span>
                        Integration with existing HR systems
                      </li>
                      <li className="flex items-start">
                        <span className="text-primary mr-2">✓</span>
                        Admin dashboard for tracking utilization
                      </li>
                      <li className="flex items-start">
                        <span className="text-primary mr-2">✓</span>
                        Custom career pathways aligned with organization structure
                      </li>
                    </ul>
                    <Button variant="outline" className="flex items-center">
                      Contact Sales <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                  <div className="rounded-lg bg-gradient-to-br from-primary/5 to-primary/20 p-8 h-80 flex items-center justify-center">
                    <div className="text-center">
                      <Building className="h-16 w-16 text-primary/60 mx-auto mb-4" />
                      <p className="text-xl font-medium text-primary/70">Corporate Solutions</p>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                  <div className="order-2 md:order-1 rounded-lg bg-gradient-to-br from-primary/5 to-primary/20 p-8 h-80 flex items-center justify-center">
                    <div className="text-center">
                      <Users className="h-16 w-16 text-primary/60 mx-auto mb-4" />
                      <p className="text-xl font-medium text-primary/70">Talent Development</p>
                    </div>
                  </div>
                  <div className="order-1 md:order-2">
                    <div className="bg-primary/10 h-14 w-14 rounded-lg flex items-center justify-center mb-4">
                      <Users className="h-8 w-8 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold mb-4">Talent Management & Retention</h2>
                    <p className="text-muted-foreground mb-6">
                      Improve employee satisfaction and retention by providing clear career development paths and 
                      resources. Help your team grow within your organization rather than looking elsewhere.
                    </p>
                    <ul className="space-y-2 mb-6">
                      <li className="flex items-start">
                        <span className="text-primary mr-2">✓</span>
                        Internal career path visualization
                      </li>
                      <li className="flex items-start">
                        <span className="text-primary mr-2">✓</span>
                        Skill gap analysis and development plans
                      </li>
                      <li className="flex items-start">
                        <span className="text-primary mr-2">✓</span>
                        Goal alignment with organizational objectives
                      </li>
                      <li className="flex items-start">
                        <span className="text-primary mr-2">✓</span>
                        Progress reporting and achievement tracking
                      </li>
                    </ul>
                    <Button variant="outline" className="flex items-center">
                      Request Demo <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Case Studies */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Success Stories</h2>
            <p className="text-lg text-muted-foreground">
              See how organizations and institutions are achieving their goals with CareerPilot.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-card rounded-xl overflow-hidden shadow-sm">
              <div className="h-48 bg-gradient-to-r from-primary/20 to-primary/40 flex items-center justify-center">
                <GraduationCap className="h-16 w-16 text-primary" />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2">State University</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Increased graduate employment rates by 32% within one year of implementing CareerPilot's University Edition.
                </p>
                <Button variant="link" className="p-0 h-auto flex items-center text-primary">
                  Read Case Study <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="bg-card rounded-xl overflow-hidden shadow-sm">
              <div className="h-48 bg-gradient-to-r from-primary/20 to-primary/40 flex items-center justify-center">
                <Building className="h-16 w-16 text-primary" />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2">TechCorp Inc.</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Reduced employee turnover by 24% and improved internal promotion rates through structured career development.
                </p>
                <Button variant="link" className="p-0 h-auto flex items-center text-primary">
                  Read Case Study <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="bg-card rounded-xl overflow-hidden shadow-sm">
              <div className="h-48 bg-gradient-to-r from-primary/20 to-primary/40 flex items-center justify-center">
                <Users className="h-16 w-16 text-primary" />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2">Global Consulting Group</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Streamlined onboarding and professional development, saving over 2,000 HR hours annually.
                </p>
                <Button variant="link" className="p-0 h-auto flex items-center text-primary">
                  Read Case Study <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center bg-primary/5 rounded-xl p-10">
            <h2 className="text-2xl font-bold mb-4">Find the Right Solution for Your Needs</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Whether you're an individual looking to advance your career, a university supporting your students, 
              or an organization developing your talent, we have solutions designed for you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/pricing">
                <Button size="lg">
                  View Pricing
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Button variant="outline" size="lg">
                Contact Sales
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}