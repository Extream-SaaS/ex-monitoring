'use strict';
const Firestore = require('@google-cloud/firestore');
const {PubSub} = require('@google-cloud/pubsub');
const grpc = require('grpc');
const projectId = process.env.GCLOUD_PROJECT_ID;
const environment = process.env.ENVIRONMENT || null;
const pubsub = new PubSub({grpc, projectId});

const config = {
    projectId,
};
if (!environment) {
    config.keyFilename = './keyfile.json';
}

const db = new Firestore(config);

exports.processEventTrackingMessage = async (event) => {
    const resource = event.value.name;
    const docRef = db.doc(resource.split('/documents/')[1]);
    const doc = await docRef.get();
    const docData = doc.data();
    try {
        docData.processed = Firestore.Timestamp.now();
        await docRef.set(docData);
        await pushToQueue({...docData, documentId: doc.id});
        console.log(`processed: ${doc.id}`);
        return Promise.resolve();
    } catch (e) {
        docData.processed = null;
        await docRef.set(docData);
        console.error(e);
        return Promise.reject(e);
    }

    async function pushToQueue(data) {
        const dataBuffer = Buffer.from(JSON.stringify(data));
        await pubsub.topic('ex-monitoring-event-tracking-adobe').publish(dataBuffer);
    }
};
