// Redirect script for mobile devices
document.addEventListener('DOMContentLoaded', function() {
  // Check if the device is mobile
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  
  // If on mobile and not already on the mobile site
  if (isMobile) {
    console.log('Mobile device detected, ensuring proper rendering');
    
    // Force viewport to be correctly set
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    if (viewportMeta) {
      viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
    }
    
    // Check for service worker issues
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(function(registrations) {
        // If there are problematic service workers, unregister them
        if (registrations.length > 1) {
          console.log('Multiple service workers detected, cleaning up...');
          for (let registration of registrations) {
            registration.unregister();
          }
          // Reload the page after cleanup
          window.location.reload();
        }
      });
    }
  }
}); 