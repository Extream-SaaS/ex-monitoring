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
        console.log('event', JSON.stringify(event.value));
        console.log('fields', JSON.stringify(event.value.fields));
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
