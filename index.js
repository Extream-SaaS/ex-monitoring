'use strict';
const Firestore = require('@google-cloud/firestore');
const projectId = process.env.GCLOUD_PROJECT_ID;

exports.storeMonitoringMessage = async (message) => {
  try {
    const decodedMessage = message.data ? Buffer.from(message.data, 'base64').toString() : null;
    const parsed = JSON.parse(decodedMessage);
    console.info('decoded', decodedMessage)
    const db = new Firestore({
      projectId,
    });

    const docRef = db.collection('monitoring').doc();

    await docRef.set({
      ...parsed,
      addedAt: Firestore.FieldValue.serverTimestamp()
    });
    return Promise.resolve();
  } catch (e) {
    console.error(e);
    return Promise.reject(e);
  }
};
