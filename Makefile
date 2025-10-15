dev:
docker-compose up --build

test:
pytest tutorial/tests

build:
docker-compose build
