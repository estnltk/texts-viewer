import json

import pandas as pd
import sqlalchemy as sq

texts = json.load(open('./delfi-sports-texts.json'))
res = pd.DataFrame.from_dict(texts)

res = res[res.article != '']

res = res.sort_values(by='article')

res = res.iloc[::2]

res['id'] = pd.Series(range(len(res)), index=res.index)
res.index = res.id

engine = sq.create_engine('sqlite:///../app.sqlite')
connection = engine.connect()
meta = sq.MetaData(bind=connection)
meta.reflect()
Texts = meta.tables['texts']
res.columns = ['text', 'id']
sq.insert(Texts).values(res.to_dict(orient='records')).execute()
