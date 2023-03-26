# QuickDose


## Background
This app estimates the dose delivered to a water phantom by a linear accelerator used for Radiation Therapy.

The method used is based on the one described in Khan [1] using the formalism below. Where K is a calibration constant, and AF is the inverse of a typical output factor.

Data used is an approximation of that acquired from a typical linear accelerator from each vendor.

## Usage
1. Select the manufacturer, the photon energy, field size, depth and monitor units.
2. Press the "CALCULATE" button to run the dose calculation. 

Any changes to inputs will reset the calculation. 
Changing the manufacturer will reset all inputs to default.

*References*
1. Khan, Faiz M., ed. The physics of radiation therapy. Lippincott Williams &amp; Wilkins, 2010.

NOTE: This is an approximation only.

## Development

QuickDose uses a Rails 7 backend and a Vue3 frontend.

Currently it's just a single Vue3 page loaded in the root rails endpoint.

To integrate Vue3 with Rails and provide a progressive experience (offline enabled), we use the serviceworker-rails gem, and other code found in `app/javascript/sw/serviceworker.js.erb`, `config/initializers/serviceworker.rb`, `app/javascript/offline_development.js`, `app/helpers/vue_helper.rb`, `app/views/vue/_vue_assets.html.erb`.

The serviceworker will cache rails endpoints specified at the top of the file and intercept the requests when running in production mode or offline development mode.

The get_module_path in `vue_helper.rb` takes the manifest.json from the Vue3 build and returns a list of files used by a particular module. We use "module" to refer to an entrypoint specified in `vue_frontend/vite.config.ts`. A module is a directory under `vue_frontend/src` containing .js and .Vue files following the naming convention demonstrated in `vue_frontend/src/dose_calculator`.

Once you've called get_module_path in your controller endpoint, you can then use the `_vue_assets.html.erb` partial in your view to load the Vue3 module on the page. 

In development we either want live updating from the Vite server or we want to test out serving the built Vue3 files from rails and having the serviceworker cache them.

### Standard Development (Live Updating Vue3 Pages)

1. Set offline_development = false in `offline_development.js`
2. `rails server`
3. Run Vite dev server in `vue_frontend` directory: `npm run dev -- --port 3001`

### Testing Serviceworker / Vue3 Build

1. Run `./build.sh` in the vue_frontend directory.
2. Set offline_development = false in `offline_development.js`
3. `rails server`

### Production

In production `get_module_path` and `_vue_assets.html.erb` will behave the same as in offline development mode. The serviceworker will cache rails endpoints, providing a progressive experience (offline support).

1. Run `./build.sh` in the ROOT directory. This also runs a Vue3 build.
2. `RAILS_ENV=production RAILS_SERVE_STATIC_ASSETS=true rails server`

You'll need to put this behind a load balancer with HTTPS in order to install the service worker and enable offline functionality.

## Environment Setup

We have tested on Ubuntu 22 with rbenv and Node 16

### Linux packages

Most of this is recommended by rbenv
```
sudo apt update
sudo apt install build-essential autoconf bison patch build-essential rustc libssl-dev libyaml-dev libreadline6-dev zlib1g-dev libgmp-dev libncurses5-dev libffi-dev libgdbm6 libgdbm-dev libdb-dev uuid-dev
```

### rbenv Install

```
git clone https://github.com/rbenv/rbenv.git ~/.rbenv
echo 'eval "$(~/.rbenv/bin/rbenv init - bash)"' >> ~/.bashrc
```

reload your shell

```
git clone https://github.com/rbenv/ruby-build.git "$(rbenv root)"/plugins/ruby-build
rbenv install 3.2.0
```

### Node Install
```
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash - &&sudo apt-get install -y nodejs
```

### Application Setup

In application root
```
bundle install
rbenv rehash
```

### Install Javascript Packages
In vue_frontend
```
npm install
```



