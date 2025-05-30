// Admin redirect fix script
// Paste this into the browser console to fix super admin redirect issues

(function() {
  // Force clear any existing user cache in storage
  localStorage.removeItem('user');
  
  // Force the admin redirect if role is super_admin in the session
  if (document.cookie.includes('role=super_admin')) {
    console.log('Super admin detected in cookie, forcing redirect to /admin');
    window.location.href = '/admin';
  }
  
  // Add a method to the prototype to ensure admin role is always honored
  const originalPush = history.pushState;
  history.pushState = function(state, title, url) {
    if (document.cookie.includes('role=super_admin') && url === '/career-dashboard') {
      console.log('Intercepted career-dashboard redirect for super_admin, redirecting to /admin');
      originalPush.call(this, state, title, '/admin');
    } else {
      originalPush.call(this, state, title, url);
    }
  };
  
  console.log('Admin redirect fix installed');
})();