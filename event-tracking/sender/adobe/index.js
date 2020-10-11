'use strict';
const {PubSub} = require('@google-cloud/pubsub');
const grpc = require('grpc');
const axios = require('axios');
const projectId = process.env.GCLOUD_PROJECT_ID;
const adobeEndpoint = process.env.ADOBE_ENDPOINT;
const pubsub = new PubSub({grpc, projectId});

exports.sendEventTrackingMessage = async (message) => {
    try {
        const decodedMessage = message.data ? Buffer.from(message.data, 'base64').toString() : null;
        // const parsed = JSON.parse(decodedMessage);
        console.info('decoded', decodedMessage);
        await pushToDeadLetter(message.data);
        const error = new Error('broken');
        return Promise.reject(error);
    } catch (e) {
        console.error(e);
        return Promise.reject(e);
    }

    function sendRequest() {

    }

    async function pushToDeadLetter(data) {
        await pubsub.topic('ex-monitoring-dead-letter').publish(data);
    }
};
