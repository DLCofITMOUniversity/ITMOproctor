//
// Users stats view
//
define([
    "i18n",
    "text!templates/admin/usersStats.html"
], function(i18n, template) {
    console.log('views/admin/usersStats.js');
    var View = Backbone.View.extend({
        initialize: function() {
            // Templates
            this.templates = _.parseTemplate(template);
            // User model
            var User = Backbone.Model.extend({
                urlRoot: 'user'
            });
            this.model = new User();
        },
        destroy: function() {
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
            
            this.$TotalUsers = this.$("#total-users");
            this.$TotalStudents = this.$("#total-students");
            this.$TotalInspectors = this.$("#total-inspectors");
            this.$TotalActiveUsers = this.$("#total-active-users");
            this.$TotalActiveStudents = this.$("#total-active-students");
            this.$TotalActiveInspectors = this.$("#total-active-inspectors");
            
            $.ajax({
                url: "admin/usersStats",
                success: function(data){
                    self.$TotalUsers.html(data.totalUsers);
                    self.$TotalStudents.html(data.totalStudents);
                    self.$TotalInspectors.html(data.totalInspectors);
                    self.$TotalActiveUsers.html(data.totalActiveUsers);
                    self.$TotalActiveStudents.html(data.totalActiveStudents);
                    self.$TotalActiveInspectors.html(data.totalActiveInspectors);
                    self.openChart(data);
                }
            });
            
            return this;
        },
        openChart: function(data) {
            var chartData = [
                {
                    x: [i18n.t('admin.usersStats.totalUsers'), i18n.t('admin.usersStats.totalStudents'), i18n.t('admin.usersStats.totalInspectors')],
                    y: [data.totalUsers, data.totalStudents, data.totalInspectors],
                    marker: {color: ['rgba(31,119,180,0.7)', 'rgba(255,127,14,0.7)', 'rgba(44,160,44,0.7)']},
                    type: 'bar'
                }, {
                    x: [i18n.t('admin.usersStats.totalUsers'), i18n.t('admin.usersStats.totalStudents'), i18n.t('admin.usersStats.totalInspectors')],
                    y: [data.totalActiveUsers, data.totalActiveStudents, data.totalActiveInspectors],
                    marker: {color: ['rgba(31,119,180,1)', 'rgba(255,127,14,1)', 'rgba(44,160,44,1)']},
                    type: 'bar'
                }
            ];
            
            var layout = {
                width: 400,
                height: 400,
                showlegend: false,
                barmode: 'overlay',
                xaxis: {
                    ticklen: 5,
                    tickcolor: 'rgba(0,0,0,0)'
                },
                yaxis: {
                    rangemode: 'nonnegative'
                },
                margin: {
                    l: 45,
                    r: 20,
                    b: 30,
                    t: 5
                }
            };
            Plotly.newPlot('users-chart', chartData, layout, {displayModeBar: false, staticPlot: true});
        }
    });
    return View;
});