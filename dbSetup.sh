#!/bin/bash

sudo apt-get -y install postgresql postgresql-contrib

sudo su postgres <<EOF
psql -c "CREATE USER roze WITH PASSWORD 'psql_roze_password';"
createdb -O roze
EOF

