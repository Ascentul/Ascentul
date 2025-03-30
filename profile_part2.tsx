                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <Calendar className="h-3 w-3" />
                      <span>Issued Jan 2022 · Expires Jan 2025</span>
                    </div>
                    <p className="mt-2 text-sm">
                      Professional certification for designing distributed systems on AWS platform.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Skills Tab */}
        <TabsContent value="skills">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Skills & Endorsements</span>
                <Button variant="ghost" size="sm">Add Skill</Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium mb-3">Technical Skills</h3>
                  <div className="space-y-4">
                    {/* Skill Item */}
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">JavaScript</span>
                        <span className="text-xs text-muted-foreground">32 endorsements</span>
                      </div>
                      <div className="h-2 bg-primary/10 rounded-full">
                        <div className="h-2 bg-primary rounded-full" style={{ width: '90%' }}></div>
                      </div>
                    </div>
                    
                    {/* Skill Item */}
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">React</span>
                        <span className="text-xs text-muted-foreground">28 endorsements</span>
                      </div>
                      <div className="h-2 bg-primary/10 rounded-full">
                        <div className="h-2 bg-primary rounded-full" style={{ width: '85%' }}></div>
                      </div>
                    </div>
                    
                    {/* Skill Item */}
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Node.js</span>
                        <span className="text-xs text-muted-foreground">24 endorsements</span>
                      </div>
                      <div className="h-2 bg-primary/10 rounded-full">
                        <div className="h-2 bg-primary rounded-full" style={{ width: '80%' }}></div>
                      </div>
                    </div>
                    
                    {/* Skill Item */}
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">TypeScript</span>
                        <span className="text-xs text-muted-foreground">19 endorsements</span>
                      </div>
                      <div className="h-2 bg-primary/10 rounded-full">
                        <div className="h-2 bg-primary rounded-full" style={{ width: '75%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="font-medium mb-3">Soft Skills</h3>
                  <div className="space-y-4">
                    {/* Skill Item */}
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Communication</span>
                        <span className="text-xs text-muted-foreground">18 endorsements</span>
                      </div>
                      <div className="h-2 bg-primary/10 rounded-full">
                        <div className="h-2 bg-primary rounded-full" style={{ width: '85%' }}></div>
                      </div>
                    </div>
                    
                    {/* Skill Item */}
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Team Leadership</span>
                        <span className="text-xs text-muted-foreground">15 endorsements</span>
                      </div>
                      <div className="h-2 bg-primary/10 rounded-full">
                        <div className="h-2 bg-primary rounded-full" style={{ width: '75%' }}></div>
                      </div>
                    </div>
                    
                    {/* Skill Item */}
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Problem Solving</span>
                        <span className="text-xs text-muted-foreground">22 endorsements</span>
                      </div>
                      <div className="h-2 bg-primary/10 rounded-full">
                        <div className="h-2 bg-primary rounded-full" style={{ width: '90%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Achievements Tab */}
        <TabsContent value="achievements">
          <Card>
            <CardHeader>
              <CardTitle>Career Achievements</CardTitle>
              <CardDescription>
                Unlock achievements as you progress in your career journey
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Achievement Item */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <Award className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">Resume Master</h3>
                        <p className="text-sm text-muted-foreground">Created 5 tailored resumes</p>
                        <Badge className="mt-2">+100 XP</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Achievement Item */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <Award className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">Interview Pro</h3>
                        <p className="text-sm text-muted-foreground">Completed 20 practice interviews</p>
                        <Badge className="mt-2">+150 XP</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Achievement Item */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <Award className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">Goal Setter</h3>
                        <p className="text-sm text-muted-foreground">Set 5 career goals</p>
                        <Badge className="mt-2">+75 XP</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Locked Achievement Item */}
                <Card className="opacity-60">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                        <Award className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-medium">Job Master</h3>
                        <p className="text-sm text-muted-foreground">Apply to 10 jobs</p>
                        <Badge variant="outline" className="mt-2">Locked</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}