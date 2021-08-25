#!/bin/sh

echo "Which project (client and server) would you like to run?"
select project in "Fan's site" "Donations page" "Cancel";
do
  if [ "$project" == "Fan's site" ]; then
    cd ./lit-fans && npm run start
  elif [ "$project" == "Donations page" ]; then
    cd ./lit-donations && npm run start
  else
    exit
  fi 
done