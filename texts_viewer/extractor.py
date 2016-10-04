import json

import regex as re


class SimpleExtractor:
    def __init__(self, model_text):
        self._model_text = model_text

    def extract(self, text):
        regexes = json.loads(self._model_text)['regexes']
        res = []
        for item in regexes:
            name = item['name']
            regex = item['regex']
            for result in re.finditer(regex, text['text']):
                start, end = result.span()
                res.append({'start': start,
                            'end': end,
                            'content': text['text'][start:end],
                            'text_id': text['id'],
                            'left_context': text['text'][max(0, start - 32):start],
                            'right_context': text['text'][end:min(end + 32, len(text['text']))],
                            'regex_name': name,
                            'groups': result.groupdict()
                            })
        return res

    def extract_many(self, texts):
        res = []

        for text in texts:
            res.append(self.extract(text))

        return res