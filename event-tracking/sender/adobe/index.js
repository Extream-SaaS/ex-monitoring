'use strict';
const Firestore = require('@google-cloud/firestore');
const {PubSub} = require('@google-cloud/pubsub');
const grpc = require('grpc');
const axios = require('axios');
const projectId = process.env.GCLOUD_PROJECT_ID;
const adobeEndpoint = process.env.ADOBE_EVENT_TRACKING_ENDPOINT;
const environment = process.env.ENVIRONMENT || null;
const pubsub = new PubSub({grpc, projectId});

const config = {
    projectId,
};
if (!environment) {
    config.keyFilename = './keyfile.json';
}

const db = new Firestore(config);

exports.sendEventTrackingMessage = async (message) => {
    const decodedMessage = message.data ? Buffer.from(message.data, 'base64').toString() : null;
    console.info('decoded', decodedMessage);
    try {
        const parsed = JSON.parse(decodedMessage);
        const id = parsed.documentId;
        const docRef = db.collection('monitoring-event-tracking').doc(id);
        const doc = await docRef.get();
        if (!doc.exists) {
            const error = new Error('no matching document');
            console.error(error);
            await pushToDeadLetter(decodedMessage);
            return Promise.reject(error);
        }
        const docData = doc.data();
        if (docData.sent) {
            // already been sent
            return Promise.resolve();
        }
        console.log(`sending: ${id}`);
        await sendRequest(parsed.payload);
        console.log(`sent: ${id}`);
        docData.sent = Firestore.Timestamp.now();
        await docRef.set(docData);
        return Promise.resolve();
    } catch (e) {
        console.error('error', JSON.stringify(e));
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
                await Promise.reject(e);
            }
        }
    }

    async function pushToDeadLetter(data) {
        const dataBuffer = Buffer.from(JSON.stringify(data));
        await pubsub.topic('ex-monitoring-event-tracking-adobe-dead-letter').publish(dataBuffer);
    }
};
