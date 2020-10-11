'use strict';
const {PubSub} = require('@google-cloud/pubsub');
const grpc = require('grpc');
const axios = require('axios');
const projectId = process.env.GCLOUD_PROJECT_ID;
const adobeEndpoint = process.env.ADOBE_EVENT_TRACKING_ENDPOINT;
const pubsub = new PubSub({grpc, projectId});

exports.sendEventTrackingMessage = async (message) => {
    const decodedMessage = message.data ? Buffer.from(message.data, 'base64').toString() : null;
    console.info('decoded', decodedMessage);
    try {
        await sendRequest(decodedMessage);
        return Promise.resolve();
    } catch (e) {
        console.error(e);
        await pushToDeadLetter(decodedMessage);
        return Promise.reject(e);
    }

    async function sendRequest(data, attempt = 1) {
        console.log(`attempt ${attempt}`);
        const config = {
            url: adobeEndpoint,
            method: 'POST',
            data: data,
        };
        try {
            await axios(config);
        } catch (e) {
            if (attempt < 3) {
                await sendRequest(data, ++attempt);
            } else {
                console.log('rejecting', e);
                await Promise.reject(e);
            }
        }
    }

    async function pushToDeadLetter(data) {
        const dataBuffer = Buffer.from(JSON.stringify(data));
        await pubsub.topic('ex-monitoring-event-tracking-adobe-dead-letter').publish(dataBuffer);
    }
};
