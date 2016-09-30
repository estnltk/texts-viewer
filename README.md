# texts_viewer


to build:

    sudo npm install
    webpack

then

    docker build . -t texts-viewer
    docker run -p 80:80 texts-viewer

or

    export FLASK_APP=texts_viewer/main.py
    flask run

