require('dotenv').config()
import cron from 'node-cron'
import createApolloFetch from 'apollo-fetch'
import sgMail from '@sendgrid/mail'
import { execute, makePromise } from 'apollo-link'
import HttpLink from 'apollo-link-http'
import gql from 'graphql-tag'

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

//const uri = 'http://localhost:4000/';
const uri = process.env.GRAPHQL_SERVER
const link = new HttpLink({ uri })

const currentMinute = new Date()
const currentMinute1 = currentMinute
currentMinute1.setMinutes(currentMinute1.getMinutes() + 1)

const noAnswerQuery = gql`
query {
  questions{
    count
    questions{
      id
      question
      choices{
        choice
      }
      questionAnswers{
        answer{
          choice
        }
      }
      test{
        subject
        testNumber
        course{
          name
        }
      }
      addedBy{
        firstName
        lastName
        id
        email
      }
      sentTo{
        id
        pushToken
        firstName
        lastName
        email
      }
    }
  }
}
`
const operation = {
  query: noAnswerQuery,
}

cron.schedule('* * * * *', () => {

  console.log('running a task every minute');

// select expiring question for current minute

  makePromise(execute(link, operation))
    .then(resp => {
      const questions = resp.data.questions.questions
      //console.log(`received data ${JSON.stringify(questions, null, 2)}`)

      questions.forEach(item => {

        let htmlchoices = ''

        item.choices.forEach(choice => { htmlchoices += '<p>' + choice.choice + '</p>' })

        const questionEmail =
          `<html>
          <head>
            <title>${item.test.subject} - ${item.test.course.name}</title>
          </head>
          <body>
            <p>Hi ${ item.sentTo.firstName} ${ item.sentTo.lastName }</p>
              <p>Please has the following question</p>
              <p>${ item.question }</p>
              ${htmlchoices}
              <p> Question from: ${ item.addedBy.firstName } ${ item.addedBy.lastName }</p>
          </body>
          </html>`

        const msgSg = {
          to: 'ymroddi@gmail.com',
          from: 'quandria_help@quandria.com',
          subject:`You have a new question for ${item.test.subject} - ${item.test.course.name}` ,
          text: "Answer the question. Login.",
          html: questionEmail,
          };

          sgMail.send(msgSg)
          console.log("sent email")
        })
})
.catch(error => console.log(`received error ${error}`))

// send notifications to expo sd
})
