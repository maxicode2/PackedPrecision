mkdir -p packed

npm install
node index.mjs in/worker_bootstrap.js
node index.mjs in/index.html

echo
echo Packed html file in packed/index.html
