//
// Router
//
define([], function() {
    console.log('router.js');
    var $body = $('body');
    var $content = $('<div id="content"></div>');
    var Router = Backbone.Router.extend({
        routes: {
            "login": "login",
            "study": "study",
            "talk/:examId": "talk",
            "monitor": "monitor",
            "vision/:examId": "vision",
            "multivision/:examId": "multivision",
            "multivision/": "multivision",
            "admin": "admin",
            "*path": "main"
        },
        render: function(View, options, auth) {
            $.messager.progress('close');
            if (auth || app.isAuth()) {
                if (app.content) {
                    app.content.destroy();
                }
                $body.html($content);
                options = options || {};
                options.el = $('#content');
                app.content = new View(options);
                app.content.render();
            }
            else {
                this.navigate("login", {
                    trigger: true
                });
            }
        },
        main: function() {
            if (app.isAuth()) {
                var role = app.profile.get("role");
                var navigate = "login";
                switch (role) {
                    case 1:
                        navigate = "study";
                        break;
                    case 2:
                        navigate = "monitor";
                        break;
                    case 3:
                        navigate = "admin";
                        break;
                }
                this.navigate(navigate, {
                    trigger: true
                });
            }
            else {
                this.navigate("login", {
                    trigger: true
                });
            }
        },
        login: function() {
            var self = this;
            requirejs([
                "views/login"
            ], function(View) {
                self.render(View, null, true);
            });
        },
        study: function() {
            var self = this;
            requirejs([
                "views/study"
            ], function(View) {
                self.render(View);
            });
        },
        talk: function(examId) {
            var self = this;
            requirejs([
                "views/talk"
            ], function(View) {
                self.render(View, {
                    examId: examId
                });
            });
        },
        monitor: function() {
            var self = this;
            requirejs([
                "views/monitor"
            ], function(View) {
                self.render(View);
            });
        },
        vision: function(examId) {
            var self = this;
            requirejs([
                "views/vision"
            ], function(View) {
                self.render(View, {
                    examId: examId
                });
            });
        },
        multivision: function(examId) {
            var self = this;
            requirejs([
                "views/multivision"
            ], function(View) {
                self.render(View, {
                    examId: examId
                });
            });
        },
        admin: function(examId) {
            var self = this;
            requirejs([
                "views/admin/main"
            ], function(View) {
                self.render(View, {
                    examId: examId
                });
            });
        }
    });
    return Router;
});