const fs = require('fs');
const path = require('path');

const getSlackChannelUserList =  async () => {
    const channelID = process.env.SLACK_TEST_CHANNEL_ID // 채널 ID
    const accessToken = process.env.SLACK_API_TOKEN; // Bearer 토큰

    const data = {
        token: accessToken,
        channel: channelID
      };
    try {
        const res = await fetch(`https://slack.com/api/conversations.members?channel=${channelID}&pretty=1`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Authorization': `Bearer ${accessToken}` // 헤더에 Bearer 토큰 추가
              },
              body: JSON.stringify(data)
        });
        const jsonRes = await res.json();

        if(jsonRes.ok) {
            return jsonRes.members
        } else {
            return null;
        }
    } catch (e) {
        console.log('########## [지라 사용자 목록 조회 에러]: ', e);
        return null;
    }
}

const getSlackUserInfoJson = async () => {
    const userInfoFilePath= path.join(__dirname,'../json/slackUserInfo.json');
    let result = null;
    try {
        const userInfo = JSON.parse(fs.readFileSync(userInfoFilePath));
        result = userInfo;
      } catch (error) {
        result = await getSlackChannelUserList();
      }

      return result;
}

const main = async (reviewers, prTitle, prUrl) => {
    console.log('########## reviewers: ', reviewers);
    console.log('########## prTitle: ', prTitle);
    console.log('########## prUrl: ', prUrl);

    const userInfoFilePath= path.join(__dirname,'../json/slackUserInfo.json');
    fs.writeFileSync(userInfoFilePath, JSON.stringify({
        reviewers,
        prTitle,
        prUrl
    }));

    return;
    const slackUserInfoJson = await getSlackUserInfoJson();
    console.log('########## slackUserInfoJson: ', slackUserInfoJson);

    if(slackUserInfoJson) {
        // findTargetSlackId();
    } else {
        // getSlackUserList();
    }
};

const reviewers = process.argv[2].split(',');
const prTitle = process.argv[3];
const prUrl = process.argv[4];

main(reviewers, prTitle, prUrl);