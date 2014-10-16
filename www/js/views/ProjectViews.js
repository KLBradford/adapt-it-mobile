/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define */
define(function (require) {

    "use strict";

    var $               = require('jquery'),
        Backbone        = require('backbone'),
        Handlebars      = require('handlebars'),
        Helpers         = require('app/utils/HandlebarHelpers'),
        Marionette      = require('marionette'),
        Application = require('app/Application'),
        tplProject  = require('text!tpl/NewProject.html'),
        tplCases    = require('text!tpl/ProjectCases.html'),
        tplFonts    = require('text!tpl/ProjectFonts.html'),
        tplFont     = require('text!tpl/ProjectFont.html'),
        tplPunctuation      = require('text!tpl/ProjectPunctuation.html'),
        tplSourceLanguage   = require('text!tpl/ProjectSourceLanguage.html'),
        tplTargetLanguage   = require('text!tpl/ProjectTargetLanguage.html'),
        tplUSFMFiltering    = require('text!tpl/ProjectUSFMFiltering.html'),
        i18n        = require('i18n'),
        LanguagesListView = require('app/views/LanguagesListView'),
        usfm       = require('utils/usfm'),
        langs       = require('utils/languages'),
        projModel   = require('app/models/project'),
        langName    = "",
        langCode    = "",
        step        = 0,
        currentView = null,
        languages   = null,
        projCasesView = null,
        projFontsView = null,
        projSourceLanguageView = null,
        projTargetLanguageView =  null,
        projPunctuationView = null,
        projUSFMFiltingView = null,
        template    = null,

        // CasesView
        // View / edit the upper/lowercase equivlencies for the source and target
        // languages, and whether to automatically copy cases.
        CasesView = Marionette.ItemView.extend({
            template: Handlebars.compile(tplCases),

            ////
            // Event Handlers
            ////
            events: {
                "click #SourceHasCases": "onClickSourceHasCases",
                "click #AutoCapitalize": "onClickAutoCapitalize"
            },

            onClickSourceHasCases: function (event) {
                // enable / disable the autocapitalize checkbox based on the value
                if ($("#SourceHasCases").is(':checked') === true) {
                    $("#AutoCapitalize").prop('disabled', false);
                    if ($("#AutoCapitalize").is(':checked') === true) {
                        $("#CaseEquivs").prop('hidden', false);
                    } else {
                        $("#CaseEquivs").prop('hidden', true);
                    }
                } else {
                    $("#AutoCapitalize").prop('disabled', true);
                    $("#CaseEquivs").prop('hidden', true);
                }
            },

            onClickAutoCapitalize: function (event) {
                // show / hide the cases list based on the value
                if ($("#AutoCapitalize").is(':checked') === true) {
                    $("#CaseEquivs").prop('hidden', false);
                } else {
                    $("#CaseEquivs").prop('hidden', true);
                }
            }
        }),

        // FontsView - display the fonts for source, target and navigation. Clicking on a link
        // opens the FontView
        FontsView = Marionette.ItemView.extend({
            template: Handlebars.compile(tplFonts)
        }),

        // FontView - view / edit a single font
        FontView = Marionette.ItemView.extend({
            template: Handlebars.compile(tplFont)
        }),

        // PunctuationView - view / edit the punctuation pairs, and specify whether to copy the punctuation from
        // source to target
        PunctuationView = Marionette.ItemView.extend({
            template: Handlebars.compile(tplPunctuation),

            events: {
                "click #CopyPunctuation": "onClickCopyPunctuation"
            },

            onClickCopyPunctuation: function (event) {
                // enable / disable the autocapitalize checkbox based on the value
                if ($("#CopyPunctuation").is(':checked') === true) {
                    $("#PunctMappings").prop('hidden', false);
                } else {
                    $("#PunctMappings").prop('hidden', true);
                }
            }
        }),

        // SourceLanguageView - view / edit the source language name and code, as well as
        // any variants. Also specify whether the language is LTR.
        SourceLanguageView = Marionette.ItemView.extend({
            template: Handlebars.compile(tplSourceLanguage),

            initialize: function () {
                // autocomplete takes either an array of strings or suggestion objects. Use the
                // underscore "pluck" method to create an array of strings out of the Ref_Name attribute.
                this.languageList = new langs.LanguageCollection();
            },

            render: function () {
                var contents = template(this.model.toJSON());
                this.$el.html(contents);
                this.listView = new LanguagesListView({collection: this.languageList, el: $("#name-suggestions", this.el)});
                return this;
            },

            events: {
                "keyup #SourceLanguageName":    "search",
                "keypress #SourceLanguageName": "onkeypress"
            },

            search: function (event) {
                // pull out the value from the input field
                var key = $('#SourceLanguageName').val();
                if (key.trim() === "") {
                    // Fix problem where an empty value returns all results.
                    // Here if there's no _real_ value, fetch nothing.
                    this.languageList.fetch({reset: true, data: {name: "    "}});
                } else {
                    // find all matches in the language collection
                    this.languageList.fetch({reset: true, data: {name: key}});
                }
            },

            onkeypress: function (event) {
                if (event.keycode === 13) { // enter key pressed
                    event.preventDefault();
                }
            },

            onSelectLanguage: function (event) {
                // pull out the language
                this.langName = $(event.currentTarget).html().substring($(event.currentTarget).html().indexOf('&nbsp;') + 6).trim();
                $("#langName").html(i18n.t('view.lblSourceLanguageName') + ": " + this.langName);
                this.langCode = $(event.currentTarget).attr('id').trim();
                $("#langCode").html(i18n.t('view.lblCode') + ": " + this.langCode);
            }
        }),

        // TargetLanguageView - view / edit the target language name and code, as well as
        // any variants. Also specify whether the language is LTR.
        TargetLanguageView = Marionette.ItemView.extend({
            template: Handlebars.compile(tplTargetLanguage),

            initialize: function () {
                // autocomplete takes either an array of strings or suggestion objects. Use the
                // underscore "pluck" method to create an array of strings out of the Ref_Name attribute.
                this.languageList = new langs.LanguageCollection();
            },

            render: function () {
                var contents = template(this.model.toJSON());
                this.$el.html(contents);
                this.listView = new LanguagesListView({collection: this.languageList, el: $("#name-suggestions", this.el)});
                return this;
            },

            events: {
                "keyup #TargetLanguageName":    "search",
                "keypress #TargetLanguageName": "onkeypress"
            },

            search: function (event) {
                // pull out the value from the input field
                var key = $('#TargetLanguageName').val();
                if (key.trim() === "") {
                    // Fix problem where an empty value returns all results.
                    // Here if there's no _real_ value, fetch nothing.
                    this.languageList.fetch({reset: true, data: {name: "    "}});
                } else {
                    // find all matches in the language collection
                    this.languageList.fetch({reset: true, data: {name: key}});
                }
            },

            onkeypress: function (event) {
                if (event.keycode === 13) { // enter key pressed
                    event.preventDefault();
                }
            },

            onSelectLanguage: function (event) {
                // pull out the language
                this.langName = $(event.currentTarget).html().substring($(event.currentTarget).html().indexOf('&nbsp;') + 6).trim();
                $("#langName").html(i18n.t('view.lblTargetLanguageName') + ": " + this.langName);
                this.langCode = $(event.currentTarget).attr('id').trim();
                $("#langCode").html(i18n.t('view.lblCode') + ": " + this.langCode);
            }
        }),

        // USFMFilteringView
        // View / edit the USFM markers that are filtered from the UI when
        // adapting.
        USFMFilteringView = Marionette.CompositeView.extend({
            template: Handlebars.compile(tplUSFMFiltering),

            initialize: function () {
                this.coll = new usfm.MarkerCollection();
            },

            render: function () {
                this.coll.fetch({reset: true, data: {name: ""}}); // return all results

                var contents = template(this.coll.toJSON());
                this.$el.html(contents);
                return this;
            },

            events: {
                "click #CustomFilters": "onClickCustomFilters"
            },

            onClickCustomFilters: function (event) {
                // enable / disable the autocapitalize checkbox based on the value
                if ($("#CustomFilters").is(':checked') === true) {
                    $("#USFMFilters").prop('hidden', false);
                } else {
                    $("#USFMFilters").prop('hidden', true);
                }
            }
        }),
        NewProjectView = Marionette.ItemView.extend({
            template: Handlebars.compile(tplProject),

            initialize: function () {
                this.OnNewProject();
                this.render();
                // start the wizard
                this.ShowStep(step);
            },

            render: function () {
                this.$el.html(template());
                return this;
            },

            ////
            // Event Handlers
            ////
            events: {
                "click #sourceFont": "OnEditSourceFont",
                "click #targetFont": "OnEditTargetFont",
                "click #navFont": "OnEditNavFont",
                "keyup #SourceLanguageName":    "searchSource",
                "keypress #SourceLanguageName": "onkeypressSourceName",
                "keyup #TargetLanguageName":    "searchTarget",
                "keypress #TargetLanguageName": "onkeypressTargetName",
                "click .autocomplete-suggestion": "selectLanguage",
                "click #CopyPunctuation": "OnClickCopyPunctuation",
                "click #SourceHasCases": "OnClickSourceHasCases",
                "click #AutoCapitalize": "OnClickAutoCapitalize",
                "click #CustomFilters": "OnClickCustomFilters",
                "click #Prev": "OnPrevStep",
                "click #Next": "OnNextStep"
            },

            searchSource: function (event) {
                currentView.search(event);
            },

            onkeypressSourceName: function (event) {
                currentView.onkeypress(event);
            },

            searchTarget: function (event) {
                currentView.search(event);
            },

            onkeypressTargetName: function (event) {
                currentView.onkeypress(event);
            },

            selectLanguage: function (event) {
                currentView.onSelectLanguage(event);
            },

            OnClickCopyPunctuation: function (event) {
                currentView.onClickCopyPunctuation(event);
            },

            OnClickSourceHasCases: function (event) {
                currentView.onClickSourceHasCases(event);
            },

            OnClickAutoCapitalize: function (event) {
                currentView.onClickAutoCapitalize(event);
            },

            OnClickCustomFilters: function (event) {
                currentView.onClickCustomFilters(event);
            },

            OnEditSourceFont: function (event) {
                console.log("OnEditSourceFont");
    //            currentView = new ProjectFontView({ model: this.model});
    //            // title
    //            this.$("#StepTitle").html(i18n.t('view.lblCreateProject'));
    //            // instructions
    //            this.$("#StepInstructions").html(i18n.t('view.dscProjectSourceLanguage'));
    //            // controls
    //            this.$('#StepContainer').html(currentView.render().el.childNodes);
    //            // first step -- disable the prev button
    //            this.$("#Prev").attr('disabled', 'true');
    //            this.$("#lblPrev").html(i18n.t('view.lblPrev'));
    //            this.$("#lblNext").html(i18n.t('view.lblNext'));
            },

            OnEditTargetFont: function (event) {
                console.log("OnEditTargetFont");
            },

            OnEditNavFont: function (event) {
                console.log("OnEditNavFont");
            },

            OnPrevStep: function (event) {
                // pull the info from the current step
                this.GetProjectInfo(step);
                if (step > 1) {
                    step--;
                }
                this.ShowStep(step);
            },

            OnNextStep: function (event) {
                var coll = null;
                // pull the info from the current step
                this.GetProjectInfo(step);
                if (step < 6) {
                    step++;
                } else {
                    // last step -- finish up
                    coll = new projModel.ProjectCollection();
                    coll.fetch({reset: true, data: {name: ""}});
                    // add the project to the collection
                    coll.add(this.model);
                    // head back to the home page
                    console.log("last step - project count:" + coll.length);
                    $(".back-button").trigger("click");
                }
                this.ShowStep(step);
            },

            GetProjectInfo: function (step) {
                var value = null,
                    index = 0,
                    punctPairs = null,
                    trimmedValue = null;
                switch (step) {
                case 1: // source language
                    this.model.set("SourceLanguageName", currentView.langName);
                    this.model.set("SourceLanguageCode", currentView.langCode);
                    this.model.set("SourceDir", ($('#SourceRTL').is(':checked') === true) ? "rtl" : "ltr");
                    break;
                case 2: // target language
                    this.model.set("TargetLanguageName", currentView.langName);
                    this.model.set("TargetLanguageCode", currentView.langCode);
                    this.model.set("TargetDir", ($('#TargetRTL').is(':checked') === true) ? "rtl" : "ltr");
                    break;
                case 3: // fonts
                    break;
                case 4: // punctuation
                    punctPairs = this.model.get("PunctPairs");
    //                    for (index = 0; index < punctPairs.length; index++) {
    //    //                    punctPairs[index]
    //                    }
                    break;
                case 5: // cases
                    break;
                case 6: // USFM filtering
                    break;
                }
            },

            OnNewProject: function () {
                // create a new project model object
                //this.openDB();
                // create the view objects
                projCasesView = new CasesView({ model: this.model});
                projFontsView = new FontsView({ model: this.model});
                projSourceLanguageView =  new SourceLanguageView({ model: this.model});
                projTargetLanguageView =  new TargetLanguageView({ model: this.model});
                projPunctuationView = new PunctuationView({ model: this.model});
                projUSFMFiltingView = new USFMFilteringView({ model: this.model});
            },

            ShowStep: function (number) {
                // clear out the old view (if any)
                currentView = null;
                switch (number) {
                case 1: // source language
                    currentView = projSourceLanguageView;
                    // title
                    this.$("#StepTitle").html(i18n.t('view.lblCreateProject'));
                    // instructions
                    this.$("#StepInstructions").html(i18n.t('view.dscProjectSourceLanguage'));
                    // controls
                    this.$('#StepContainer').html(currentView.render().el.childNodes);
                    // first step -- disable the prev button
                    this.$("#Prev").attr('disabled', 'true');
                    this.$("#lblPrev").html(i18n.t('view.lblPrev'));
                    this.$("#lblNext").html(i18n.t('view.lblNext'));
                    break;
                case 2: // target language
                    currentView = projTargetLanguageView;
                    // title
                    this.$("#StepTitle").html(i18n.t('view.lblCreateProject'));
                    // instructions
                    this.$("#StepInstructions").html(i18n.t('view.dscProjectTargetLanguage'));
                    // controls
                    this.$('#StepContainer').html(currentView.render().el.childNodes);
                    this.$("#Prev").removeAttr('disabled');
                    break;
                case 3: // fonts
                    currentView = projFontsView;
                    // title
                    $("#StepTitle").html(i18n.t('view.lblCreateProject'));
                    // instructions
                    $("#StepInstructions").html(i18n.t('view.dscProjectFonts'));
                    // controls
                    $('#StepContainer').html(currentView.render().el.childNodes);
                    // Second step -- enable the prev button
                    break;
                case 4: // punctuation
                    currentView = projPunctuationView;
                    // title
                    this.$("#StepTitle").html(i18n.t('view.lblCreateProject'));
                    // instructions
                    this.$("#StepInstructions").html(i18n.t('view.dscProjectPunctuation'));
                    // controls
                    this.$('#StepContainer').html(currentView.render().el.childNodes);
                    break;
                case 5: // cases
                    currentView = projCasesView;
                    // title
                    this.$("#StepTitle").html(i18n.t('view.lblCreateProject'));
                    // instructions
                    this.$("#StepInstructions").html(i18n.t('view.dscProjectCases'));
                    // controls
                    this.$('#StepContainer').html(currentView.render().el.childNodes);
                    // Penultimate step -- enable the next button (only needed
                    // if the user happens to back up from the last one)
                    this.$("#lblNext").html(i18n.t('view.lblNext'));
                    this.$("#imgNext").removeAttr("style");
                    break;
                case 6: // USFM filtering
                    currentView = projUSFMFiltingView;
                    // title
                    this.$("#StepTitle").html(i18n.t('view.lblCreateProject'));
                    // instructions
                    this.$("#StepInstructions").html(i18n.t('view.dscProjectUSFMFiltering'));
                    // controls
                    this.$('#StepContainer').html(currentView.render().el.childNodes);
                    // Last step -- change the text of the Next button to "finish"
                    this.$("#lblNext").html(i18n.t('view.lblFinish'));
                    this.$("#imgNext").attr("style", "display:none");
                    break;
                }
            }
        });
    
    return {
        NewProjectView: NewProjectView,
        CasesView: CasesView,
        FontsView: FontsView,
        FontView: FontView,
        PunctuationView: PunctuationView,
        SourceLanguageView: SourceLanguageView,
        TargetLanguageView: TargetLanguageView,
        USFMFilteringView: USFMFilteringView
    };
});