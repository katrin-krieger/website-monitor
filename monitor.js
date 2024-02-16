import AWS from 'aws-sdk';
import ky from 'ky';
import dns from 'dns';
import { IncomingWebhook } from '@slack/webhook';

const s3 = new AWS.S3();
const bucketName = 'trc-websites-bucket'; // Replace with your bucket name
const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL; // Retrieve Slack webhook URL from environment variable

export async function handler(event, context) {
    try {
        // Retrieve list of websites from S3
        const data = await getFileFromS3(bucketName, 'websites.txt');

        // Split data by newline and remove empty lines
        const websites = data.Body.toString().split('\n').filter(Boolean);

        // Check availability and DNS resolution for each website
        const results = await Promise.all(websites.map(async (website) => {
            const availability = await checkWebsiteAvailability(website);
            const dnsResolution = await checkDNSResolution(website);
            if (!availability || !dnsResolution) {
                // Send Slack notification for unavailable website
                sendSlackNotification(website);
            }
            return { url: website, status: availability && dnsResolution ? 'available' : 'unavailable' };
        }));

        return results;
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

async function getFileFromS3(bucket, key) {
    const params = {
        Bucket: bucket,
        Key: key
    };
    return await s3.getObject(params).promise();
}

async function checkWebsiteAvailability(website) {
    try {
        await ky.head(website);
        return true;
    } catch (error) {
        return false;
    }
}

async function checkDNSResolution(hostname) {
    return new Promise((resolve) => {
        dns.resolve(hostname, (err) => {
            resolve(!err);
        });
    });
}

function sendSlackNotification(website) {
    const webhook = new IncomingWebhook(slackWebhookUrl);
    const message = {
        text: `:warning: Website ${website} is not available!`
    };
    webhook.send(message);
}

await handler({ }, null);