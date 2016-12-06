# texts_viewer

## Features

## Use cases


## Installation


to build:

    sudo npm install
    webpack

For example data copy the released sqlite database
https://github.com/estnltk/texts-viewer/releases/download/0.1/app.sqlite
to `texts_viewer/texts_viewer`


then

    docker build . -t texts-viewer
    docker run -p 80:80 texts-viewer

or

    export FLASK_APP=texts_viewer/main.py
    flask run


## Screenshots

TODO

