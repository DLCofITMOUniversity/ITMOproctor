#! /bin/bash
# Deployment for Ubuntu 14.04

# Installing MongoDB
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 0C49F3730359A14518585931BC711F9BA15703C6
echo "deb http://repo.mongodb.org/apt/ubuntu trusty/mongodb-org/3.4 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-3.4.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Installing Node.js
curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
sudo apt-get install -y nodejs

# Installing  Kurento Media Server
echo "deb http://ubuntu.kurento.org trusty kms6" | sudo tee /etc/apt/sources.list.d/kurento.list
wget http://ubuntu.kurento.org/kurento.gpg.key -O - | sudo apt-key add -
sudo apt-get update
sudo apt-get install kurento-media-server-6.0

# Starting Kurento Media Server
sudo service kurento-media-server-6.0 start

# ITMOproctor repository cloning and initialization
git clone https://github.com/openeduITMO/ITMOproctor.git
cd ./ITMOproctor
mv config-example.json config.json
npm install

# Initialization when starting from root and having 404 errors due to bower
# Replace the line in the package.json file:
#    "postinstall": "cd ./public && bower install"
# with
#    "postinstall": "cd ./public && bower install --allow-root"
# Then install packages:
# npm install --unsafe-perm

# Assembling the application for all architectures, the archives for downloading the application will be placed in the public/dist
apt-get install tar zip unzip wget upx-ucl
npm run-script build-app

# Adding users
cd db
node import.js users.json

# Starting the server, the default server is available at localhost:3000
npm start
