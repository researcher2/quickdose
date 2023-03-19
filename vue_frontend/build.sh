#!/bin/sh

npm run build
rm -rf ../public/vue
mkdir ../public/vue
cp -r dist/* ../public/vue
sed -i "s/build_timestamp = .*$/build_timestamp = $(date +%s)/" ../app/assets/javascripts/offline_development.js