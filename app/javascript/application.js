//= require jquery

// Configure your import map in config/importmap.rb. Read more: https://github.com/rails/importmap-rails
import "@hotwired/turbo-rails"
import "controllers"

// Service Worker Registration
// ====================================================================================
async function register_service_worker()
{
  console.log("registering service worker")
  const service_worker_url = "/sw/serviceworker.js";
  navigator.serviceWorker.register(service_worker_url, { scope: '/'});
}

if (navigator.serviceWorker)
  register_service_worker();

$(function() 
{
  // Handle general service worker messages
  navigator.serviceWorker.addEventListener('message', function(event)
  {
    if (event.data.action == "reload")
      location.reload();
  });
});