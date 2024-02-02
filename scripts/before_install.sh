sudo chmod -R 777 /home/ec2-user/food-app

curl https://raw.githubusercontent.com/creationix/nvm/master/install.sh | bash
. ~/.nvm/nvm.sh
nvm install node

DIR="/home/ec2-user/food-app"
if [ -d "$DIR" ]; then
  echo "${DIR} exists"
else
  echo "Creating ${DIR} directory"
  mkdir ${DIR}
fi