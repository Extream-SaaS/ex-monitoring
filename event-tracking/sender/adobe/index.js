'use strict';

exports.sendEventTrackingMessage = async (message) => {
    try {
        const decodedMessage = message.data ? Buffer.from(message.data, 'base64').toString() : null;
        // const parsed = JSON.parse(decodedMessage);
        console.info('decoded', decodedMessage);
        return Promise.reject();
    } catch (e) {
        console.error(e);
        return Promise.reject(e);
    }
};
