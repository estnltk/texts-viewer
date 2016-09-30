import json

import marshmallow.fields as fields
from marshmallow_sqlalchemy import ModelSchema
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime
from sqlalchemy import Unicode
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from texts_viewer.database import Base, db_session


class Text(Base):
    __tablename__ = 'texts'
    id = Column(Integer, autoincrement=True, primary_key=True)
    text = Column(String, nullable=False)


class Model(Base):
    __tablename__ = 'model'
    name = Column(Unicode(200), primary_key=True, index=True)
    deleted = Column(Boolean, default=False, nullable=False)
    versions = relationship('ModelVersion')


class ModelVersion(Base):
    __tablename__ = 'model_version'
    id = Column(Integer, autoincrement=True, primary_key=True)
    model_name = Column(String(200), ForeignKey(Model.__tablename__ + '.name'), index=True)
    text = Column(String, nullable=False)
    time = Column(DateTime, default=func.now())

    model = relationship('Model', back_populates='versions')


class TextGroup(Base):
    __tablename__ = 'text_group'
    texts_table = Column(String(100), nullable=False, index=True)
    name = Column(Unicode(200), index=True, primary_key=True)
    texts = Column(String, nullable=False)  ##json array of ints, points to texts
    regex_names = Column(String, nullable=False)  ##json array of strings
    deleted = Column(Boolean, default=False, nullable=False, index=True)




class JSON(fields.Field):
    def _serialize(self, value, attr, obj):
        if value is None:
            return None
        return json.loads(value)

    def _deserialize(self, value, attr, data):
        return json.dumps(value)


class TextGroupSchema(ModelSchema):
    class Meta:
        model = TextGroup
        sqla_session = db_session
        many = True

    regex_names = JSON()


from flask_restless import DefaultSerializer, DefaultDeserializer


class TextGroupSerializer(DefaultSerializer):
    def serialize(self, instance, only=None):
        super_serialize = super(TextGroupSerializer, self).serialize
        document = super_serialize(instance, only=only)
        schema = TextGroupSchema(only=only)
        document['data']['attributes'] = schema.dump(instance).data
        return document

    def serialize_many(self, instances, only=None):
        super_serialize = super(TextGroupSerializer, self).serialize_many
        document = super_serialize(instances, only=only)
        return document


class TextGroupDeserializer(DefaultDeserializer):
    def deserialize(self, document):
        schema = TextGroupSchema()
        instance = schema.load(document['data']).data
        return instance


class Span(Base):
    __tablename__ = 'span'
    id = Column(Integer, autoincrement=True, primary_key=True)
    text_group = Column(String, ForeignKey(TextGroup.__tablename__ + '.name'))
    texts_table = Column(String(50), nullable=True, index=True)
    text_id = Column(Integer, ForeignKey(Text.__tablename__ + '.id'))
    text = Column(String, nullable=False)
    start = Column(Integer, nullable=False)
    end = Column(Integer, nullable=False)
    regex_name = Column(String, nullable=False, index=True)
    values = Column(String, nullable=True)  ##json of values
