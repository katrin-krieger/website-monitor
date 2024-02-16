const { AWS, ky, dns } = require('./dependencies');

exports.handler = async (event, context) => {
    try {
        const s3 = new AWS.S3();
        const websitesFile = await getFileFromS3(event.bucket, event.key, s3);
        const websites = websitesFile.split('\n').map(url => url.trim()).filter(Boolean);
        const results = await Promise.all(websites.map(url => checkWebsite(url)));
        return results;
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
};

async function getFileFromS3(bucket, key, s3) {
    const params = {
        Bucket: bucket,
        Key: key
    };
    const { Body } = await s3.getObject(params).promise();
    return Body.toString('utf-8');
}

async function checkWebsite(websiteUrl) {
    const hostname = new URL(websiteUrl).hostname;
    try {
        await resolveHostname(hostname);
        await ky.head(websiteUrl);
        return { url: websiteUrl, status: 'available' };
    } catch (error) {
        return { url: websiteUrl, status: 'unavailable' };
    }
}

function resolveHostname(hostname) {
    return new Promise((resolve, reject) => {
        dns.resolve(hostname, (error, addresses) => {
            if (error) {
                reject(error);
            } else {
                resolve(addresses);
            }
        });
    });
}