const core = require('@actions/core');
const github = require('@actions/github');
require('dotenv').config();

const slackUserInfo = require('../json/slackUserInfo.json');

const sendSlackMessage = ({ blocks, channelId, text = '' }) => {
  const accessToken = process.env.SLACK_API_TOKEN; // Bearer 토큰
  fetch(`https://slack.com/api/chat.postMessage`, {
    method: "POST",
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            Authorization: `Bearer ${accessToken}` // 헤더에 Bearer 토큰 추가
          },
          body: JSON.stringify({
            channel: channelId,
            blocks: blocks,
            text: text,
          })
  }).then(async(res) => {
    const response = await res.json()
    console.log('res', response)}).catch((e) => {
    console.log('실패', e)
  })
};



function getReviewerInfo() {
  try {
    const context = github.context;

    let prTitle = '';
    let type = '';
    let body = '';
    let link = '';
    let message = '';
    let blocks = [];
    let channelId = '';

    if(context.eventName === 'issue_comment') {
      if(context.payload.action === 'created') {

        // const commentUser = context.payload.comment.user.login;
        // message = `${commentUser}님이 댓글을 남겼습니다 확인해보세요!`;
        // prTitle = context.payload.issue.title;
        // body = context.payload.comment.body;
        // link = context.payload.comment.html_url

        /*
        댓글을 남긴 사람의 정보
        context.payload.comment.user

        메세지 전송 대상
        context.payload.issue.user.login
        */
          blocks.push({
            "type": "section",
            "fields": [
              {
                "type": "mrkdwn",
                "text": "💬 *새로운 댓글이 등록되었어요!*" + `${context.payload.comment.user.login}님이 남김`
              }
            ]
          })
          // blocks.push({
          //   "type": "divider"
          // })
          // blocks.push({
          //   "type": "rich_text",
          //   "elements": [
          //     {
          //       "type": "rich_text_list",
          //       "style": "bullet",
          //       "elements": [
          //         {
          //           "type": "rich_text_section",
          //           "elements": [
          //             {
          //               "type": "link",
          //               "url": context.payload.comment.html_url,
          //               "text": `${context.payload.issue.title}`
          //             }
          //           ]
          //         },
          //         {
          //           "type": "rich_text_section",
          //           "elements": [
          //             {
          //               "type": "text",
          //               "style": {
          //                 "bold": true
          //               },
          //               "text": "담당자"
          //             },
          //             {
          //               "type": "text",
          //               "text": ": "
          //             },
          //             {
          //               "type": "user",
          //               "user_id": "U077JS1FCNS"
          //             }
          //           ]
          //         },
          //         {
          //           "type": "rich_text_section",
          //           "elements": [
          //             {
          //               "type": "text",
          //               "style": {
          //                 "bold": true
          //               },
          //               "text": "리뷰어"
          //             },
          //             {
          //               "type": "text",
          //               "text": ": "
          //             },
          //             {
          //               "type": "user",
          //               "user_id": "U077JS1FCNS"
          //             },
          //             {
          //               "type": "text",
          //               "text": ", "
          //             },
          //             {
          //               "type": "user",
          //               "user_id": "U0791SUM0N4"
          //             },
          //             {
          //               "type": "text",
          //               "text": ", "
          //             },
          //             {
          //               "type": "user",
          //               "user_id": "U078KT65J1H"
          //             }
          //           ]
          //         }
          //       ]
          //     }]});

            // 메세지를 보낼 대상 = pr 주인

            channelId = slackUserInfo[context.payload.issue.user.login].directMessageId;
            sendSlackMessage({blocks, channelId})
      } 
      // context.payload.issue 에서 pr 정보 추출
    } else if (context.eventName === 'pull_request'){
      if(context.payload.action === 'review_requested') {

        /*
      리뷰어로 등록된 사람
      context.payload.comment.user

      메세지 전송 대상(리뷰어로 등록된 사람과 동일함)
      context.payload.comment.user.login

      github.context.payload.pull_request.requested_reviewers
      에 배열로 정보가 들어있음
      login 값에 접근해서 각 사용자에게 알림으로 날린다.
      */

      blocks.push(		{
        "type": "section",
        "fields": [
          {
            "type": "mrkdwn",
            "text": "💬 *리뷰어로 할당되었어요!*"
          }
        ]
      })
    } 

      const reviewers = github.context.payload.pull_request.requested_reviewers;
      reviewers.forEach((reviewer) => {
        console.log('########## reviewer: ', reviewer);
        const channelId = slackUserInfo[reviewer.login].directMessageId;

        sendSlackMessage({blocks, channelId})
      })

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

        console.log('########## context.payload.pull_request.user: ', context.payload.pull_request.user);
        
        channelId = slackUserInfo[context.payload.pull_request.user.login].directMessageId;
        blocks.push({
          "type": "section",
          "fields": [
            {
              "type": "mrkdwn",
              "text": "💬 *새로운 리뷰가 등록되었어요!*" + `${context.payload.review.user.login} 님이 남김`
            }
          ]
        })

        sendSlackMessage({blocks, channelId});
      } 


      // const commentUser = context.payload.review.user.login;
      // message = `${commentUser}님이 코드리뷰를 남겼습니다 확인해보세요!`;
      
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
  

  /*
  [
		{
			"type": "section",
			"fields": [
				{
					"type": "mrkdwn",
					"text": "💬 *리뷰어로 할당되었어요!*"
				}
			]
		},
		{
			"type": "divider"
		},
		{
			"type": "rich_text",
			"elements": [
				{
					"type": "rich_text_list",
					"style": "bullet",
					"elements": [
						{
							"type": "rich_text_section",
							"elements": [
								{
									"type": "link",
									"url": "https://github.com/whatap/whatap-front/pull/1920",
									"text": "#1920 feat: 조직 리스트에 아이콘 추가"
								}
							]
						},
						{
							"type": "rich_text_section",
							"elements": [
								{
									"type": "text",
									"style": {
										"bold": true
									},
									"text": "담당자"
								},
								{
									"type": "text",
									"text": ": "
								},
								{
									"type": "user",
									"user_id": "U077JS1FCNS"
								}
							]
						},
						{
							"type": "rich_text_section",
							"elements": [
								{
									"type": "text",
									"style": {
										"bold": true
									},
									"text": "리뷰어"
								},
								{
									"type": "text",
									"text": ": "
								},
								{
									"type": "user",
									"user_id": "U077JS1FCNS"
								},
								{
									"type": "text",
									"text": ", "
								},
								{
									"type": "user",
									"user_id": "U0791SUM0N4"
								},
								{
									"type": "text",
									"text": ", "
								},
								{
									"type": "user",
									"user_id": "U078KT65J1H"
								}
							]
						}
					]
				}
			]
		}
	]
  */