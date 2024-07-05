const fs = require('fs/promises');

require('dotenv').config();

const FRONT_CHANNEL_ID = process.env.FRONT_CHANNEL_ID || 'C071M97SR42';
const SLACK_TOKEN = process.env.SLACK_API_TOKEN;

// 실제 이름 : 깃허브 아이디 순서
const nameByGithubId = {
  양아름: "areumsheep",
  김도현: "KiimDoHyun",
  김나현: "nhkimmm",
  김동용: "kingyong9169",
  원성철: "scwon",
  노태경: "TaeGyeongNoh",
  허진권: "HeoJinkwon",
  최준영: "front-joonyoung-choi",
  조이성: "ISungCho",
  박규태: "gtparkk",
  고지훈: "ko-ji-hoon",
  유동균: "hackurity01",
  박채연: "chaeyeonwt",
};

// 깃허브 아이디로 유저 정보를 저장할 객체
const userInfoByGithubId = {};

// 슬랙 API 호출을 위한 기본 설정
const fetchSlackApi = async (endpoint, options = {}) => {
  const baseUrl = "https://slack.com/api/";
  const defaultHeaders = {
    Authorization: `Bearer ${SLACK_TOKEN}`,
    "Content-Type": "application/json; charset=utf-8",
  };

  const response = await fetch(baseUrl + endpoint, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  const data = await response.json();
  if (!response.ok || !data.ok) {
    throw new Error(
      `Error fetching ${endpoint}: ${data.error || response.statusText}`
    );
  }

  return data;
};

// 모든 사용자 목록을 가져오는 함수
const getAllMembers = async () => {
  try {
    const data = await fetchSlackApi(
      `conversations.members?channel=${FRONT_CHANNEL_ID}`,
      {
        method: "POST",
        body: JSON.stringify({
          channel: FRONT_CHANNEL_ID,
        }),
      }
    );
    return data.members;
  } catch (error) {
    console.error("Error fetching members:", error);
  }
};

// 사용자 정보를 가져오는 함수
const getUserInfo = async (userId) => {
  try {
    const data = await fetchSlackApi(`users.info?user=${userId}`, {
      method: "POST",
      body: JSON.stringify({
        user: userId,
      }),
    });
    return data.user;
  } catch (error) {
    console.error("Error fetching user info:", error);
  }
};

// DM 채널을 여는 함수
const openDirectMessage = async (userId) => {
  try {
    const data = await fetchSlackApi(`conversations.open?users=${userId}`, {
      method: "POST",
      body: JSON.stringify({
        users: userId,
      }),
    });
    return data.channel.id;
  } catch (error) {
    console.error("Error opening direct message:", error);
  }
};

// JSON 파일로 저장하는 함수
const saveUserInfoToFile = async (data, filePath) => {
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    console.log('User info saved to file successfully.');
  } catch (error) {
    console.error('Error saving user info to file:', error);
  }
};

// 주어진 깃허브 아이디와 일치하는 슬랙 사용자 정보 및 DM ID를 찾는 함수
const findSlackUserInfo = async () => {
  const members = await getAllMembers();

  for (const member of members) {
    const user = await getUserInfo(member);

    const realName =
      user.real_name || user.profile.real_name || user.profile.display_name;
    console.log(realName);

    for (const [name, githubId] of Object.entries(nameByGithubId)) {
      if (realName === name) {
        const dmId = await openDirectMessage(user.id);
        console.log(dmId);
        userInfoByGithubId[githubId] = {
          userId: user.id,
          directMessageId: dmId,
        };
      }
    }
  }
  
  console.log(userInfoByGithubId);
  
  // JSON 파일로 저장
  await saveUserInfoToFile(userInfoByGithubId, '../json/slackUserInfo.json');
};

// 함수 실행
findSlackUserInfo();