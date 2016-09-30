import sys
import os

from texts_viewer import app

sys.path.append(os.path.abspath('./libs/') )

import configparser

if __name__ == '__main__':

    config = configparser.ConfigParser()
    config.read('conf.ini')

    app.run(host=config.get('WEB_SERVER','HOST'),
        port=config.getint('WEB_SERVER','PORT'),
        threaded=True,
        debug=True)