//
// Admin view
//
define([
    "i18n",
    "text!templates/admin/main.html",
    "views/profile/editor",
    "views/settings",
    "views/demo"
], function(i18n, template, ProfileEditor, SettingsView, DemoView) {
    console.log('views/admin/main.js');
    var View = Backbone.View.extend({
        bindings: {
            '.server-date': {
                observe: 'time',
                onGet: function(val) {
                    return moment(val).format('DD.MM.YYYY');
                }
            },
            '.server-time': {
                observe: 'time',
                onGet: function(val) {
                    return moment(val).format('HH:mm:ss');
                }
            }
        },
        initialize: function() {
            // Templates
            this.templates = _.parseTemplate(template);
            // Sub views
            this.view = {
                profile: new ProfileEditor(),                
                settings: new SettingsView(),
                demo: new DemoView(),
            };
        },
        destroy: function() {
            for (var v in this.view) {
                if (this.view[v]) this.view[v].destroy();
            }
            this.remove();
        },
        render: function() {
            var self = this;
            var tpl = _.template(this.templates['main-tpl']);
            var data = {
                i18n: i18n
            };
            this.$el.html(tpl(data));
            $.parser.parse(this.$el);
            // jQuery selectors
            this.$Menu = $('#main-menu');
            this.$Tabs = this.$('.admin-tabs');
            this.$Tabs.tabs({
                onAdd: function(title, index) {
                    var target = this;
                    var tab = $(this).tabs('getTab', index);
                    if (!this.views) this.views = {};
                    require([
                        "views/admin/" + tab[0].id
                    ], function(View) {
                        var view = new View({
                            el: tab[0],
                            parent: self,
                            params: $(tab).find('.tab-content').data()
                        });
                        view.render();
                        target.views[title] = view;
                    });
                },
                onClose: function(title, index) {
                    if (this.views[title]) {
                        this.views[title].destroy();
                        delete this.views[title];
                    }
                }
            });
            this.$Tree = this.$('.admin-tree');
            this.$Tree.tree({
                data: [{
                    text: i18n.t('admin.management'),
                    children: [{
                        id: 'users',
                        text: i18n.t('admin.users.title')
                    }, {
                        id: 'exams',
                        text: i18n.t('admin.exams.title')
                    }, {
                        id: 'schedules',
                        text: i18n.t('admin.schedules.title')
                    }]
                }, {
                    text: i18n.t('admin.statistics'),
                    children: [{
                        id: 'usersStats',
                        text: i18n.t('admin.usersStats.title'),
                        tabText: i18n.t('admin.usersStats.tabTitle')
                    }, {
                        id: 'examsStats',
                        text: i18n.t('admin.examsStats.title'),
                        tabText: i18n.t('admin.examsStats.tabTitle')
                    }, {
                        id: 'schedulesStats',
                        text: i18n.t('admin.schedulesStats.title'),
                        tabText: i18n.t('admin.schedulesStats.tabTitle')
                    }]
                }, {
                    text: i18n.t('admin.help'),
                    children: [{
                        id: 'about',
                        text: i18n.t('admin.about.title')
                    }]
                }],
                onClick: this.renderTab.bind(this)
            });
            // DOM events
            this.$Menu.menu({
                onClick: function(item) {
                    switch (item.name) {
                        case "profile":
                            self.view.profile.doOpen();
                            break;
                        case "demo":
                            self.view.demo.doOpen();
                            break;
                        case "settings":
                            self.view.settings.doOpen();
                            break;
                        case "logout":
                            app.logout();
                            break;
                    }
                }
            });
            this.stickit(app.time);
            return this;
        },
        renderTab: function(node) {
            if (!node.id) return;
            var exist = this.$Tabs.tabs('exists', node.tabText || node.text);
            if (exist) return this.$Tabs.tabs('select', node.tabText || node.text);
            var tabContent = $('<div class="tab-content">' + i18n.t('loading') + '</div>');
            for (var k in node.params) tabContent.data(k, node.params[k]);
            this.$Tabs.tabs('add', {
                id: node.id,
                title: node.tabText || node.text,
                content: tabContent,
                closable: true
            });
        }
    });
    return View;
});