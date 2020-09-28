'use strict';
// const Firestore = require('@google-cloud/firestore');
// const projectId = process.env.GCLOUD_PROJECT_ID;

exports.processMessages = async () => {
  try {
  console.log('hello');
    return Promise.resolve();
  } catch (e) {
    console.error(e);
    return Promise.reject(e);
  }
};
