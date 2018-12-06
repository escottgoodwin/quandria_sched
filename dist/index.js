'use strict';

var _templateObject = _taggedTemplateLiteral(['\nquery {\n  questions{\n    count\n    questions{\n      id\n      question\n      choices{\n        choice\n      }\n      questionAnswers{\n        answer{\n          choice\n        }\n      }\n      test{\n        subject\n        testNumber\n        course{\n          name\n        }\n      }\n      addedBy{\n        firstName\n        lastName\n        id\n        email\n      }\n      sentTo{\n        id\n        pushToken\n        firstName\n        lastName\n        email\n      }\n    }\n  }\n}\n'], ['\nquery {\n  questions{\n    count\n    questions{\n      id\n      question\n      choices{\n        choice\n      }\n      questionAnswers{\n        answer{\n          choice\n        }\n      }\n      test{\n        subject\n        testNumber\n        course{\n          name\n        }\n      }\n      addedBy{\n        firstName\n        lastName\n        id\n        email\n      }\n      sentTo{\n        id\n        pushToken\n        firstName\n        lastName\n        email\n      }\n    }\n  }\n}\n']);

var _nodeCron = require('node-cron');

var _nodeCron2 = _interopRequireDefault(_nodeCron);

var _apolloFetch = require('apollo-fetch');

var _apolloFetch2 = _interopRequireDefault(_apolloFetch);

var _mail = require('@sendgrid/mail');

var _mail2 = _interopRequireDefault(_mail);

var _apolloLink = require('apollo-link');

var _apolloLinkHttp = require('apollo-link-http');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _taggedTemplateLiteral(strings, raw) { return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }

require('dotenv').config();

var gql = require('graphql-tag');

_mail2.default.setApiKey(process.env.SENDGRID_API_KEY);
// ┌────────────── second (optional)
// │ ┌──────────── minute
// │ │ ┌────────── hour
// │ │ │ ┌──────── day of month
// │ │ │ │ ┌────── month
// │ │ │ │ │ ┌──── day of week
// │ │ │ │ │ │
// │ │ │ │ │ │
// * * * * * *


//const uri = 'http://localhost:4000/';
var uri = 'https://quandria-be.herokuapp.com/';
var link = new _apolloLinkHttp.HttpLink({ uri: uri });

var currentMinute = new Date();
var currentMinute1 = currentMinute;
currentMinute1.setMinutes(currentMinute1.getMinutes() + 1);

var noAnswerQuery = gql(_templateObject);
var operation = {
  query: noAnswerQuery
  //variables: {} //optional
  //operationName: {} //optional
  //context: {} //optional
  //extensions: {} //optional
};

_nodeCron2.default.schedule('* * * * *', function () {
  var now = new Date();
  console.log('running a task every minute');
  console.log(now.toString());

  // select expiring question for current minute

  (0, _apolloLink.makePromise)((0, _apolloLink.execute)(link, operation)).then(function (resp) {
    var questions = resp.data.questions.questions;
    console.log('received data ' + JSON.stringify(questions, null, 2));

    questions.forEach(function (item) {

      var htmlchoices = '';

      item.choices.forEach(function (choice) {
        htmlchoices += '<p>' + choice.choice + '</p>';
      });

      var questionEmail = '<html>\n          <head>\n            <title>' + item.test.subject + ' - ' + item.test.course.name + '</title>\n          </head>\n          <body>\n            <p>Hi ' + item.sentTo.firstName + ' ' + item.sentTo.lastName + '</p>\n              <p>Please has the following question</p>\n              <p>' + item.question + '</p>\n              ' + htmlchoices + '\n              <p> Question from: ' + item.addedBy.firstName + ' ' + item.addedBy.lastName + '</p>\n          </body>\n          </html>';

      var msgSg = {
        to: 'ymroddi@gmail.com',
        from: 'quandria_help@quandria.com',
        subject: 'You have a new question for ' + item.test.subject + ' - ' + item.test.course.name,
        text: "Answer the question. Login.",
        html: questionEmail
      };

      _mail2.default.send(msgSg);
      console.log(msgSg);
    });
  }).catch(function (error) {
    return console.log('received error ' + error);
  });

  // send notifications to expo sd
});