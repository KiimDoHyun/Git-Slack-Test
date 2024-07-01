const core = require('@actions/core');
const github = require('@actions/github');
require('dotenv').config();

const slackUserInfo = require('../json/slackUserInfo.json');

/*
interface labels {
  color: string;
  default: boolean;
  description: string;
  id: number;
  name: string;
  node_id: string;
  url: string;
}
*/

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
      if(res.ok) {
        console.log(`[슬랙 메세지 전송 성공]`, response);
      }
    })
    .catch((e) => {
      console.log('실패', e);
    });
};

const createMessageBlock = ({ titleText, prUrl, prTitle, labels }) => {
  console.log('########## labels: ', labels);
  const blocks = [];
  const labelBlocks = [{
    type: "text",
    style: {
      bold: true
    },
    text: "라벨"
  },
  {
    type: "text",
    text: ": "
  }];

  const labelsLen = labels.length;

  if(labelsLen === 0) {
    labelBlocks.push({
      type: "text",
      text: "라벨 없음"
    })
  } else {
    labels.forEach((label, index) => {
      labelBlocks.push({
        type: "text",
        text: label.name,
      });

      if(index < labelsLen - 1) {
        labelBlocks.push({
          type: "text",
          text: ','
        });
      }
    })
  }

  blocks.push({
    type: 'section',
    fields: [
      {
        type: 'mrkdwn',
        text: titleText,
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
        type: "rich_text_list",
        style: "bullet",
        elements: [
          {
            type: 'rich_text_section',
            elements: [
              {
                type: "text",
                style: {
                  bold: true
                },
                text: "PR 제목"
              },
              {
                type: "text",
                text: ": "
              },
              {
                type: 'link',
                url: prUrl,
                text: prTitle,
              },
            ],
          },
          {
            type: 'rich_text_section',
            elements: labelBlocks
          },
        ],
      }

    ],
  });

  return blocks;
};

function getReviewerInfo() {
  try {
    const context = github.context;

    let blocks = [];
    let titleText = '';
    let channelId = '';

    if (context.eventName === 'issue_comment') {
      if (context.payload.action === 'created') {
        const commentUser = context.payload.comment.user.login;
        const prOwner = context.payload.issue.user.login;

        if (commentUser === prOwner) return;

        if (!slackUserInfo[prOwner]) {
          console.log(`[댓글 등록 단계 메세지 전송 실패] ${commentUser}의 정보가 없습니다.`);
          return;
        }

        if (!slackUserInfo[commentUser]) {
          console.log(`[댓글 등록 단계 메세지 전송 실패] ${prOwner}의 정보가 없습니다.`);
          return;
        }

        blocks = createMessageBlock({
          titleText: '💬 *새로운 댓글이 등록되었어요!*',
          prUrl: context.payload.comment.html_url,
          prTitle: `#${context.payload.issue.number} ${context.payload.issue.title}`,
          labels: github.context.payload.issue.labels,
        });

        channelId = slackUserInfo[prOwner].directMessageId;
        sendSlackMessage({ blocks, channelId });
      }
    } else if (context.eventName === 'pull_request') {
      if (context.payload.action === 'review_requested') {
        const reviewers = github.context.payload.pull_request.requested_reviewers;

        if (reviewers.length === 0) return;

        blocks = createMessageBlock({
          titleText: '💬 *리뷰어로 할당되었어요!*',
          prUrl: context.payload.pull_request.html_url,
          prTitle: `#${context.payload.pull_request.number} ${context.payload.pull_request.title}`,
          labels: github.context.payload.pull_request.labels,
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
      } else if (context.payload.action === 'closed') {
        const reviewers = github.context.payload.pull_request.requested_reviewers;

        if (reviewers.length === 0) return;

        reviewers.forEach((reviewer) => {
          const reviewerInfo = slackUserInfo[reviewer.login];
          if (!reviewerInfo) {
            console.log(`[리뷰 머지 알림 메세지 전송 실패] ${reviewer.login}의 정보가 없습니다.`);
            return;
          }

          if (context.payload.pull_request.merged) {
            titleText = '📢 *PR이 `Merged` 되었어요!*';
          } else {
            titleText = '📢 *PR이 `Closed` 되었어요!*';
          }

          blocks = createMessageBlock({
            titleText: titleText,
            prUrl: context.payload.pull_request.html_url,
            prTitle: `#${context.payload.pull_request.number} ${context.payload.pull_request.title}`,
            labels: github.context.payload.pull_request.labels,
          });

          const channelId = reviewerInfo.directMessageId;
          sendSlackMessage({ blocks, channelId });
        });
      }
    } else if (context.eventName === 'pull_request_review') {
      if (context.payload.action === 'submitted') {
        if (context.payload.review.state === 'approved') {
          titleText = '📢 *PR이 `Approved` 되었어요!*';
        } else {
          titleText = '💬 *새로운 리뷰가 등록되었어요!*';
        }

        blocks = createMessageBlock({
          titleText: titleText,
          prUrl: context.payload.review.html_url,
          prTitle: `#${context.payload.pull_request.number} ${context.payload.pull_request.title}`,
          labels: github.context.payload.pull_request.labels,
        });

        const reviewr = context.payload.review.user.login;
        const prOwner = context.payload.pull_request.user.login;
        if (reviewr === prOwner) return;

        if (!slackUserInfo[prOwner]) {
          console.log(`[리뷰 등록 단계 메세지 전송 실패] ${prOwner}의 정보가 없습니다.`);
          return;
        }

        channelId = slackUserInfo[prOwner].directMessageId;
        sendSlackMessage({ blocks, channelId });
      }
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

getReviewerInfo();
