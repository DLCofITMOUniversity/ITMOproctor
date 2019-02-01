var config = require('nconf');
if (!config.get('bots:enable')) {
    module.exports.studentConnected = function() {};
    module.exports.inspectorConnected = function() {};
    return;
}
var moment = require('moment');
var Polyglot = require('node-polyglot');
var polyglot = new Polyglot({
    phrases: require('./locales/' + config.get('bots:lang') + '.json')
});
var bots = [];
if (config.get('bots:telegram:enable')) bots.push(require('./telegram'));
if (config.get('bots:vk:enable')) bots.push(require('./vk'));
var delay = config.get('bots:delay');
var currentExams = [];
var timeout;
var timeoutTime;
var studentConnected = function(exam) {
    exam.startDate = moment().toJSON();
    currentExams.push(exam);
    recheckTimeout();
};
var inspectorConnected = function(exam) {
    var i = currentExams.findIndex(function(ex) {
        return ex._id.toString() === exam._id.toString();
    });
    if (i == -1) return;
    currentExams[i].inspectorConnected = true;
    checkExams(exam);
    recheckTimeout();
};
var recheckTimeout = function() {
    if (currentExams.length > 0) {
        var exam = currentExams.find(function(ex) {
            return !ex.notificated;
        });
        if (exam) {
            if (!timeoutTime || timeoutTime != exam.startDate) {
                if (timeout) clearTimeout(timeout);
                var timeoutDelay = moment(exam.startDate).add(delay, 'seconds').diff(moment());
                timeout = setTimeout(function() {
                    checkExams();
                    recheckTimeout();
                }, timeoutDelay);
                timeoutTime = exam.startDate;
            }
            return;
        }
    }
    if (timeout) clearTimeout(timeout);
    timeout = undefined;
    timeoutTime = undefined;
};
var checkExams = function() {
    var now = moment();
    var connected = '';
    var waiting = '';
    var send = false;
    var n = 1;
    for (var i = currentExams.length - 1; i >= 0; i--) {
        var exam = currentExams[i];
        var startDate = moment(exam.startDate);
        var endDate = moment(exam.endDate);
        var seconds = now.diff(startDate, 'seconds');
        if (exam.inspectorConnected && seconds < delay || endDate <= now) {
            currentExams.splice(i, 1);
            continue;
        }
        var student = getFullName(exam.student);
        var inspector = getFullName(exam.inspector);
        if (exam.inspectorConnected) {
            if (connected) connected += '\n';
            connected += polyglot.t('bots.inspectorConnected', {
                inspector: getFullName(exam.inspector),
                student: getFullName(exam.student)
            });
            currentExams.splice(i, 1);
            send = true;
            continue;
        }
        if (seconds >= delay) {
            var minutes = Math.floor(seconds / 60);
            var time = minutes > 0 ? polyglot.t('bots.minutes', {num: minutes}) : polyglot.t('bots.seconds', {num: seconds});
            if (!waiting) waiting = polyglot.t('bots.studentsWaiting');
            waiting += polyglot.t('bots.studentWaiting', {
                n: n++,
                student: getFullName(exam.student),
                time: time,
                beginDate: moment(exam.beginDate).format('HH:mm'),
                inspector: getFullName(exam.inspector)
            });
            if (!exam.notificated) {
                send = true;
                currentExams[i].notificated = true;
            }
        }
    }
    var msg = connected + (connected && waiting ? '\n\n' : '') + waiting;
    if (send) sendNotifications(msg);
};
var getFullName = function(user) {
    if (!user) return polyglot.t('bots.unknown');
    return user.lastname + ' ' + user.firstname[0] + '.' + (user.middlename ? (user.middlename[0] + '.') : '');
};
var sendNotifications = function(msg) {
    bots.forEach(function(bot) {
        bot.sendNotification(msg);
    });
};
module.exports.studentConnected = studentConnected;
module.exports.inspectorConnected = inspectorConnected;
