Rails.application.configure do
  config.serviceworker.routes.draw do
    match "/sw/serviceworker.js"
    match "/manifest.json"
  end

  config.serviceworker.headers["Service-Worker-Allowed"] = "/"
end