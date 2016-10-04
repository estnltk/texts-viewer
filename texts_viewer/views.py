import json

import pandas as pd
from flask import render_template, jsonify
from flask import request

from texts_viewer import app,  models
from texts_viewer.database import db_session
from texts_viewer.extractor import SimpleExtractor


@app.route('/', methods=['GET'])
def index():
    return render_template('index.html')


@app.route('/add_regex_name', methods=['POST'])
def add_regex_name():
    group_id = request.json['group_id']
    new_regex_name = request.json['regex_name']

    text_group = db_session.query(models.TextGroup).filter_by(name=group_id).first()

    regex_names = json.loads(text_group.regex_names)
    if new_regex_name not in regex_names:
        text_group.regex_names = json.dumps(regex_names + [new_regex_name])
    db_session.commit()

    return jsonify(
        models.TextGroupSerializer().serialize(text_group)
    )


@app.route('/save_annotation', methods=['POST'])
def save_annotation():
    j = request.json

    text_id = int(j['text_id'])
    start, end = int(j['start']), int(j['end'])
    group_id = (j['group_id'])
    regex_name = str(j['regex_name'])
    text = str(j['text'])

    span = models.Span(
        texts_table=models.Text.__tablename__,
        text_group=group_id,
        start=start,
        end=end,
        regex_name=regex_name,
        text_id=text_id,
        text=text,
        values=json.dumps({})
    )
    db_session.add(span)

    db_session.commit()

    return jsonify({
        'id': span.id
    })


def to_dict(ob):
    ress = dict(ob.__dict__)
    ress.pop('_sa_instance_state')
    return ress


@app.route('/get_texts_in_group/<string:name>', methods=['GET'])
def get_texts_in_group(name):
    texts = None
    for i, in db_session.query(models.TextGroup.texts).filter_by(name=name).all():
        texts = [int(i) for i in i.split('\n') if i]

    res = []
    if texts:
        for row in db_session.query(models.Text).filter(models.Text.id.in_(texts)).all():
            res.append(to_dict(row))

    return jsonify(res)


@app.route('/get_annotations_in_group/<string:name>', methods=['GET'])
def get_annotations_in_group(name):
    res = []
    for row in db_session.query(models.Span).filter_by(text_group=name).all():
        ress = dict(row.__dict__)
        ress.pop('_sa_instance_state')
        res.append(ress)

    return jsonify(res)


@app.route('/get_model/<string:name>', methods=['GET'])
def get_model(name):
    mv = db_session.query(models.ModelVersion).filter_by(model_name=name).order_by(
        models.ModelVersion.time.desc()).first()

    if mv is None:
        mv = models.ModelVersion(
            model_name=name,
            text='')
        db_session.add(mv)
        db_session.commit()

    return jsonify(to_dict(mv))


@app.route('/get_model_names/', methods=['GET'])
def get_model_names():
    res = []
    for i, in db_session.query(models.Model.name).all():
        res.append(i)
    return jsonify({'data': {
        'attributes': {
            'result': res
        }
    }})


@app.route('/save_model_version/<string:name>', methods=['POST'])
def save_model_version(name):
    text = request.json['text']

    model = db_session.query(models.Model).filter_by(name=name).first()
    if model is None:
        model = models.Model(
            name=name,
            deleted=False)
        db_session.add(model)

    mv = models.ModelVersion(
        model_name=name,
        text=text)
    db_session.add(mv)
    db_session.commit()

    return jsonify({
        'result': 1
    })


def classify(i, trues):
    self = (i['text_id'], i['start'], i['end'], i['regex_name'], i['content'])

    if self in trues:
        return 'true_positive'
    else:
        return 'false_positive'


@app.route('/run_model_text', methods=['POST'])
def run_model_text():
    model_text = request.json['model_text']
    group_id = request.json['group_id']
    group = db_session.query(models.TextGroup).filter_by(name=group_id).first()

    grp = models.TextGroupSerializer().serialize(group)
    relevant_names = json.loads(group.regex_names)
    spans_in_db = db_session.query(models.Span).filter_by(text_group=group_id).all()

    trues_ids = list((i.text_id, i.start, i.end, i.regex_name, i.text, i.id) for i in spans_in_db)
    trues_dict = dict((i[:-1], i[-1]) for i in trues_ids)
    trues = set(trues_dict.keys())

    if grp['data']['attributes']['texts']:
        txts = [
            to_dict(i) for i in
            db_session.query(models.Text).filter(

                models.Text.id.in_([int(i) for i in (grp['data']['attributes']['texts'].split("\n")) if (i.strip())] ))]
    else:
        txts = []

    try:
        ex = SimpleExtractor(model_text)
        res = ex.extract_many(txts)

    except Exception as e:
        print(e)
        err = e
        return jsonify({'result': 'error',
                        'err': str(err)
                        }), 500

    result = []
    for (id, value), resultset in zip([(txt['id'], txt['text']) for txt in txts], res):
        for result_item in resultset:
            result_item['text_id'] = id
            result_item['content'] = value[result_item['start']:result_item['end']]
            result.append(result_item)

    false_negatives = [
        {'text_id': a, 'start': b, 'end': c, 'regex_name': d, 'content': e,
         'result_class': 'false_negative',
         'groups': {},
         'left_context': '_____',
         'right_context': '_____'
         } for a, b, c, d, e in
        (trues - set((i['text_id'], i['start'], i['end'], i['regex_name'], i['content']) for i in result))
        ]

    falses = set([i['text_id'] for i in false_negatives])
    if falses:
        false_texts = dict([(i.id, i.text) for i in db_session.query(models.Text).filter(
            models.Text.id.in_(falses)).all()])
    else:
        false_texts = []

    for fn in false_negatives:
        txt = false_texts[fn['text_id']]
        fn['left_context'] = txt[max(0, fn['start'] - 32):fn['start']]
        fn['right_context'] = txt[fn['end']:min(fn['end'] + 32, len(txt))]

    df = pd.DataFrame.from_records(
        [dict(i, result_class=classify(i, trues)) for i in result if
         i['regex_name'] in relevant_names] + false_negatives)

    try:
        gb = df.groupby(by='regex_name').apply(lambda x: x.to_dict(orient='records')).to_dict()
    except KeyError as e:
        return jsonify({'result': 'error',
                        'err': 'No regexes assigned - create some in the annotation tab'
                        }), 500



    for i in relevant_names:
        if i not in gb.keys():
            gb[i] = []
        else:
            for result in gb[i]:
                if result['result_class'] == 'true_positive':
                    i = result
                    result['id'] = trues_dict[(i['text_id'], i['start'], i['end'], i['regex_name'], i['content'])]
                elif result['result_class'] == 'false_negative':
                    i = result
                    result['id'] = trues_dict[(i['text_id'], i['start'], i['end'], i['regex_name'], i['content'])]

    return jsonify(gb)
