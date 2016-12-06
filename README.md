# Texts-viewer

Texts-viewer is a web tool which allows for iterative pattern-based fact extractor developent with built-in regression tests.

## Features

* Texts-viewer helps define sub-corpora from a larger corpus
* enables user to interactively define regions of interest within documents
* enables running pattern-matching tools and test the results against defined regions of interest

## Use cases

* develop fact-extraction tools with automatic regression tests


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

