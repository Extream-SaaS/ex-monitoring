'use strict';
const Firestore = require('@google-cloud/firestore');
const projectId = process.env.GCLOUD_PROJECT_ID;
const authorizationHeader = process.env.AUTHORIZATION_HEADER;

exports.processMessages = async (req, res) => {
    try {
        if (!req.headers.authorization || req.headers.authorization !== authorizationHeader) {
            return res.sendStatus(401);
        }
        if (!req.body.eventId) {
            return res.sendStatus(400);
        }
        const eventId = req.body.eventId;
        console.log(`eventId: ${eventId}`);
        const db = new Firestore({
            projectId,
        });

      const monitoringRef = db.collection('monitoring');
      const snapshot = await monitoringRef.where('eventsId', '==', eventId).get();
      if (snapshot.empty) {
        console.log('No matching documents.');
        return res.sendStatus(404);
      }

      for (const doc of snapshot) {
        console.log(doc.id);
      }

      return res.sendStatus(200);
    } catch (e) {
        console.error(e);
        // return Promise.reject(e);
        return res.sendStatus(500);
    }
};
