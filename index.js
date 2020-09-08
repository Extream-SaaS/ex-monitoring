'use strict';
const Firestore = require('@google-cloud/firestore');
const projectId = process.env.GCLOUD_PROJECT_ID;

exports.storeMonitoringMessage = async (message, context) => {
  try {
    const decodedMessage = message.data ? Buffer.from(message.data, 'base64').toString() : null;
    console.log('decoded', decodedMessage)
    const db = new Firestore({
      projectId,
    });

    const docRef = db.collection('monitoring').doc();

    await docRef.set({
      ...decodedMessage,
      addedAt: Firestore.FieldValue.serverTimestamp()
    });
    return Promise.resolve();
  } catch (e) {
    console.error(e);
    return Promise.reject(e);
  }
};
