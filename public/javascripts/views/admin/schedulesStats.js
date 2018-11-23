//
// Schedules stats view
//
define([
    "i18n",
    "text!templates/admin/schedulesStats.html"
], function(i18n, template) {
    console.log('views/admin/scheduleStats.js');
    var View = Backbone.View.extend({
        events: {
            "click .schedules-refresh-btn": "doRefresh"
        },
        initialize: function() {
            var self = this;
            this.hourOffset = 5;
            // Templates
            this.templates = _.parseTemplate(template);
            // Window events
            this.throttle = function(callback) {
                var limit = 200;
                var delay = 100;
                var wait = false;
                var timeout;
                return function() {
                    if (!wait) {
                        callback.call();
                        wait = true;
                        setTimeout(function() {
                            wait = false;
                        }, limit);
                    }
                    // Debouncing
                    clearTimeout(timeout);
                    timeout = setTimeout(callback, delay);
                };
            };
            this.resizeEventHandler = function(event) {
                self.updateChartsWidth();
            };
            window.addEventListener('resize', this.throttle(this.resizeEventHandler));
        },
        destroy: function() {
            for (var v in this.view) {
                if (this.view[v]) this.view[v].destroy();
            }
            window.removeEventListener('resize', this.throttle(this.resizeEventHandler));
            this.$SchedulesChartsContainer.find('.chart').off();
            this.remove();
        },
        render: function() {
            var self = this;
            var tpl = _.template(this.templates['main-tpl']);
            this.chartTpl = _.template(this.templates['chart-tpl']);
            var data = {
                i18n: i18n
            };
            this.$el.html(tpl(data));
            $.parser.parse(this.$el);
            this.$LegendChart = this.$('#legend-chart');
            this.$SchedulesChartsContainer = this.$('#schedules-charts-container');

            // Event handlers
            this.$FromDate = this.$(".date-from");
            this.$FromDate.datebox({
                value: app.now().format("DD.MM.YYYY"),
                delay: 0,
                onChange: function(date) {
                    var valid = moment(date, "DD.MM.YYYY", true).isValid();
                    if (!date || valid) self.doSearch();
                }
            });
            this.$ToDate = this.$(".date-to");
            this.$ToDate.datebox({
                value: app.now().add(1, 'days').format("DD.MM.YYYY"),
                delay: 0,
                onChange: function(date) {
                    var valid = moment(date, "DD.MM.YYYY", true).isValid();
                    if (!date || valid) self.doSearch();
                }
            });
            this.$TextSearch = this.$(".text-search");
            this.$TextSearch.searchbox({
                searcher: function(value, name) {
                    self.doSearch();
                }
            });
            
            this.openLegend();
            this.doSearch();
        },
        getDates: function() {
            var fromVal = this.$FromDate.datebox('getValue');
            var toVal = this.$ToDate.datebox('getValue');
            var fromDate = fromVal ? moment(fromVal, 'DD.MM.YYYY').add(this.hourOffset, 'hours').toJSON() : null;
            var toDate = toVal ? moment(toVal, 'DD.MM.YYYY').add(this.hourOffset, 'hours').toJSON() : null;
            return {
                from: fromDate,
                to: toDate
            };
        },
        doSearch: function() {
            var self = this;
            var dates = this.getDates();
            $.ajax({
                url: "admin/schedulesStats",
                data: {
                    from: dates.from,
                    to: dates.to,
                    text: self.$TextSearch.textbox('getValue').trim()
                },
                success: function(data) {
                    self.openCharts(data);
                }
            });
        },
        openLegend: function() {
            var chartData = {
                x: [],
                base: [],
                y: [],
                type: 'bar',
                orientation: 'h',
                marker: {
                    color: []
                }
            };
            var intervals = 100;
            for (var i = 0; i < intervals; i++) {
                var h = 120 - i / intervals * 120;
                var s = 90;
                var v = 90;
                chartData.x.push(1.5);
                chartData.base.push(i);
                chartData.y.push(1);
                chartData.marker.color.push('hsv(' + h + ',' + s + ',' + v + ')');
            }
            chartData.x.push(intervals);
            chartData.base.push(0);
            chartData.y.push(0);
            chartData.marker.color.push('hsv(0,0,0)');

            var layout = {
                width: 650,
                height: 100,
                showlegend: false,
                xaxis: {
                    showgrid: false,
                    zeroline: false,
                    showticklabels: false
                },
                yaxis: {
                    showgrid: false,
                    zeroline: false,
                    showticklabels: false
                },
                annotations: [{
                    xref: 'paper',
                    yref: 'paper',
                    xshift: 80,
                    yshift: 20,
                    xanchor: 'left',
                    showarrow: false,
                    text: i18n.t('admin.schedulesStats.textLegendWorkload'),
                    align: 'left'
                }, {
                    xref: 'paper',
                    yref: 'paper',
                    xshift: 80,
                    yshift: -20,
                    xanchor: 'left',
                    showarrow: false,
                    text: i18n.t('admin.schedulesStats.textLegendWarning'),
                    align: 'left'
                }],
                margin: {
                    t: 10,
                    r: 450,
                    b: 10,
                    l: 30
                }
            };
            Plotly.newPlot(this.$LegendChart[0], [chartData], layout, { displayModeBar: false, staticPlot: true });
        },
        openCharts: function(data) {
            this.$SchedulesChartsContainer.empty();
            if (!Object.keys(data).length || !data.interval) return;
            var self = this;
            var dates = this.getDates();
            var days = moment(dates.to).diff(moment(dates.from), 'days');
            var leftHour = 7; // hours
            var rightHour = 24 + 2; // hours
            var step = 30; // minutes
            var interval = data.interval; // minutes
            var intervalsPerStep = step / interval;
            var intervalsPerDay = 24 * 60 / interval;
            var baseOffset = this.hourOffset * 60;
            var barHeight = 40;

            for (var day = 0; day < days; day++) {
                var counter = 0;

                var chartData = {
                    x: [],
                    base: [],
                    y: [],
                    values: [],
                    text: [],
                    type: 'bar',
                    orientation: 'h',
                    hoverinfo: 'text',
                    hoverlabel: {
                        bgcolor: '#fff'
                    },
                    marker: {
                        color: []
                    }
                };
                var minHour = leftHour;
                var maxHour = rightHour;
                for (var insId in data.timetable) {
                    var insTimetable = data.timetable[insId];
                    var inspector = data.inspectors[insId];
                    var inspectorName = this.getFullName(inspector);
                    var inspectorWorking = false;

                    for (var i = intervalsPerDay * day; i < insTimetable.length && i < intervalsPerDay * (day + 1); i++) {
                        if (insTimetable[i] === null) continue;

                        if (i % intervalsPerStep === intervalsPerStep - 1)
                            var intervalDuration = interval - 0.5;
                        else
                            var intervalDuration = interval + 0.5;
                        var intervalOffset = (i % intervalsPerDay) * interval + baseOffset;

                        var shiftedHour = ((i * interval) / 60) % 24;
                        minHour = Math.min(minHour - this.hourOffset, shiftedHour) + this.hourOffset;
                        maxHour = Math.max(maxHour - this.hourOffset, shiftedHour) + this.hourOffset;

                        var concurrent = insTimetable[i].length;
                        var concurrentTotal = data.timetableTotal[insId][i] || 0;
                        if (insTimetable[i - 1]) {
                            var examsBeginnings = insTimetable[i].reduce(function(res, examId) {
                                return res + (insTimetable[i - 1].includes(examId) ? 0 : 1);
                            }, 0);
                        }
                        else {
                            var examsBeginnings = insTimetable[i].length;
                        }
                        var examsBeginningsTotal = data.examsBeginningsTotal[insId][i] || 0;
                        if (concurrent > concurrentTotal || examsBeginnings > examsBeginningsTotal) {
                            var h = 0;
                            var s = 0;
                            var v = 0;
                        }
                        else {
                            var h = 120 - concurrent / concurrentTotal * 120;
                            var s = 90;
                            var v = 90;
                        }

                        var value = i % intervalsPerDay + baseOffset;
                        var time = moment.unix((i * interval + baseOffset) * 60).utc().format('HH:mm');
                        var text = time + '. ' + i18n.t('admin.schedulesStats.concurrent') + ': ' + concurrent + '/' + concurrentTotal
                            + '. ' + i18n.t('admin.schedulesStats.examsBeginnings') + ': ' + examsBeginnings + '/' + examsBeginningsTotal;
                        if (concurrent) {
                            text += insTimetable[i].reduce(function(res, examId) {
                                var exam = data.exams.find(function(exam) {
                                    return exam._id === examId;
                                });
                                var studentName = self.getFullName(exam.student);
                                var beginTime = moment(exam.beginDate).format('HH:mm');
                                var endTime = moment(exam.endDate).format('HH:mm');
                                return res + '<br>' + studentName + ' (' + beginTime + ' - ' + endTime + ')';
                            }, '');
                        }

                        chartData.x.push(intervalDuration);
                        chartData.base.push(intervalOffset);
                        chartData.y.push(inspectorName);
                        chartData.marker.color.push('hsv(' + h + ',' + s + ',' + v + ')');
                        chartData.values.push(value);
                        chartData.text.push(text);
                        inspectorWorking = true;
                    }
                    if (inspectorWorking) counter++;
                }
                if (counter == 0) continue;

                var templateData = {
                    title: moment(dates.from).add(day, 'days').format('DD.MM.YYYY')
                };
                this.$SchedulesChartsContainer.append(this.chartTpl(templateData));
                var chart = this.$SchedulesChartsContainer.find('.chart').last();

                minHour = Math.floor(minHour);
                maxHour = Math.ceil(maxHour);
                var tickvals = [];
                var ticktext = [];
                for (var i = minHour * 60; i <= maxHour * 60; i += step) {
                    var hours = Math.floor(i / 60);
                    tickvals.push(i);
                    ticktext.push((i / 60 == hours) ? (hours % 24 + ':00') : '');
                }

                var layout = {
                    barmode: 'stack',
                    showlegend: false,
                    hovermode: 'closest',
                    xaxis: {
                        range: [minHour * 60 - 2, maxHour * 60 + 2],
                        fixedrange: true,
                        tickcolor: 'rgba(0,0,0,0)',
                        tickmode: 'array',
                        tickvals: tickvals,
                        ticktext: ticktext,
                        tickangle: 0,
                        gridcolor: '#ccc'
                    },
                    yaxis: {
                        autorange: 'reversed',
                        fixedrange: true
                    },
                    margin: {
                        t: 10,
                        r: 50,
                        b: 30,
                        l: 120
                    }
                };
                layout.height = counter * barHeight + layout.margin.t + layout.margin.b;
                Plotly.newPlot(chart[0], [chartData], layout, { displayModeBar: false });

                var dragLayer = this.$('.nsewdrag');
                $(chart[day]).on('plotly_hover', function(data) {
                    dragLayer.css('cursor', 'pointer');
                });
                $(chart[day]).on('plotly_unhover', function(data) {
                    dragLayer.css('cursor', 'default');
                });
            }

            Plotly.d3.select('.cursor-pointer').style('cursor', 'default');
            this.updateChartsWidth();
        },
        updateChartsWidth: function() {
            var width = this.$SchedulesChartsContainer.width() > 1000 ? this.$SchedulesChartsContainer.width() : 1000;
            var layout = {
                width: width
            };
            var charts = this.$SchedulesChartsContainer.find('.chart');
            for (var i = 0; i < charts.length; i++) {
                if (charts[i].classList.contains('js-plotly-plot'))
                    Plotly.relayout(charts[i], layout);
            }
        },
        getFullName: function(user) {
            return user.lastname + ' ' + user.firstname[0] + '. ' + (user.middlename ? (user.middlename[0] + '.') : '');
        },
        doRefresh: function(e) {
            this.doSearch();
        }
    });
    return View;
});