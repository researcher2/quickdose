/*
This file is used to allow easy switching between general and offline development flows.
It is required by the serviceworker, and also read by the offline_vue_controller.rb.

In general development flow
---------------------------
Set offline_development to false:
  - vue_helper.rb will then point towards the Vite dev server.
  - serviceworker.js will return immediately during fetch, disabling caching

In offline development flow
---------------------------
Set offline_development to true:
  - vue_helper.rb will point towards built Vue assets. 
  - serviceworker.js will intercept requests and use caching

The Vue build.sh script will update build_timestamp with sed, triggering a service worker 
rebuild.

Production
----------
This file doesn't effect production because both the serviceworker.js and offline_vue_controller.rb
disable development mode when Rails.env != "development".

DONT TOUCH THIS MANUALLY (unless you want to force service worker rebuild)
--------------------------------------------------------------------------
build_timestamp = 1678909105
*/
const offline_development = false

