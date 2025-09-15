# Career App Bug Checklist

Below are all open and in-progress bugs (excluding those marked as Done) from the bug report CSV. Each bug includes key details for triage and resolution. Check off each item as it is completed.

---

## Onboarding

- [ ] **Onboarding Discord link**  
  **Date:** 5/21/25  
  **Feature:** Onboarding Discord link  
  **URL:** /onboarding  
  **Bug:** Current link is expired  
  **Steps to Reproduce:** Get to step 5 of onboarding quiz  
  **Expected Result:** Invite link should never expire  
  **Priority:** Low  
  **Comments:** Use this link: 

## Nav Bar

- [ ] **Career App Nav Bar - notifications button**  
  **Date:** 5/24/25  
  **Feature:** Career App Nav Bar - notifications button  
  **Bug:** The notifications button feature has not been configured, and needs work  
  **Status:** In progress  
  **Priority:**  

- [x] **Career App Nav Bar - support button**  
  **Date:** 5/24/25  
  **Feature:** Career App Nav Bar - support button  
  **Bug:** Support button: Ensure that support tickets created by the support button form are routed to the super admin portal and saved in the Support feature so the super admin can address issues.  
  **Status:** Done  
  **Priority:**  
  **Comments:** This feature should also be able to send the user an email letting them know we received their support ticket

## Application Tracker & Follow-Ups

- [x] **Follow up action overview**  
  **Date:** 5/21/25  
  **Feature:** Follow up action overview  
  **URL:** /career-dashboard  
  **Bug:** Contact follow-up actions are not showing up in the follow up actions overview element on the dashboard  
  **Steps to Reproduce:** Create a follow up action on a contact  
  **Expected Result:** Follow-up actions show up right away when created.  
  **Status:** Done  
  **Priority:** Low

- [x] **AI Coach**  
  **Date:** 5/22/25  
  **Feature:** AI Coach  
  **URL:** /career-dashboard  
  **Bug:** AI Coach element does not mirror the functionality of the AI Career coach  
  **Steps to Reproduce:** Use feature  
  **Expected Result:** AI Coach element should mirror the functionality of the AI Career coach, it should be the same agent  
  **Status:** Done  
  **Priority:** Medium

- [x] **Today's Recommendations**  
  **Date:** 5/22/25  
  **Feature:** Today's Recommendations  
  **URL:** /career-dashboard  
  **Bug:** We need to generate more intelligent recommendations based on (user career profile + user goals + user applications + AI suggestion prompt)  
  **Expected Result:** Fresh recommendations that refresh every 24 hours, that are context-based and provide the user with guidance, and best practices to move forward.  
  **Status:** Done  
  **Priority:** Medium  
  **Comments:** Prompt Template: AI Career Strategist Recommendations
You are a world-class career strategist and job search coach with 15+ years of experience helping ambitious professionals land competitive roles and accelerate their growth. Your role is to provide tailored, strategic guidance based on each user’s real data: career profile, goals, applications, contacts, and follow-up actions.

Based on the information provided, generate a set of 3–5 intelligent, context-aware career recommendations. Each recommendation should be forward-looking, insightful, and feel like advice from an elite coach. Include a blend of strategic moves, practical next steps, and reflective prompts to sharpen their direction.

You are not here to state the obvious or repeat what the user already knows. Your mission is to:

Uncover blind spots

## Cover Letter & AI Career Coach

- [ ] **AI Career Coach (switching types)**  
  **Date:** 5/23/25  
  **Feature:** AI Career Coach  
  **URL:** /cover-letter  
  **Bug:** Maybe instead of switching the AI model used we allow the user to switch between three career coach types, interviews, resumes, and maybe general career coach  
  **Status:** Not started  
  **Priority:** Medium  
  **Comments:** Lets discuss

- [ ] **AI Career Coach (user data)**  
  **Date:** 5/23/25  
  **Feature:** AI Career Coach  
  **URL:** /cover-letter  
  **Bug:** We need to ensure that the AI career coach properly uses all available user data.  
  **Status:** Not started  
  **Priority:**  

- [ ] **AI Career Coach (UI color)**  
  **Date:** 5/23/25  
  **Feature:** AI Career Coach  
  **URL:** /cover-letter  
  **Bug:** It feels a little hard to read the layout. Maybe we can add some slight UI color changes? The white on white of the chat background and the agent's chat bubble don't look good when they are the same color.  
  **Status:** Not started  
  **Priority:**  

## Account Settings

- [x] **Account Settings - career tab (tab width)**  
  **Date:** 5/23/25  
  **Feature:** Account Settings - career tab  
  **URL:** /account  
  **Bug:** The grey background that holds the tabs is too wide, it should only be as wide as the tabs.  
  **Status:** Completed  
  **Priority:**  

- [x] **Account Settings - career tab (checklist visibility)**  
  **Date:** 5/23/25  
  **Feature:** Account Settings - career tab  
  **URL:** /account  
  **Bug:** The profile completion checklist should vanish once the user has completed their information, but reappear if they for some reason delete all data in a section.  
  **Status:** Completed  
  **Priority:**  

- [x] **Account Settings - Profile tab (fields and email verification)**  
  **Date:** 5/23/25  
  **Feature:** Account Settings - Profile tab  
  **URL:** /account  
  **Bug:** Ensure that the fields on the profile information page are effective and functioning properly. The full name field seems to update the full name at least in the nav bar.  
  **Status:** Completed  
  **Priority:**  
  **Comments:** Profile form properly handles name updates with validation, email changes require current password, and email verification system is implemented with proper error handling.

- [x] **Account Settings - Subscription tab (cancel button)**  
  **Date:** 5/23/25  
  **Feature:** Account Settings - Subscription tab  
  **URL:** /account  
  **Bug:** The cancel subscription button is pulling an error: "Cancellation failed: Error canceling subscription: user has no active subscription to cancel"  
  **Status:** Completed  
  **Priority:**  

- [x] **Account Settings - Subscription tab (plan features section)**  
  **Date:** 5/23/25  
  **Feature:** Account Settings - Subscription tab  
  **URL:** /account  
  **Bug:** Remove the plan features section from the subscription tab  
  **Status:** Completed  
  **Priority:**  

- [x] **Account Settings - Subscription tab (security tab)**  
  **Date:** 5/23/25  
  **Feature:** Account Settings - Security tab  
  **URL:** /account  
  **Bug:** To my knowledge, the Security tab does not have any functionality.  
  **Status:** Not started  
  **Priority:**  
