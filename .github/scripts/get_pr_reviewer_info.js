const core = require('@actions/core');
const github = require('@actions/github');
require('dotenv').config();

const slackUserInfo = require('../json/slackUserInfo.json');

function getReviewerInfo() {
  try {
    // PR 정보 가져오기
    const context = github.context;
    // const pullRequest = context.payload.pull_request;
    // const prNumber = pullRequest.number;
    // const prTitle = pullRequest.title;
    // const prBody = pullRequest.body;
    // const prUrl = pullRequest.url;

    // const reviewers = github.context.payload.pull_request.requested_reviewers || [];
    
    const accessToken = process.env.SLACK_API_TOKEN; // Bearer 토큰
    // const myChannel = process.env.GIT_DOH_CHANNELID;
    // console.log('########## accessToken: ', accessToken);
    // console.log('########## myChannel: ', myChannel);

    // console.log('########## context.payload.action: ', context.payload.action);
    // console.log('########## context.eventName: ', context.eventName);
    // console.log('########## context.payload: ', context.payload);

    // pr 요청이 발생한 경우에만 값이 들어있음
    // console.log('########## context.payload.pull_request : ', context.payload['pull_request']);
    // console.log('########## context.payload.sender: ', context.payload['sender']);
    // console.log('########## context.payload: ', context.payload);
    // console.log('########## context.issue: ', context['issue']);
    // console.log(`########## context: [${context.eventName}]`, context[context.eventName]);
    // console.log('########## context: ', context);

    console.log('########## context.issue.assignee: ', context.issue.assignee);
    console.log('########## context.issue.assignees: ', context.issue.assignees);
    console.log('########## context.issue.labels: ', context.issue.labels);
    console.log('########## context.issue.pull_request: ', context.issue.pull_request);
    console.log('########## context.issue.reactions: ', context.issue.reactions);
    console.log('########## context.issue.user: ', context.issue.user);
    
    

    const messageId = slackUserInfo['KiimDoHyun'];
    fetch(`https://slack.com/api/chat.postMessage`, {
      method: "POST",
          headers: {
              'Content-Type': 'application/json; charset=utf-8',
              Authorization: `Bearer ${accessToken}` // 헤더에 Bearer 토큰 추가
            },
            body: JSON.stringify({
              channel: messageId,
              text: 
                `트리거된 액션 정보\n` +
                `${context.eventName}\n` +
                `${context.payload.action}\n`  +
                `--------------------------------------\n`
                `보낸사람 (발생시킨 사람)`
                `${context.payload.sender.login}`
                `--------------------------------------\n`
                `PR 제목`
                `${context.issue.title}`
                `PR 주인`
                `${context.issue.}`
                `PR 라벨`
                `${context.payload.sender.login}`
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
  


  