'use strict';
const Firestore = require('@google-cloud/firestore');
const projectId = process.env.GCLOUD_PROJECT_ID;
const environment = process.env.ENVIRONMENT || null;
const authorizationHeader = process.env.EVENT_TRACKING_STORER_AUTHORIZATION_HEADER;

const config = {
    projectId,
};
if (!environment) {
    config.keyFilename = './keyfile.json';
}

const db = new Firestore(config);

exports.storeEventTrackingMessage = async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Credentials', 'true');
    if (req.method === 'OPTIONS') {
        res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.set('Access-Control-Allow-Headers', 'Authorization', 'Content-Type');
        res.set('Access-Control-Max-Age', '3600');
        return res.sendStatus(204);
    }
    // res.set('Access-Control-Allow-Methods', 'POST');
    try {
        if (!req.headers.authorization || req.headers.authorization !== authorizationHeader) {
            return res.sendStatus(401);
        }
        if (!req.body.eventId) {
            return res.sendStatus(400);
        }
        const docRef = db.collection('monitoring-event-tracking').doc();
        await docRef.set({
            ...req.body,
            addedAt: Firestore.FieldValue.serverTimestamp()
        });
        return res.sendStatus(200);
    } catch (e) {
        console.error(e);
        return res.sendStatus(500);
    }
};
