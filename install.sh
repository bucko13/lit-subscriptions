#!/bin/sh

echo "Installing packages for lit-fans"
cd lit-fans && npm install && cd ..
echo "Done installing for lit-fans"
echo "Installing for lit-donations"
cd lit-donations && npm install && cd ..