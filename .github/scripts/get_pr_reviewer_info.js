const core = require('@actions/core');
const github = require('@actions/github');
require('dotenv').config();

const slackUserInfo = require('../json/slackUserInfo.json');

const ERROR_MSG = '내용을 확인할 수 없습니다.';

const getAssigneesIds = (assignees) => {
  const assigneeIds = assignees
    .filter((assignee) => {
      if (slackUserInfo[assignee.login]) return true;

      console.log(`[리뷰어 정보 찾기 실패] ${assignee.login}의 정보가 없습니다.`);
      return false;
    })
    .map((assignee) => slackUserInfo[assignee.login].userId);

    return assigneeIds;
}

const sendSlackMessage = ({ blocks, channelId, text = '' }) => {
  const accessToken = process.env.SLACK_API_TOKEN; // Bearer 토큰
  fetch(`https://slack.com/api/chat.postMessage`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      Authorization: `Bearer ${accessToken}`, // 헤더에 Bearer 토큰 추가
    },
    body: JSON.stringify({
      channel: channelId,
      blocks: blocks,
      text: text,
    }),
  })
    .then(async (res) => {
      const response = await res.json();
      console.log('res', response);
    })
    .catch((e) => {
      console.log('실패', e);
    });
};

function getReviewerInfo() {
  try {
    const context = github.context;

    const blocks = [];
    let channelId = '';
    let userId = '';

    if (context.eventName === 'issue_comment') {
      if (context.payload.action === 'created') {
        const commentUser = context.payload.comment.user.login;
        const prOwner = context.payload.issue.user.login;

        if(commentUser === prOwner) return;

        if(!slackUserInfo[prOwner]) {
          console.log(`[댓글 등록 단계 메세지 전송 실패] ${commentUser}의 정보가 없습니다.`);
          return;
        }

        if(!slackUserInfo[commentUser]) {
          console.log(`[댓글 등록 단계 메세지 전송 실패] ${prOwner}의 정보가 없습니다.`);
          return;
        }

        userId = slackUserInfo[commentUser].userId;
        channelId = slackUserInfo[prOwner].directMessageId;

        blocks.push({
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: '💬 *새로운 댓글이 등록되었어요!*',
            },
          ],
        });
        blocks.push({
          type: 'divider',
        });
        blocks.push({
          type: 'rich_text',
          elements: [
            {
              type: 'rich_text_section',
              elements: [
                {
                  type: 'link',
                  url: `${context.payload.comment.html_url}`,
                  text: `#${context.payload.issue.number} ${context.payload.issue.title}`,
                },
              ],
            },
            {
              type: 'rich_text_section',
              elements: [
                {
                  type: 'text',
                  text: '\n',
                },
                {
                  type: 'user',
                  user_id: userId,
                },
                {
                  type: 'text',
                  text: ' 🗣️ ',
                },
              ],
            },
            {
              type: 'rich_text_preformatted',
              elements: [
                {
                  type: 'text',
                  text: `${context.payload.comment.body || ERROR_MSG}`,
                },
              ],
            },
          ],
        });

        sendSlackMessage({ blocks, channelId });
      }
      // 리뷰어 할당
    } else if (context.eventName === 'pull_request') {
      if (context.payload.action === 'review_requested') {
        const reviewers = github.context.payload.pull_request.requested_reviewers;

        if (reviewers.length === 0) return;

        const assignees = github.context.payload.pull_request.assignees;
        const assigneeIds = getAssigneesIds(assignees)

        const bodyElements = [
          {
            type: 'text',
            style: {
              bold: true,
            },
            text: '담당자',
          },
          {
            type: 'text',
            text: ': ',
          },
        ];
        const assigneeIdsLastIdx = assigneeIds.length - 1;
        assigneeIds.forEach((assigneeId, index) => {
          bodyElements.push({
            type: 'user',
            user_id: assigneeId,
          });

          if (index !== assigneeIdsLastIdx) {
            bodyElements.push({
              type: 'text',
              text: ',',
            });
          }
        });

        blocks.push({
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: '💬 *리뷰어로 할당되었어요!*',
            },
          ],
        });
        blocks.push({
          type: 'divider',
        });
        blocks.push({
          type: 'rich_text',
          elements: [
            {
              type: 'rich_text_section',
              elements: [
                {
                  type: 'link',
                  url: `${context.payload.pull_request.html_url}`,
                  text: `#${context.payload.pull_request.number} ${context.payload.pull_request.title}`,
                },
              ],
            },
            {
              type: 'rich_text_section',
              elements: bodyElements,
            },
          ],
        });
        reviewers.forEach((reviewer) => {
          const reviewerInfo = slackUserInfo[reviewer.login];
          if (!reviewerInfo) {
            console.log(`[리뷰어 할당 단계 메세지 전송 실패] ${reviewer.login}의 정보가 없습니다.`);
            return;
          }

          const channelId = reviewerInfo.directMessageId;
          sendSlackMessage({ blocks, channelId });
        });
      } else if(context.payload.action === 'closed') {
        const reviewers = github.context.payload.pull_request.requested_reviewers;

        if (reviewers.length === 0) return;


        let text = '';
        reviewers.forEach((reviewer) => {
          const reviewerInfo = slackUserInfo[reviewer.login];
          if (!reviewerInfo) {
            console.log(`[리뷰 머지 알림 메세지 전송 실패] ${reviewer.login}의 정보가 없습니다.`);
            return;
          }

          
          if(context.payload.pull_request.merged) {
            text = '📢 *PR이 Merged 되었어요!*';
          } else {
            text = '📢 *PR이 Closed 되었어요!*';
          }
          blocks.push({
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: text,
              },
            ],
          });

          blocks.push({
            type: 'divider',
          });
          blocks.push({
            type: 'rich_text',
            elements: [
              {
                type: 'rich_text_section',
                elements: [
                  {
                    type: 'link',
                    url: `${context.payload.pull_request.html_url}`,
                    text: `#${context.payload.pull_request.number} ${context.payload.pull_request.title}`,
                  },
                ],
              },
            ],
          });
          const channelId = reviewerInfo.directMessageId;
          sendSlackMessage({ blocks, channelId });
        });
      }
    } 
    else if (context.eventName === 'pull_request_review') {
      if (context.payload.action === 'submitted') {
        body = context.payload.review.body;
        let text = '';

        if (context.payload.review.state === 'approved') {
          text = '📢 *PR이 Approved 되었어요!*'
        } else {
          text= '💬 *새로운 리뷰가 등록되었어요!*';
        }

        // todo: body 가 null 로 잡히는 중
        // todo: assignees 로 변경
        const reviewr = context.payload.review.user.login;
        const prOwner = context.payload.pull_request.user.login;
        if (reviewr === prOwner) return;

        if(!slackUserInfo[prOwner]) {
          console.log(`[리뷰 등록 단계 메세지 전송 실패] ${prOwner}의 정보가 없습니다.`);
          return;
        }

        if(!slackUserInfo[reviewr]) {
          console.log(`[리뷰 등록 단계 메세지 전송 실패] ${reviewr}의 정보가 없습니다.`);
          return;
        }

        channelId = slackUserInfo[prOwner].directMessageId;
        userId = slackUserInfo[reviewr].userId;

        blocks.push({
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: text,
            },
          ],
        });
        blocks.push({
          type: 'divider',
        });
        blocks.push({
          type: 'rich_text',
          elements: [
            {
              type: 'rich_text_section',
              elements: [
                {
                  type: 'link',
                  url: `${context.payload.review.html_url}`,
                  text: `#${context.payload.pull_request.number} ${context.payload.pull_request.title}`,
                },
              ],
            },
            {
              type: 'rich_text_section',
              elements: [
                {
                  type: 'text',
                  text: '\n',
                },
                {
                  type: 'user',
                  user_id: `${userId}`,
                },
                {
                  type: 'text',
                  text: ' 🗣️ ',
                },
              ],
            },
            {
              type: 'rich_text_preformatted',
              elements: [
                {
                  type: 'text',
                  text: `${context.payload.review.body || ERROR_MSG}`,
                },
              ],
            },
          ],
        });
        
        sendSlackMessage({ blocks, channelId });
      }
    }
  } catch (error) {
    core.setFailed(error.message);
  }

  return;
}

getReviewerInfo();
