#!/bin/bash
set -e

NODE_ENV=test

sudo yum install ansible

ansible-playbook -i "localhost," -c local provisioning/ci.yml

npm install
node_modules/sequelize-cli/bin/sequelize db:migrate # even though we don't use it, the app still needs it to wake up. we can fix this later.

INSTANCE_URL=https://collectiva-staging.herokuapp.com node --harmony node_modules/jasmine/bin/jasmine.js spec/integration/newMemberSignsUpAndMakesAPaymentSpec.js
