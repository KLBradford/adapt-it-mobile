/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define */
define(function (require) {

    "use strict";

    var $               = require('jquery'),
        Backbone        = require('backbone'),
        Handlebars      = require('handlebars'),
        Helpers         = require('app/utils/HandlebarHelpers'),
        Marionette      = require('marionette'),
        HomeView        = require('app/views/HomeView'),
        HelpView        = require('app/views/HelpView'),
        WelcomeView     = require('app/views/WelcomeView'),
        NewProjectView  = require('app/views/NewProjectView'),
//        ProjectViews    = require('app/views/ProjectViews'),
        LookupView      = require('app/views/LookupView'),
        projModel       = require('app/models/project'),
        AppRouter       = require('app/router'),
        FastClick       = require('fastclick'),
        PageSlider      = require('app/utils/pageslider'),
        slider          = new PageSlider($('body')),
        ProjectList     = null,
        lookupView      = null,
        helpView        = null,
        newProjectView  = null,
        welcomeView     = null,
        homeView        = null,
        i18n            = require('i18n'),
        lang            = "",
        locale          = "en-AU",  // default


        Application = Marionette.Application.extend({

            // app initialization code. Here we'll initialize localization with the current locale 
            initialize: function (options) {
                // add the UI regions (just the main "content" for now)
                this.addRegions({
                    main: '#content'
                });
                // get the user's locale - mobile or web
                if (typeof navigator.globalization !== 'undefined') {
                    // on mobile phone
                    navigator.globalization.getLocaleName(
                        function (loc) {locale = loc.value; },
                        function () {console.log('Error getting locale\n'); }
                    );
                } else {
                    // in web browser
                    lang = navigator.language.split("-");
                    locale = lang[0];
                }
            //    console.log("locale:" + locale);
                // initialize / load the localization info
                i18n.init({
                    lng: locale,
                    debug: true,
                    fallbackLng: 'en'
                }, function () {
                    // i18next is done asynchronously; this is the callback function
                    // Tell backbone we're ready to start loading the View classes.
                    Backbone.history.start();

                    ProjectList = new projModel.ProjectCollection();
                    ProjectList.fetch({reset: true, data: {name: ""}});

                    var home = new HomeView({collection: ProjectList});

                    // note: our context in this callback is the window object; we've saved the application
                    // there in main.js as window.Application
                    window.Application.main.show(home);
                });

                var router  = new AppRouter({controller: this});

                $(function () {
                    FastClick.attach(document.body);
                });

                $("body").on("click", ".back-button", function (event) {
                    event.preventDefault();
                    window.history.back();
                });
            },

            // Routes from AppRouter (router.js)
            home: function () {
                homeView = new HomeView();
                homeView.delegateEvents();
                slider.slidePage(homeView.$el);
            },

            help: function () {
                helpView = new HelpView();
                helpView.delegateEvents();
                slider.slidePage(helpView.$el);
            },

            project: function () {
                var proj = new projModel.Project();
                newProjectView = new NewProjectView({model: proj});
                newProjectView.delegateEvents();
                slider.slidePage(newProjectView.$el);
            },

            lookupChapter: function (id) {
                lookupView = new LookupView();
                require(["app/models/chapter", "app/views/LookupView"], function (models, LookupView) {
                    var book = new models.Chapter({id: id});
                    book.fetch({
                        success: function (data) {
                            slider.slidePage(new LookupView({model: data}).$el);
                        }
                    });
                });
            },

            adaptChapter: function (id) {
                require(["app/models/chapter", "app/views/ChapterView"], function (models, ChapterView) {
                    var chapter = new models.Chapter({id: id});
                    chapter.fetch({
                        success: function (data) {
                            slider.slidePage(new ChapterView({model: data}).$el);
                        }
                    });
                });
            }
        });
    
    return {
        Application: Application
    };
});