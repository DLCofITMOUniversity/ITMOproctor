#! /bin/bash
# Deployment for Ubuntu 18.04.3

# Installing additional packages
sudo apt-get update
sudo apt-get install -y software-properties-common gnupg curl git
sudo apt-get install -y tar zip unzip wget upx-ucl

# Installing MongoDB 3.6
sudo apt-get update
sudo apt-get install -y mongodb

# Installing Node.js 12
curl -sL https://deb.nodesource.com/setup_12.x | sudo -E bash -
sudo apt-get install -y nodejs

# Installing Kurento Media Server 6.13
sudo apt-key adv --keyserver keyserver.ubuntu.com --recv-keys 5AFA7A83
echo "deb [arch=amd64] http://ubuntu.openvidu.io/6.13.0 bionic kms6" | sudo tee /etc/apt/sources.list.d/kurento.list
sudo apt-get update
sudo apt-get install -y kurento-media-server

# Autoloading and starting MongoDB
sudo systemctl enable mongodb
sudo systemctl start mongodb

# Autoloading and starting Kurento Media Server
sudo systemctl enable kurento-media-server
sudo service kurento-media-server start

# ITMOproctor repository cloning and initialization
git clone https://github.com/openeduITMO/ITMOproctor.git
cd ./ITMOproctor
cp config-example.json config.json
npm install

# Initialization when starting from root and having 404 errors due to bower
# Replace the line in the package.json file:
#    "postinstall": "cd ./public && bower install"
# with
#    "postinstall": "cd ./public && bower install --allow-root"
# Then install packages:
# npm install --unsafe-perm

# Assembling the application for all architectures, the archives for downloading the application will be placed in the public/dist
npm run build-app

# Adding users
(cd db && node import.js users.json)

# Starting the server, the default server is available at localhost:3000
npm start
