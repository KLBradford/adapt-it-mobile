/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define */
define(function (require) {

    "use strict";

    var $           = require('jquery'),
        Backbone    = require('backbone'),
        i           = 0,
        projects = [],
        
        findById = function (id) {
            var i = 0,
                deferred = $.Deferred(),
                project = null,
                l = projects.length;
            for (i = 0; i < l; i++) {
                if (projects[i].id === id) {
                    project = projects[i];
                    break;
                }
            }
            deferred.resolve(project);
            return deferred.promise();
        },

        findByName = function (searchKey) {
            var deferred = $.Deferred();
            var results = null;
            if (projects !== null) {
                results = projects.filter(function (element) {
                    return element.attributes.name.toLowerCase().indexOf(searchKey.toLowerCase()) > -1;
                });
            }
            deferred.resolve(results);
            return deferred.promise();
        },

        Project = Backbone.Model.extend({
            defaults: {
                SourceFont: "Source Sans",
                SourceFontSize: "16",
                SourceColor: "#0000aa",
                TargetFont: "Source Sans",
                TargetFontSize: "16",
                TargetColor: "#000000",
                NavigationFont: "Source Sans",
                NavigationFontSize: "16",
                NavigationColor: "#00cc00",
                SourceLanguageName: "",
                TargetLanguageName: "",
                SourceLanguageCode: "",
                TargetLanguageCode: "",
                SourceVariant: "",
                TargetVariant: "",
                CopyPunctuation: "true",
                PunctPairs: [
                    {
                        s: "?",
                        t: "?"
                    },
                    {
                        s: ".",
                        t: "."
                    },
                    {
                        s: ",",
                        t: ","
                    },
                    {
                        s: ";",
                        t: ";"
                    },
                    {
                        s: ":",
                        t: ":"
                    },
                    {
                        s: "\"",
                        t: "\""
                    },
                    {
                        s: "!",
                        t: "!"
                    },
                    {
                        s: "(",
                        t: "("
                    },
                    {
                        s: ")",
                        t: ")"
                    },
                    {
                        s: "<",
                        t: "<"
                    },
                    {
                        s: ">",
                        t: ">"
                    },
                    {
                        s: "{",
                        t: "{"
                    },
                    {
                        s: "}",
                        t: "}"
                    },
                    {
                        s: "“",
                        t: "“"
                    },
                    {
                        s: "”",
                        t: "”"
                    },
                    {
                        s: "‘",
                        t: "‘"
                    },
                    {
                        s: "’",
                        t: "’"
                    }
                ],
                AutoCapitalization: "false",
                SourceHasUpperCase: "false",
                CasePairs: [
                    {
                        s: "aA",
                        t: "aA"
                    },
                    {
                        s: "bB",
                        t: "bB"
                    },
                    {
                        s: "cC",
                        t: "cC"
                    },
                    {
                        s: "dD",
                        t: "dD"
                    },
                    {
                        s: "eE",
                        t: "eE"
                    },
                    {
                        s: "fF",
                        t: "fF"
                    },
                    {
                        s: "gG",
                        t: "gG"
                    },
                    {
                        s: "hH",
                        t: "hH"
                    },
                    {
                        s: "iI",
                        t: "iI"
                    },
                    {
                        s: "jJ",
                        t: "jJ"
                    },
                    {
                        s: "kK",
                        t: "kK"
                    },
                    {
                        s: "lL",
                        t: "lL"
                    },
                    {
                        s: "mM",
                        t: "mM"
                    },
                    {
                        s: "nN",
                        t: "nN"
                    },
                    {
                        s: "oO",
                        t: "oO"
                    },
                    {
                        s: "pP",
                        t: "pP"
                    },
                    {
                        s: "qQ",
                        t: "qQ"
                    },
                    {
                        s: "rR",
                        t: "rR"
                    },
                    {
                        s: "sS",
                        t: "sS"
                    },
                    {
                        s: "tT",
                        t: "tT"
                    },
                    {
                        s: "uU",
                        t: "uU"
                    },
                    {
                        s: "vV",
                        t: "vV"
                    },
                    {
                        s: "wW",
                        t: "wW"
                    },
                    {
                        s: "xX",
                        t: "xX"
                    },
                    {
                        s: "yY",
                        t: "yY"
                    },
                    {
                        s: "zZ",
                        t: "zZ"
                    }
                ],
                SourceDir: "",
                TargetDir: "",
                NavDir: "",
                id: 0,
                name: "",
                lastDocument: "",
                lastAdaptedBookID: 0,
                lastAdaptedChapterID: 0,
                lastAdaptedName: "",
                CustomFilters: "false",
                FilterMarkers: "\\lit \\_table_grid \\_header \\_intro_base \\x \\r \\cp \\_horiz_rule \\ie \\rem \\_unknown_para_style \\_normal_table \\note \\_heading_base \\_hidden_note \\_footnote_caller \\_dft_para_font \\va \\_small_para_break \\_footer \\_vernacular_base \\pro \\xt \\_notes_base \\__normal \\xdc \\ide \\mr \\xq \\_annotation_ref \\_annotation_text \\_peripherals_base \\_gls_lang_interlinear \\free \\rq \\_nav_lang_interlinear \\_body_text \\cl \\xot \\efm \\bt \\_unknown_char_style \\_double_boxed_para \\_hdr_ftr_interlinear \\xk \\_list_base \\ib \\xnt \\fig \\restore \\_src_lang_interlinear \\vp \\_tgt_lang_interlinear \\ef \\ca \\xo \\_single_boxed_para \\sts "
            },
            
            initialize: function () {
                this.on('change', this.save, this);
            },
            fetch: function () {
                // search for our key - p.<id>
                this.set(JSON.parse(localStorage.getItem("p." + this.id)));
            },
            save: function (attributes) {
                // only save if the id actually has a value
                if (this.id > 0) {
                    // save with a key of p.<id>
                    localStorage.setItem(("p." + this.id), JSON.stringify(this));
                }
                window.Application.db.transaction(function (tx) {
//                    tx.executeSql('CREATE TABLE IF NOT EXISTS project (id integer primary key, data text, data_num integer);');
                    tx.executeSql('CREATE TABLE IF NOT EXISTS targetunit (id integer primary key, projectid integer, source text, timestamp text, user text);');
                    tx.executeSql('CREATE TABLE IF NOT EXISTS book (id integer primary key, bookid text, scrid text, projectid integer, name text, filename text, chapters integer);');
                    tx.executeSql('CREATE TABLE IF NOT EXISTS chapter (id integer primary key, chapterid text, bookid text, projectid integer, name text, lastadapted integer, versecount integer);');
                    tx.executeSql('CREATE TABLE IF NOT EXISTS sourcephrase (id integer primary key, spid text, chapterid text, markers text, orig text, prepuncts text, midpuncts text, follpuncts text, source text, target text);');
                });
                
//                window.Application.db.transaction(function (tx) {
//                    tx.executeSql("INSERT INTO project VALUES (\'" + this.id + "\',\'" + + "\')", ["test", 100], function (tx, res) {
//                    });
//                });
            },
            destroy: function (options) {
                localStorage.removeItem(this.id);
            },

            sync: function (method, model, options) {
                // read is the only method currently implemented for in-memory;
                // the others will simply return a success state.
                switch (method) {
                case 'create':
                    options.success(model);
                    break;
                        
                case 'read':
                    findById(this.id).done(function (data) {
                        options.success(data);
                    });
                    break;
                        
                case 'update':
                    model.save();
                    options.success(model);
                    break;
                        
                case 'delete':
                    model.destroy(options);
                    options.success(model);
                    break;
                }
            }

        }),

        ProjectCollection = Backbone.Collection.extend({

            model: Project,

            resetFromLocalStorage: function () {
                var i = 0,
                    len = 0;
                for (i = 0, len = localStorage.length; i < len; ++i) {
                    // if this is a project, add it to our collection
                    if (localStorage.key(i).substr(0, 2) === "p.") {
                        var proj = new Project();
                        proj.set(JSON.parse(localStorage.getItem(localStorage.key(i))));
                        projects.push(proj);
                    }
                }
            },
            
//            resetFromDB: function (callback) {
//                directory.db.transaction(
//                    function (tx) {
//                        var sql =
//                            "CREATE TABLE IF NOT EXISTS project ( " +
//                            "id INTEGER PRIMARY KEY AUTOINCREMENT, " +
//                            "SourceFont VARCHAR(50), " +
//                            "SourceFontSize VARCHAR(3), " +
//                            "SourceFontColor VARCHAR(8), " +
//                            "TargetFont VARCHAR(50), " +
//                            "TargetFontSize VARCHAR(3), " +
//                            "TargetFontColor VARCHAR(8), " +
//                            "NavigationFont VARCHAR(50), " +
//                            "NavigationFontSize VARCHAR(3), " +
//                            "NavigationFontColor VARCHAR(8), " +
//                            "SourceLanguageName VARCHAR(50), " +
//                            "TargetLanguageName VARCHAR(50), " +
//                            "SourceLanguageCode VARCHAR(50), " +
//                            "TargetLanguageCode VARCHAR(50), " +
//                            "SourceVariant VARCHAR(40), " +
//                            "TargetVariant VARCHAR(40), " +
//                            "CopyPunctuation BOOLEAN, " +
//                            "PunctPairs VARCHAR(40), " +
//                            "AutoCapitalization BOOLEAN, " +
//                            "SourceHasUpperCase BOOLEAN, " +
//                            "CasePairs VARCHAR(40), " +
//                            "SourceDir VARCHAR(4), " +
//                            "TargetDir VARCHAR(4), " +
//                            "NavDir VARCHAR(4), " +
//                            "name VARCHAR(50), " +
//                            "LastDocument VARCHAR(50), " +
//                            "LastAdaptedName VARCHAR(50), " +
//                            "LastAdaptedChapter VARCHAR(50), " +
//                            "LastAdaptedID VARCHAR(50), " +
//                            "CustomFilters BOOLEAN, " +
//                            "FilterMarkers VARCHAR(1000))";
//                        console.log('Creating EMPLOYEE table');
//                        tx.executeSql(sql);
//                    },
//                    function (tx, error) {
//                        alert('Transaction error ' + error);
//                    },
//                    function (tx) {
//                        callback();
//                    }
//                );
//            },
            
            initialize: function () {
                this.resetFromLocalStorage();
            },

            sync: function (method, model, options) {
                if (method === "read") {
                    findByName(options.data.name).done(function (data) {
                        options.success(data);
                    });
                }
            }

        });
    
    return {
        Project: Project,
        ProjectCollection: ProjectCollection
    };

});