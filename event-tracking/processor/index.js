'use strict';
const Firestore = require('@google-cloud/firestore');
const projectId = process.env.GCLOUD_PROJECT_ID;
const environment = process.env.ENVIRONMENT || null;

const config = {
    projectId,
};
if (!environment) {
    config.keyFilename = './keyfile.json';
}

const db = new Firestore(config);

exports.processEventTrackingMessage = (event) => {
    try {

        console.log('event1', JSON.stringify(event.data()));
        console.log('event', JSON.stringify(event.value));
        console.log('event2', JSON.stringify(event.value.data()));
        // console.log('data', JSON.stringify(event.data));
        // console.log('data data', JSON.stringify(event.data.data()));
        console.log('fields', JSON.stringify(event.value.fields));
        console.log('fields data', JSON.stringify(event.value.fields.data()));
        console.log('resource', event.resource);
        return Promise.resolve();
    } catch (e) {
        console.error(e);
        return Promise.reject(e);
    }
};

// exports.processEventTrackingMessage = functions.firestore
//     .document('monitoring-event-tracking/{document}')
//     .onCreate((snapshot, context) => {
//         try {
//             const data = snapshot.data();
//             console.log('data', data);
//             return Promise.resolve();
//         } catch (e) {
//             console.error(e);
//             return Promise.reject(e);
//         }
//     });
