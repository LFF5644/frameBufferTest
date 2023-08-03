#!/bin/bash
date;
echo "$ sudo apt update";
sudo apt update;
echo "$ sudo apt install fbset";
sudo apt install fbset -y
echo "$ npm run init";
npm run init;
echo "";