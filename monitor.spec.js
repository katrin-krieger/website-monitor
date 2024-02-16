import { handler } from './monitor'; // Import the handler function from your Lambda function module
import { AWS, ky, dns } from './dependencies'; // Import the dependencies you need to mock
import { jest } from '@jest/globals';

jest.mock('./dependencies', () => ({
    AWS: {
        S3: jest.fn(() => ({
            getObject: jest.fn((params) => {
                if (params.Key === 'testKey') {
                    return {
                        promise: jest.fn().mockResolvedValue({ Body: 'https://resolved.com\nhttps://unresolved.com' })
                    };
                } else {
                    return {
                        promise: jest.fn().mockRejectedValue(new Error('Invalid key'))
                    };
                }
            })
        }))
    },
    ky: {
        head: jest.fn(() => Promise.resolve())
    },
    dns: {
        resolve: jest.fn((hostname, callback) => {
            if (hostname === 'resolved.com') {
                callback(null, ['127.0.0.1']);
            } else {
                callback(new Error('DNS resolution failed'));
            }
        })
    }
}));

describe('Lambda Function', () => {
    describe('handler', () => {
        it('should return availability status of websites', async () => {
            const event = { bucket: 'testBucket', key: 'testKey' };
            const expectedResult = [
                { url: 'https://resolved.com', status: 'available' },
                { url: 'https://unresolved.com', status: 'unavailable' }
            ];
            const result = await handler(event, null);
            expect(result).toEqual(expectedResult);
        });

        it('should handle errors gracefully', async () => {
            const event = { bucket: 'testBucket', key: 'invalidKey' };
            await expect(handler(event, null)).rejects.toThrowError('Invalid key');
        });
    });
});
