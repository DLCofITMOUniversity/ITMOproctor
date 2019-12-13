//
// Members view
//
define([
    "i18n",
    "text!templates/members.html"
], function(i18n, template) {
    console.log('views/members.js');
    var View = Backbone.View.extend({
        className: "members-view",
        initialize: function(options) {
            // Variables
            var self = this;
            this.options = options || {};
            // Templates
            this.templates = _.parseTemplate(template);
            // Single item view
            this.ItemView = Backbone.View.extend({
                tagName: "li",
                initialize: function() {
                    this.tpl = _.template(self.templates['member-item-tpl']);
                    this.listenTo(this.model, 'change', this.render);
                    this.listenTo(this.model, 'destroy', this.remove);
                },
                render: function() {
                    var member = this.model.toJSON();
                    if (self.options.showInfo) {
                        member.platform = app.platformString(member, i18n);
                        member.app = app.appString(member);
                    }
                    this.$el.html(this.tpl({
                        i18n: i18n,
                        member: member,
                        showInfo: self.options.showInfo
                    }));
                    return this;
                }
            });
            // Members
            var Members = Backbone.Collection.extend({
                url: 'members/' + this.options.examId
            });
            this.collection = new Members();
            this.listenTo(this.collection, 'add', this.appendItem);
            // Socket notification
            app.io.notify.on('members-' + this.options.examId, function(data) {
                self.collection.fetch();
            });
        },
        render: function() {
            var tpl = _.template(this.templates['main-tpl']);
            var data = {
                i18n: i18n
            };
            this.$el.html(tpl(data));
            $.parser.parse(this.$el);
            // jQuery selectors
            this.$Panel = this.$(".members-panel");
            this.$Output = this.$(".members-output");
            this.collection.fetch();
            return this;
        },
        destroy: function() {
            if (app.io) app.io.notify.removeListener('members-' + this.options.examId);
            this.remove();
        },
        appendItem: function(model) {
            var view = new this.ItemView({
                model: model
            });
            this.$Output.append(view.render().el);
        }
    });
    return View;
});