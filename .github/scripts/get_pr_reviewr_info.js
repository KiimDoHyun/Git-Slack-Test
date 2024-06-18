const core = require('@actions/core');
const github = require('@actions/github');

async function getReviewerInfo() {
    const context = github.context;
    console.log('########## github: ', github);
    const pullRequestNumber = context.payload.pull_request.number;
    const owner = context.repo.owner;
    const repo = context.repo.repo;
  
    const url = `https://api.github.com/repos/${owner}/${repo}/pulls/${pullRequestNumber}/reviewers`;
    const headers = {
      Authorization: `token ${process.env.GITHUB_TOKEN}`,
    };
  
    try {
      const response = await fetch(url, { headers });
      const reviewers = await response.json();
  
      const reviewerNames = [];
      const reviewerLogins = [];
  
      for (const reviewer of reviewers) {
        reviewerNames.push(reviewer.login);
        reviewerLogins.push(reviewer.login);
      }
  
      core.setOutput('reviewerNames', reviewerNames.join(', '));
      core.setOutput('reviewerLogin', reviewerLogins.join(', '));
    } catch (error) {
      core.setFailed(error.message);
    }
  }
  
  getReviewerInfo();