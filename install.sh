#!/bin/bash

echo "$ sudo usermod -aG video $USER";
sudo usermod -aG video $USER;
echo "";

echo "$ sudo apt update";
sudo apt update;
echo "";

echo "$ sudo apt install fbset";
sudo apt install fbset -y;
echo "";

echo "$ npm run init";
npm run init;
echo "";
echo "";
