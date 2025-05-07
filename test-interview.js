// Run this script in the browser console
const now = new Date();
const appId = Date.now();
const stageId = Date.now() + 1;

// Create a job application
const jobApp = {
  id: appId,
  userId: 2, // Assuming user ID 2
  title: "Software Engineer",
  company: "Today Interview Test",
  status: "Interviewing",
  createdAt: now.toISOString(),
  updatedAt: now.toISOString()
};

// Create a mock interview stage for today
const stage = {
  id: stageId,
  applicationId: appId,
  type: "technical",
  status: "scheduled",
  outcome: "scheduled",
  scheduledDate: now.toISOString().split('T')[0] + 'T12:00:00.000Z', // Today at noon
  createdAt: now.toISOString(),
  updatedAt: now.toISOString()
};

// Save the job application
const existingApps = JSON.parse(localStorage.getItem('mockJobApplications') || '[]');
localStorage.setItem('mockJobApplications', JSON.stringify([...existingApps, jobApp]));

// Save the interview stage
const stagesKey = `mockStages_${appId}`;
const interviewStagesKey = `mockInterviewStages_${appId}`;
localStorage.setItem(stagesKey, JSON.stringify([stage]));
localStorage.setItem(interviewStagesKey, JSON.stringify([stage]));

console.log('Created test interview for today:', stage);
