'use strict';
const Firestore = require('@google-cloud/firestore');
const projectId = process.env.GCLOUD_PROJECT_ID;
const environment = process.env.ENVIRONMENT || null;
const authorizationHeader = process.env.EVENT_TRACKING_STORER_AUTHORIZATION_HEADER;
const cors = require('cors')({
    origin: true,
});
const config = {
    projectId,
};
if (!environment) {
    config.keyFilename = './keyfile.json';
}

const db = new Firestore(config);

exports.storeEventTrackingMessage = (req, res) => {
    try {
        return cors(req, res, async () => {
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
        });
    } catch (e) {
        console.error(e);
        return res.sendStatus(500);
    }
};
