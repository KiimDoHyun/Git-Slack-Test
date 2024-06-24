const core = require('@actions/core');
const github = require('@actions/github');

function getReviewerInfo() {
  try {
    // PR 정보 가져오기
    // const context = github.context;
    // const pullRequest = context.payload.pull_request;
    // const prNumber = pullRequest.number;
    // const prTitle = pullRequest.title;
    // const prBody = pullRequest.body;
    // const prUrl = pullRequest.url;
    const userInfoFilePath= path.join(__dirname,'.github/json/slackUserInfo.json');
    fs.writeFileSync(userInfoFilePath, JSON.stringify(github));
    // console.log('github: ', JSON.stringify(github))
    // console.log('github.context: ', JSON.stringify(github.context))

    // // 콘솔에 PR 정보 출력
    // console.log(`PR 번호: ${prNumber}`);
    // console.log(`PR 제목: ${prTitle}`);
    // console.log(`PR 내용: ${prBody}`);
    // console.log(`PR URL: ${prUrl}`);
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
  