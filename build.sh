rm -rf public/vue
rm -rf public/assets
rm -rf tmp
cd vue_frontend
./build.sh
cd ..
rake assets:clean
rake assets:precompile