import os

from flask import Flask

app = Flask(__name__)


def get_credentials(filename):
    credentials = {a: b for a, b in
                   [i.strip().split(':') for i in open('/home/uku/secrets/' + filename).read().split('\n') if
                    i.strip()]}

    return credentials


basedir = os.path.abspath(os.path.dirname(__file__))
SQLALCHEMY_DATABASE_URI = 'sqlite:///' + os.path.join(basedir, 'app.sqlite')

from texts_viewer.database import db_session, init_db
from texts_viewer.models import Text, Span, TextGroup, Model, TextGroupSerializer, TextGroupDeserializer


@app.teardown_appcontext
def shutdown_session(exception=None):
    db_session.remove()


init_db()

import flask_restless

# Create the Flask-Restless API manager.
manager = flask_restless.APIManager(app, session=db_session)

# Create API endpoints, which will be available at /api/<tablename> by
# default. Allowed HTTP methods can be specified as well.
manager.create_api(Span, methods=['GET', 'POST', 'DELETE'], collection_name='span', page_size=100, max_page_size=100)
manager.create_api(Model, methods=['GET', 'POST', 'DELETE'], collection_name='model', page_size=100, max_page_size=100)
manager.create_api(TextGroup, methods=['PUT', 'GET', 'POST', 'DELETE', 'PATCH'],
                   collection_name='text_group',
                   serializer_class=TextGroupSerializer,
                   deserializer_class=TextGroupDeserializer,
                   page_size=100, max_page_size=100)
manager.create_api(Text, methods=['GET'], collection_name='text', page_size=100, max_page_size=100)

import texts_viewer.views
