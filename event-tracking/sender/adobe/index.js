'use strict';

exports.sendEventTrackingMessage = async (message) => {
    try {
        const decodedMessage = message.data ? Buffer.from(message.data, 'base64').toString() : null;
        // const parsed = JSON.parse(decodedMessage);
        console.info('decoded', decodedMessage);
        const error = new Error('broken');
        return Promise.reject(error);
    } catch (e) {
        console.error(e);
        return Promise.reject(e);
    }
};
