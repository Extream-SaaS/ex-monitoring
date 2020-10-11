'use strict';
const Firestore = require('@google-cloud/firestore');
const projectId = process.env.GCLOUD_PROJECT_ID;
const environment = process.env.ENVIRONMENT || null;
const authorizationHeader = process.env.AUTHORIZATION_HEADER;

const config = {
    projectId,
};
if (!environment) {
    config.keyFilename = './keyfile.json';
}

const db = new Firestore(config);

exports.fetchEventTrackingMessages = async (req, res) => {
    try {
        if (!req.headers.authorization || req.headers.authorization !== authorizationHeader) {
            return res.sendStatus(401);
        }
        if (!req.body.eventId) {
            return res.sendStatus(400);
        }
        const collectionRef = db.collection('monitoring-event-tracking');
        const snapshot = await collectionRef.where('eventId', '==', req.body.eventId).orderBy('addedAt', 'desc').get();

        if (snapshot.empty) {
            console.log('No matching documents.');
            return res.json({});
        }
        const docs = snapshot.docs.map((doc) => {
            const data = doc.data();
            data.addedAt = data.addedAt.toMillis();
            return {
                id: doc.id,
                ...data,
            };
        });
        return res.json(docs);
    } catch (e) {
        console.error(e);
        return res.sendStatus(500);
    }
};
