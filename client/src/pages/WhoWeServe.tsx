import React from 'react';
import { Link } from 'wouter';
import { ArrowRight, GraduationCap, Briefcase, Building, Users, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export default function WhoWeServe() {
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
            <h1 className="text-3xl md:text-4xl font-bold mb-6">Serving Every Career Journey</h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              CareerTracker.io is designed to support individuals at every stage of their professional journey, 
              as well as the organizations that help them grow.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Students and Recent Graduates */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-5xl mx-auto"
          >
            <div>
              <div className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-6">
                <GraduationCap className="h-4 w-4 mr-2" /> Students & Recent Graduates
              </div>
              <h2 className="text-3xl font-bold mb-4">Launch Your Career With Confidence</h2>
              <p className="text-muted-foreground mb-6">
                Starting your career journey can be challenging. CareerTracker.io provides the guidance, tools, and structure 
                you need to make a successful transition from academics to professional life.
              </p>
              
              <motion.div 
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                variants={staggerContainer}
                className="space-y-4 mb-8"
              >
                <motion.div variants={staggerItem} className="bg-background p-4 rounded-lg border border-border">
                  <h3 className="font-medium mb-2">Resume & Cover Letter Building</h3>
                  <p className="text-sm text-muted-foreground">
                    Create professional documents that stand out, even with limited work experience.
                  </p>
                </motion.div>
                
                <motion.div variants={staggerItem} className="bg-background p-4 rounded-lg border border-border">
                  <h3 className="font-medium mb-2">University to Career Transition</h3>
                  <p className="text-sm text-muted-foreground">
                    Special tools to help you connect academic achievements to workplace skills.
                  </p>
                </motion.div>
                
                <motion.div variants={staggerItem} className="bg-background p-4 rounded-lg border border-border">
                  <h3 className="font-medium mb-2">First Job Preparation</h3>
                  <p className="text-sm text-muted-foreground">
                    Interview practice, workplace etiquette guidance, and first-job success tips.
                  </p>
                </motion.div>
              </motion.div>
              
              <Link href="/auth">
                <Button className="flex items-center">
                  Get Student Access <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={fadeIn}
              className="rounded-xl bg-gradient-to-br from-primary/5 to-primary/20 p-10 flex items-center justify-center"
            >
              <div className="text-center">
                <GraduationCap className="h-24 w-24 text-primary/40 mx-auto mb-6" />
                <p className="text-xl font-medium text-primary/70">Student Success Path</p>
                <p className="mt-2 text-sm text-muted-foreground max-w-xs mx-auto">
                  From academic achievement to professional excellence
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Mid-Career Professionals */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-5xl mx-auto"
          >
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={fadeIn}
              className="order-2 lg:order-1 rounded-xl bg-gradient-to-br from-primary/5 to-primary/20 p-10 flex items-center justify-center"
            >
              <div className="text-center">
                <Briefcase className="h-24 w-24 text-primary/40 mx-auto mb-6" />
                <p className="text-xl font-medium text-primary/70">Career Advancement</p>
                <p className="mt-2 text-sm text-muted-foreground max-w-xs mx-auto">
                  Taking your professional journey to the next level
                </p>
              </div>
            </motion.div>
            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-6">
                <Briefcase className="h-4 w-4 mr-2" /> Mid-Career Professionals
              </div>
              <h2 className="text-3xl font-bold mb-4">Accelerate Your Professional Growth</h2>
              <p className="text-muted-foreground mb-6">
                Whether you're looking to advance in your current role, change career paths, or simply 
                refine your professional skills, CareerTracker.io provides tools to help you succeed.
              </p>
              
              <motion.div 
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                variants={staggerContainer}
                className="space-y-4 mb-8"
              >
                <motion.div variants={staggerItem} className="bg-background p-4 rounded-lg border border-border">
                  <h3 className="font-medium mb-2">Career Advancement Planning</h3>
                  <p className="text-sm text-muted-foreground">
                    Strategic goal setting and achievement tracking to help you reach your next level.
                  </p>
                </motion.div>
                
                <motion.div variants={staggerItem} className="bg-background p-4 rounded-lg border border-border">
                  <h3 className="font-medium mb-2">Professional Skill Development</h3>
                  <p className="text-sm text-muted-foreground">
                    Identify skill gaps and create development plans to remain competitive.
                  </p>
                </motion.div>
                
                <motion.div variants={staggerItem} className="bg-background p-4 rounded-lg border border-border">
                  <h3 className="font-medium mb-2">Career Change Support</h3>
                  <p className="text-sm text-muted-foreground">
                    Tools and guidance for successfully pivoting to new roles or industries.
                  </p>
                </motion.div>
              </motion.div>
              
              <Link href="/auth">
                <Button className="flex items-center">
                  Advance Your Career <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Universities */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-5xl mx-auto"
          >
            <div>
              <div className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-6">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4 mr-2"
                >
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                  <path d="M6 12v5c3 3 9 3 12 0v-5" />
                </svg>
                Universities & Educational Institutions
              </div>
              <h2 className="text-3xl font-bold mb-4">Prepare Students for Professional Success</h2>
              <p className="text-muted-foreground mb-6">
                Help your students bridge the gap between academic achievement and professional success with 
                our specialized University Edition platform tailored for higher education.
              </p>
              
              <motion.div 
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                variants={staggerContainer}
                className="space-y-4 mb-8"
              >
                <motion.div variants={staggerItem} className="bg-background p-4 rounded-lg border border-border">
                  <h3 className="font-medium mb-2">Institution-wide Licensing</h3>
                  <p className="text-sm text-muted-foreground">
                    Provide access to all students with customized branding and university-specific content.
                  </p>
                </motion.div>
                
                <motion.div variants={staggerItem} className="bg-background p-4 rounded-lg border border-border">
                  <h3 className="font-medium mb-2">LMS Integration</h3>
                  <p className="text-sm text-muted-foreground">
                    Connect career development with academic progress through learning management features.
                  </p>
                </motion.div>
                
                <motion.div variants={staggerItem} className="bg-background p-4 rounded-lg border border-border">
                  <h3 className="font-medium mb-2">Career Services Enhancement</h3>
                  <p className="text-sm text-muted-foreground">
                    Complement existing career services with scalable digital tools and resources.
                  </p>
                </motion.div>
              </motion.div>
              
              <Button variant="outline" className="flex items-center">
                Schedule University Demo <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={fadeIn}
              className="rounded-xl bg-gradient-to-br from-primary/5 to-primary/20 p-10 flex items-center justify-center"
            >
              <div className="text-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-24 w-24 text-primary/40 mx-auto mb-6"
                >
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                  <path d="M6 12v5c3 3 9 3 12 0v-5" />
                </svg>
                <p className="text-xl font-medium text-primary/70">University Edition</p>
                <p className="mt-2 text-sm text-muted-foreground max-w-xs mx-auto">
                  Comprehensive career development for higher education
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Organizations */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-5xl mx-auto"
          >
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={fadeIn}
              className="order-2 lg:order-1 rounded-xl bg-gradient-to-br from-primary/5 to-primary/20 p-10 flex items-center justify-center"
            >
              <div className="text-center">
                <Building className="h-24 w-24 text-primary/40 mx-auto mb-6" />
                <p className="text-xl font-medium text-primary/70">Organization Solutions</p>
                <p className="mt-2 text-sm text-muted-foreground max-w-xs mx-auto">
                  Supporting employee development and retention
                </p>
              </div>
            </motion.div>
            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-6">
                <Building className="h-4 w-4 mr-2" /> Organizations & HR Leaders
              </div>
              <h2 className="text-3xl font-bold mb-4">Develop and Retain Top Talent</h2>
              <p className="text-muted-foreground mb-6">
                Help your workforce grow within your organization by providing structured career 
                development resources that integrate with your existing HR processes.
              </p>
              
              <motion.div 
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                variants={staggerContainer}
                className="space-y-4 mb-8"
              >
                <motion.div variants={staggerItem} className="bg-background p-4 rounded-lg border border-border">
                  <h3 className="font-medium mb-2">Enterprise Career Development</h3>
                  <p className="text-sm text-muted-foreground">
                    Customized career pathways aligned with your organizational structure and needs.
                  </p>
                </motion.div>
                
                <motion.div variants={staggerItem} className="bg-background p-4 rounded-lg border border-border">
                  <h3 className="font-medium mb-2">HR Integration & Analytics</h3>
                  <p className="text-sm text-muted-foreground">
                    Connect with existing HR systems and gain insights through comprehensive reporting.
                  </p>
                </motion.div>
                
                <motion.div variants={staggerItem} className="bg-background p-4 rounded-lg border border-border">
                  <h3 className="font-medium mb-2">Employee Retention Tools</h3>
                  <p className="text-sm text-muted-foreground">
                    Foster internal mobility and growth to improve retention and satisfaction.
                  </p>
                </motion.div>
              </motion.div>
              
              <Button variant="outline" className="flex items-center">
                Request Enterprise Demo <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Resources Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="max-w-3xl mx-auto text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">Resources for Every Audience</h2>
            <p className="text-lg text-muted-foreground">
              Explore tailored resources and guides for your specific career needs.
            </p>
          </motion.div>

          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto"
          >
            <motion.div variants={staggerItem} className="bg-card p-6 rounded-xl shadow-sm">
              <GraduationCap className="h-8 w-8 text-primary mb-4" />
              <h3 className="text-lg font-medium mb-2">Student Resources</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Guides, templates, and advice for launching your career after graduation.
              </p>
              <Button variant="link" className="p-0 h-auto flex items-center text-primary">
                View Resources <ArrowUpRight className="ml-1 h-4 w-4" />
              </Button>
            </motion.div>

            <motion.div variants={staggerItem} className="bg-card p-6 rounded-xl shadow-sm">
              <Briefcase className="h-8 w-8 text-primary mb-4" />
              <h3 className="text-lg font-medium mb-2">Professional Guides</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Career advancement strategies and skill development resources.
              </p>
              <Button variant="link" className="p-0 h-auto flex items-center text-primary">
                View Resources <ArrowUpRight className="ml-1 h-4 w-4" />
              </Button>
            </motion.div>

            <motion.div variants={staggerItem} className="bg-card p-6 rounded-xl shadow-sm">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-8 w-8 text-primary mb-4"
              >
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c3 3 9 3 12 0v-5" />
              </svg>
              <h3 className="text-lg font-medium mb-2">University Tools</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Integration guides and implementation resources for educational institutions.
              </p>
              <Button variant="link" className="p-0 h-auto flex items-center text-primary">
                View Resources <ArrowUpRight className="ml-1 h-4 w-4" />
              </Button>
            </motion.div>

            <motion.div variants={staggerItem} className="bg-card p-6 rounded-xl shadow-sm">
              <Building className="h-8 w-8 text-primary mb-4" />
              <h3 className="text-lg font-medium mb-2">Enterprise Solutions</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Implementation guides and best practices for organizational deployment.
              </p>
              <Button variant="link" className="p-0 h-auto flex items-center text-primary">
                View Resources <ArrowUpRight className="ml-1 h-4 w-4" />
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-b from-primary/10 to-primary/5">
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
              Join thousands of professionals, students, and organizations who trust CareerTracker.io for their career development needs.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/auth">
                <Button size="lg" className="w-full sm:w-auto">
                  Get Started <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/pricing">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  View Pricing <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}