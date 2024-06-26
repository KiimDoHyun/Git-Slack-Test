const core = require('@actions/core');
const github = require('@actions/github');
require('dotenv').config();

const slackUserInfo = require('../json/slackUserInfo.json');

function getReviewerInfo() {
  try {
    // PR 정보 가져오기
    const context = github.context;
    const accessToken = process.env.SLACK_API_TOKEN; // Bearer 토큰

    // 수정 이벤트를 굳이 감지 해야 하나
    let prTitle = '';
    let type = '';
    let body = '';
    let link = '';
    let message = '';
    let blocks = [];
    // let 
    if(context.eventName === 'issue_comment') {
      type = '댓글'
      if(context.payload.action === 'created') {
        type += '추가'
      } 
      // else if (context.payload.action === 'edited') {
      //   type += '수정'
      // } 

      const commentUser = context.payload.comment.user.login;
      message = `${commentUser}님이 댓글을 남겼습니다 확인해보세요!`;
      prTitle = context.payload.issue.title;
      body = context.payload.comment.body;
      link = context.payload.comment.html_url

      blocks.push({
        "type": "context",
        "elements": [
          {
            "type": "image",
            "image_url": `${context.payload.comment.user.avatar_url}`,
            "alt_text": `${commentUser}`
          },
          {
            "type": "mrkdwn",
            "text": `*${commentUser}* 님이 댓글을 남겼습니다!`
          }
        ]
      },);
      blocks.push(
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": `<${link}|확인하러가기>`
          }
        }
      )

      /*
      댓글을 남긴 사람의 정보
      context.payload.comment.user

      메세지 전송 대상
      context.payload.issue.user.login
      */

      // context.payload.issue 에서 pr 정보 추출
    } else if (context.eventName === 'pull_request'){
      type = '리뷰어'
      if(context.payload.action === 'review_requested') {
        type += '할당'
      } 



      /*
      리뷰어로 등록된 사람
      context.payload.comment.user

      메세지 전송 대상(리뷰어로 등록된 사람과 동일함)
      context.payload.comment.user.login

      github.context.payload.pull_request.requested_reviewers
      에 배열로 정보가 들어있음
      login 값에 접근해서 각 사용자에게 알림으로 날린다.
      */


      console.log('context.payload.pull_request', context.payload.pull_request);
      // blocks.push({
      //   "type": "context",
      //   "elements": [
      //     {
      //       "type": "image",
      //       "image_url": `${context.payload.comment.user.avatar_url}`,
      //       "alt_text": `${commentUser}`
      //     },
      //     {
      //       "type": "mrkdwn",
      //       "text": `리뷰어로 할당되었습니다!`
      //     }
      //   ]
      // },);
      // blocks.push(
      //   {
      //     "type": "section",
      //     "text": {
      //       "type": "mrkdwn",
      //       "text": `<${link}|확인하러가기>`
      //     }
      //   }
      // )
      

      message = `PR 리뷰어로 할당되었습니다 확인해보세요!`
      /*
      labels
      [
        {
          color: 'a2eeef',
          default: true,
          description: 'New feature or request',
          id: 7094586470,
          name: 'enhancement',
          node_id: 'LA_kwDOMKvoBs8AAAABpt7MZg',
          url: 'https://api.github.com/repos/KiimDoHyun/Git-Slack-Test/labels/enhancement'
        }
      ]
      */
      console.log('########## context.payload.pull_request.labels: ', context.payload.pull_request.labels);
      // context.payload.pull_request 에서 pr 정보 추출
      prTitle = context.payload.pull_request.title;
      link = context.payload.pull_request.html_url
    } else if (context.eventName === 'pull_request_review'){
      console.log('context.payload.review.user', context.payload.review.user)
      type = '코드리뷰'
      if(context.payload.action === 'submitted') {
        type += '추가'
        body = context.payload.review.body
      } 

      const commentUser = context.payload.review.user.login;
      message = `${commentUser}님이 코드리뷰를 남겼습니다 확인해보세요!`;
      
      // else if (context.payload.action === 'created') {
      //   type += '수정'
      //   body = context.payload.review.body
      // } 
      // context.payload.pull_request 에서 pr 정보 추출
      prTitle = context.payload.pull_request.title;
    }

    console.log('########## context: ', context);
    // console.log('########## context.payload.issue: ', context.payload['issue']);
    // console.log('########## context.payload.pull_request: ', context.payload['pull_request']);

    const messageId = slackUserInfo['KiimDoHyun'];
    fetch(`https://slack.com/api/chat.postMessage`, {
      method: "POST",
          headers: {
              'Content-Type': 'application/json; charset=utf-8',
              Authorization: `Bearer ${accessToken}` // 헤더에 Bearer 토큰 추가
            },
            body: JSON.stringify({
              channel: messageId,
              blocks: blocks,
              text: '',
              "unfurl_links": true
              // text: 
              //   `트리거된 액션 정보\n` +
              //   `${type}\n` +
              //   `${context.eventName}\n` +
              //   `${context.payload.action}\n`  +
              //   `--------------------------------------\n` +
              //   `보낸사람 (발생시킨 사람)\n` +
              //   `${context.actor}\n` +
              //   `--------------------------------------\n` +
              //   `PR 제목\n` +
              //   `${prTitle}\n` +
              //   `--------------------------------------\n` +
              //   `PR 알림 내용??\n` +
              //   `${message}\n`
              //   `${body}\n` +
              //   `--------------------------------------\n` + 
              //   `링크\n` +
              //   `${link}\n`
                // `PR 주인` +
                // `${context.issue.}`
                // `PR 라벨` +
                // `${context.payload.sender.login}`
                // `--------------------------------------\n` +
                // `이슈 주소\n` +
                // 항상 존재하는건 아님
                // `${context.payload.issue.html_url}`
            })
    }).then(async(res) => {
      const response = await res.json()
      console.log('res', response)}).catch((e) => {
      console.log('실패', e)
    })

    // reviewers.forEach((reviewer) => {
    //   const messageId = slackUserInfo['KiimDoHyun'];
    //   // const messageId = slackUserInfo[reviewer.login || 'areumsheep'];

    //   console.log('#### messageId: ', messageId);
    //   fetch(`https://slack.com/api/chat.postMessage`, {
    //     method: "POST",
    //         headers: {
    //             'Content-Type': 'application/json; charset=utf-8',
    //             Authorization: `Bearer ${accessToken}` // 헤더에 Bearer 토큰 추가
    //           },
    //           body: JSON.stringify({
    //             channel: messageId,
    //             text: `트리거된 액션 정보:${context.payload.action}`
    //           })
    //   }).then(async(res) => {
    //     const response = await res.json()
    //     console.log('res', response)}).catch((e) => {
    //     console.log('실패', e)
    //   })
    // })

    // pr 리뷰어로 선정되었을 때 메세지 전달
    // D078A6G7405 -> 내꺼 개인 채널 아이디임
    // [Notice] 리뷰어로 등록되었습니다.
    // - 제목:
    // - 내용: 
    // - 작성자: 
    // - 라벨:
    // - pr 주소: 




    // 무조건 배열로 들어있음
    // github.context.payload.pull_request.requested_reviewers;

    // 반복문으로 날려야 한다.
    // 실패가 있으면 에러 메세지를 나한테 
    /*
    const reviweres = getReviewers();

    for
    */
    
    // console.log('github: ', JSON.stringify(github))
    // console.log('########## pullRequest: ', JSON.stringify(pullRequest));
    // // console.log('github.context: ', JSON.stringify(github.context))

    // console.log('트리거된 액션 종류 1', context.payload.action);
    // console.log('트리거된 액션 종류 2', context.payload.action);
    // // // 콘솔에 PR 정보 출력
    // console.log(`PR 번호: ${prNumber}`);
    // console.log(`PR 제목: ${prTitle}`);
    // console.log(`PR 내용: ${prBody}`);
    // console.log(`PR URL: ${prUrl}`);
    // console.log('리뷰어 정보', JSON.stringify(github.context.payload.pull_request.requested_reviewers));
  } catch (error) {
    core.setFailed(error.message);
  }

  return;
    // const context = github.context;
    // console.log('########## github: ', github);
    // console.log('########## context: ', context);
    // const pullRequestNumber = context.payload.pull_request.number;
    // const owner = context.repo.owner;
    // const repo = context.repo.repo;
  
    // const url = `https://api.github.com/repos/${owner}/${repo}/pulls/${pullRequestNumber}/reviewers`;
    // const headers = {
    //   Authorization: `token ${process.env.GITHUB_TOKEN}`,
    // };
  
    // try {
    //   const response = await fetch(url, { headers });
    //   const reviewers = await response.json();
  
    //   const reviewerNames = [];
    //   const reviewerLogins = [];
  
    //   for (const reviewer of reviewers) {
    //     reviewerNames.push(reviewer.login);
    //     reviewerLogins.push(reviewer.login);
    //   }
  
    //   core.setOutput('reviewerNames', reviewerNames.join(', '));
    //   core.setOutput('reviewerLogin', reviewerLogins.join(', '));
    // } catch (error) {
    //   core.setFailed(error.message);
    // }
  }
  
  getReviewerInfo();
  