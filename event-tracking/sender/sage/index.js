'use strict';
const Firestore = require('@google-cloud/firestore');
const {PubSub} = require('@google-cloud/pubsub');
const grpc = require('grpc');
const axios = require('axios');
const projectId = process.env.GCLOUD_PROJECT_ID;
const sageEndpoint = process.env.SAGE_EVENT_TRACKING_ENDPOINT;
const authorizationHeader = process.env.SAGE_AUTHORIZATION_HEADER;
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
    const parsed = JSON.parse(decodedMessage);
    const id = parsed.documentId;
    try {
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
        if (parsed.payload.session.action !== 'login') {
            return Promise.resolve();
        }
        console.log(`sending: ${id}`);

        const data = {
            registrationStatusLabel: parsed.payload.registrationStatusLabel,
            // profile: {
            //     firstName: docData.payload.firstName,
            //     lastName: docData.payload.lastName,
            //     pin: docData.payload.pin,
            // },
        };
        let userId = parsed.userId;
        if (!userId) {
            userId = parsed.payload.uuid;
            if (!userId) {
                console.error(`cannot find userId: ${id}`);
                return Promise.reject(new Error(`cannot find userId: ${id}`));
            }
        }
        const endpoint = `${sageEndpoint}/${userId}`;
        await sendRequest(data, endpoint);
        console.log(`sent: ${id}`);
        docData.sent = Firestore.Timestamp.now();
        await docRef.set(docData);
        return Promise.resolve();
    } catch (e) {
        console.error('error', JSON.stringify(e));
        if(e.response){
            console.error(e.response.data);
        }
        await pushToDeadLetter(decodedMessage, id);
        return Promise.reject(e);
    }

    async function sendRequest(data, endpoint, attempt = 1) {
        console.log(`attempt ${attempt}`);
        const config = {
            url: endpoint,
            method: 'POST',
            data: data,
            headers: {
                'Authorization': authorizationHeader,
            },
        };
        try {
            const response = await axios(config);
            console.info(response.status, response.data);
        } catch (e) {
            if(e.response){
                console.error(`attempt ${attempt} error: ${e.response.data}`);
            }
            if (attempt < 3) {
                await sendRequest(data, endpoint, ++attempt);
            } else {
                await Promise.reject(e);
            }
        }
    }

    async function pushToDeadLetter(data, documentId) {
        console.info(`push to dead letter: ${documentId}`);
        const dataBuffer = Buffer.from(JSON.stringify(data));
        await pubsub.topic('ex-monitoring-event-tracking-sage-dead-letter').publish(dataBuffer);
    }
};
