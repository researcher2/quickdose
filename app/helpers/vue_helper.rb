module VueHelper
  def get_css_recursive(manifest, key)
    css = []
    if manifest.has_key?(key)
      entry = manifest[key]

      if entry.has_key?("css")
        css.concat(entry["css"])
      end

      if entry.has_key?("imports")
        entry["imports"].each {
          |sub_entry|

          if sub_entry.end_with?("js")            
            css.concat(get_css_recursive(manifest, sub_entry))
          end
        }
      end
    end
    return css
  end

  # If we create an "offline_development" file in the repo root development
  # mode is switched off to enable testing the service worker in offline mode
  # This file also triggers behaviour in the serviceworker.js.erb
  def get_module_path(page)    
    development_mode = Rails.env == "development" && 
                       File.open('app/javascript/offline_development.js').read
                           .include?("offline_development = false")

    if development_mode
      module_path = "http://localhost:3001/vue/src/#{page}/#{page}.js"
      css = []
    else
      vue_asset_dir_filesystem = "public/vue"
      manifest = JSON.parse(File.read("#{vue_asset_dir_filesystem}/manifest.json"))
      manifest_key = "src/#{page}/#{page}.js";
      module_file = manifest[manifest_key]["file"]

      css = get_css_recursive(manifest, manifest_key)

      vue_asset_dir_server = "/vue"
      module_path = "#{vue_asset_dir_server}/#{module_file}";
      css = css.map {
        |css_file|
        "#{vue_asset_dir_server}/#{css_file}"
      }
    end

    return [module_path, css]
  end  
end
