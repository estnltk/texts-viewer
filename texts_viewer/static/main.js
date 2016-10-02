"use strict";

var bootstrap_css = require('../../node_modules/bootstrap/dist/css/bootstrap.min.css');

var superagent = require('superagent');

var rangy = require('../../node_modules/rangy/lib/rangy-core.js');
require('expose?$!expose?jQuery!../../node_modules/jquery/dist/jquery.js');
var Vue = require('../../node_modules/vue/dist/vue.js');
var vue_resource = require('../../node_modules/vue-resource/dist/vue-resource.js');
Vue.use(vue_resource);
Vue.http.headers.common['Accept'] = 'application/vnd.api+json';
Vue.http.headers.post['Content-Type'] = 'application/vnd.api+json';


var bootstrap = require('../../node_modules/bootstrap/dist/js/bootstrap.js');
var main_css = require('./main.scss');

var api_get = function (url) {
    return superagent.get(url)
        .accept('application/vnd.api+json')
}

var api_post = function (url, data) {
    return superagent.post(url)
        .send(data)
        .accept('application/vnd.api+json')
        .set('Content-Type', 'application/vnd.api+json')
}


var get_extracted_by_event_id = function (event_id) {
    return api_get({id: event_id}).then(
        (response)=> response.body.data.attributes.result,
        (response)=>[]
    )
};


function getTextNodesIn(node, includeWhitespaceNodes) {
    var textNodes = [], nonWhitespaceMatcher = /\S/;

    function getTextNodes(node) {
        if (node.nodeType == 3) {
            if (includeWhitespaceNodes || nonWhitespaceMatcher.test(node.nodeValue)) {
                textNodes.push(node);
            }
        } else {
            for (var i = 0, len = node.childNodes.length; i < len; ++i) {
                getTextNodes(node.childNodes[i]);
            }
        }
    }

    getTextNodes(node);
    return textNodes;
}


function highlightCharacterRange(el, start, end, classname, element_name) {
    var range = rangy.createRange();
    range.moveToBookmark({
        containerNode: el[0],
        start: start,
        end: end
    });
    range.splitBoundaries();

    var textNodes = range.getNodes([3])//getTextNodesIn(el[0], true);

    for (var textNode of textNodes) {
        var span = document.createElement(element_name);
        span.className = classname;
        textNode.parentNode.insertBefore(span, textNode);
        span.appendChild(textNode);
    }
};
var data = {
    message: '0',
    text: '',
    regex_names: [],
    extracted: [],
    ranges: []

};
var current = '';

var main = new Vue({
        el: "#main",
        data: data,
        created: function () {
            this.test(this.message)

        },
        methods: {
            set_text: function (text) {
                // var bindelem = '';
                // var dirs = this._directives;
                //
                // console.log(this)
                // for (var dir of dirs) {
                //     if (dir.expression == 'text') {
                //         bindelem = dir.el
                //     }
                // }
                //
                // //cleanup hack
                // var element = $('#event_text');
                // for (var elem of element.contents()) {
                //     elem.remove()
                // }
                // element.append(bindelem);
                this.text = text

            },
            test: function (message) {
                this.message = message;
                if (current == message) {
                    return
                }

                var element = $('#event_text');
                api_get('api/text/' + message).then(
                    (response) => {
                        this.set_text(response.body.data.attributes.text);
                        current = message;
                    },
                    (response) => {
                        // error
                        this.set_text('')
                        alert('No such id');
                    }
                )
            }
        }


    }
);
////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////

var text_groups_data = {
    'groups': [],
    'new_group': '',
    'group_contents': '',
    'active_group_name': ''
};


var text_groups = new Vue({
    "el": "#text_groups",
    "data": text_groups_data,
    "methods": {

        "update": ()=> {
        },

        "get_groups": function () {
            api_get('api/text_group').then(
                (response) => {
                    var groups = []
                    for (var elem of response.body.data) {
                        var nelem = elem.attributes
                        nelem.id = elem.id
                        groups.push(
                            nelem
                        )
                    }

                    this.groups = groups

                },
                (response) => {
                    // error
                }
            )

        },

        "add_group": function () {
            if (this.new_group.length > 1) {

                api_post('api/text_group', {
                    data: {
                        'name': this.new_group,
                        'texts': this.group_contents,
                        'regex_names': [],
                        'texts_table': 'texts',
                        'deleted': 0
                    }
                }).then(
                    (response) => {

                        this.get_groups();
                        this.active_group_name = this.new_group;
                        this.new_group = ''


                    },
                    (response) => {
                        // error
                    }
                )


            }
        },
        "show_group": function (name) {
            api_get('api/text_group/' + name).then(
                (response) => {
                    this.active_group_name = name;
                    this.group_contents = response.body.data.attributes.texts
                },
                (response) => {
                    // error
                }
            )
        },
        "delete_group": function (name) {
            this.$http.delete('api/text_group/' + name).then(
                (response) => {
                    this.get_groups()
                },
                (response) => {
                    // error
                }
            )
        },
        "save_group": function (name) {
            this.$http.patch('api/text_group/' + name, {
                data: {
                    type: 'text_group',
                    id: name,
                    attributes: {
                        'name': name,
                        'texts': this.group_contents,
                    }
                }
            }).then(
                (response) => {
                    this.show_group(name)
                },
                (response) => {
                    // error
                }
            )

        }

    },
    "created": function () {
        this.get_groups();
    },

});

////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////
var annotation_data = {
    'groups': [],
    group: {},
    active_group_id: -1,
    active_texts: [],
    new_regex_name: '',
    active_regex: ''
};

var annotation = new Vue({
    "el": "#annotation",
    "data": annotation_data,
    "methods": {

        "update": ()=> {
            this.get_groups()

        },
        "get_groups": function () {
            api_get('api/text_group').then(
                (response) => {
                    var groups = []
                    for (var elem of response.body.data) {
                        var nelem = elem.attributes
                        nelem.id = elem.id
                        groups.push(
                            nelem
                        )
                    }

                    this.groups = groups

                },
                (response) => {
                    // error
                }
            )

        },


        "update_texts": function () {

            if (this.active_group_id == undefined) {
                return
            }
            api_get('api/text_group/' + this.active_group_id).then(
                (response) => {
                    this.active_regex = '';
                    this.group = response.body.data.attributes;
                    this.group.id = response.body.data.id
                },
                (response) => {
                    // error
                });


            api_get('get_texts_in_group/' + this.active_group_id).then(
                (response) => {
                    this.active_texts = response.body;
                    var x = this;

                    Vue.nextTick(function () {
                            // HIGHLIGHTING ALREADY MARKED SPANS
                            x.$http.get('get_annotations_in_group/' + x.active_group_id).then(
                                (response) => {
                                    for (var span of (response.body)) {
                                        var parent = $('#text_' + span.text_id);
                                        highlightCharacterRange(parent,
                                            span.start,
                                            span.end, 'loaded_highlight', 'span');
                                    }
                                },
                                (response) => {
                                    // error
                                }
                            )
                        }
                    )
                },
                (response) => {
                    // error
                })

        },
        "insert_name": function () {
            api_post('add_regex_name', {
                group_id: this.active_group_id,
                regex_name: this.new_regex_name,
            }).then(
                (response) => {
                    this.group = response.body.data.attributes
                },
                (response) => {
                }
            )
        },

        "activate_regex": function (regex_name, event) {

            for (var el of $('.regex_names').children()) {
                $(el).removeClass('active')
            }

            $(event.toElement).addClass('active');
            this.active_regex = regex_name

        },


        "mark_selection": function () {

            if (this.active_regex == '') {
                return
            }

            var sel = rangy.getSelection();
            if (sel.anchorNode.parentElement.closest('.text') == null
                || sel.focusNode.parentElement.closest('.text') == null) {
                return
            }

            var parent1 = sel.anchorNode.parentElement.closest('.annotation_texts_container');
            if (parent1.contains(sel.focusNode)) {


                var parent = sel.anchorNode.parentElement.closest('.text');

                var range = sel.getRangeAt(0);

                var text_id = $(parent).attr('data-texts-id');


                var startrange = rangy.createRange();
                startrange.setStart(parent, 0);
                startrange.collapse();

                var sbm = (startrange.getBookmark());
                var bm = (range.getBookmark());

                // node_offset_from_parent = bm.start - sbm.start;
                var start = bm.start - sbm.start;
                var end = bm.end - sbm.start;


                api_post('save_annotation', {
                    'start': start,
                    'regex_name': this.active_regex,
                    'end': end,
                    'text_id': text_id,
                    'group_id': this.active_group_id,
                    'text': range.toString()
                }).then(
                    (response) => {
                        highlightCharacterRange([parent], start, end, 'manual_highlight', 'span');
                    },
                    (response) => {
                    }
                )
            }
        }

    },
    "created": function () {
        this.get_groups();

    },

});

////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////
var model_testing_data = {
    groups: [],
    active_group: [],
    active_group_id: -1,


    current_model_name: '',
    current_model_text: '',
    models: [],
    model_names: [],
    run_results: [],
    display_true_positives: true,
    display_false_positives: true,
    display_false_negatives: true,


    error: ''
};

var model_testing = new Vue({
    "el": "#model_testing",
    "data": model_testing_data,
    "methods": {


        "flip_true_false_positive": function (item) {
            if (item.result_class == 'false_positive') {
                api_post('save_annotation', {
                    'start': item.start,
                    'regex_name': item.regex_name,
                    'end': item.end,
                    'text_id': item.text_id,
                    'group_id': this.active_group_id,
                    'text': item.content,
                }).then(
                    (response) => {
                        item.result_class = 'true_positive';
                        item.id = response.body.id

                    },
                    (response) => {
                    })

            } else if (item.result_class == 'true_positive') {
                this.$http.delete('api/span/' + item.id, {
                    'id': item.id,
                }).then(
                    (response) => {
                        item.result_class = 'false_positive'
                    },
                    (response) => {
                    })

            }
        },

        'save_model': function () {
            var model_name = this.current_model_name;
            var model_text = this.current_model_text;

            api_post(('save_model_version/' + model_name),
                {'text': model_text}).then(
                (response) => {

                },
                (response) => {
                }
            )


        }, "run_model_text": function () {
            this.save_model();
            this.error = '';
            this.run_results = [];
            var text = this.current_model_text;
            var group_id = this.active_group_id;

            api_post('run_model_text',
                {
                    group_id: group_id,
                    model_text: text
                }).then(
                (response) => {
                    this.run_results = (response.body)
                },
                (response) => {

                    this.error = response.body.err;

                })

        },

        'get_model': function (name) {
            api_get('get_model/' + name).then(
                (response) => {
                    this.models = (response.body).data.attributes
                },
                (response) => {
                    // error
                }
            )


        },
        "get_model_names": function () {
            api_get('get_model_names').then(
                (response) => {
                    this.model_names = (response.body.data.attributes.result)
                },
                (response) => {
                }
            )
        },

        "set_current_model": function (name) {
            this.current_model_name = name;
            api_get('get_model/' + name).then(
                (response) => {
                    this.models = response.body;
                    this.current_model_text = response.body.text;
                },
                (response) => {
                    // error
                }
            )


        },

        'get_group': function () {
            if (this.active_group_id == -1 || this.active_group.id == undefined) {
                return
            }
            api_get('api/text_group/' + this.active_group_id).then(
                (response) => {
                    this.active_group = response.body.data.attributes
                    this.active_group.id = response.body.id
                    this.active_group_id = response.body.id
                },
                (response) => {
                    // error
                })

        },


        "delete_annotation": function (item) {
            this.$http.delete('api/span/' + item.id).then(
                (response) => {

                    var index = this.run_results[item.regex_name].indexOf(item)
                    this.run_results[item.regex_name].splice(index, 1)

                },
                (response) => {
                    // error
                })

        },


        "get_groups": function () {
            api_get('api/text_group').then(
                (response) => {
                    var groups = []
                    for (var elem of response.body.data) {
                        var nelem = elem.attributes
                        nelem.id = elem.id
                        groups.push(
                            nelem
                        )
                    }

                    this.groups = groups

                },
                (response) => {
                    // error
                }
            )

        },

        "run_maybe": function (event) {

            if (event.ctrlKey && this.active_group_id != -1 && this.current_model_name != '') {
                this.run_model_text()
            }
        },

    },


    "created": function () {
        this.get_groups();
        this.get_model_names();
    },


});

