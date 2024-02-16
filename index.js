import ky from "ky";
import SlackNotify from "slack-notify";
import websites from "./websites.json" assert { type: "json" };
import 'dotenv/config'


const webhookUrl = process.env.SLACK_WEBHOOK_URL;
const slack = SlackNotify(webhookUrl);

for (const website of websites) {
  let message = "";
  try {
    const res = await ky(website);
    if (!res.ok) {
      message = `🚫 Website ${website} is not available:\n\n ${error.message}!`;
    }
  } catch (error) {
    message = `🚫 Website ${website} is not available:\n\n ${error.message}!`;

    const msg = slack.send({
      webhookUrl,
      text: message,
    });
  }
}
