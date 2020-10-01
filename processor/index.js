'use strict';
const Firestore = require('@google-cloud/firestore');
const projectId = process.env.GCLOUD_PROJECT_ID;
const authorizationHeader = process.env.AUTHORIZATION_HEADER;

exports.processMessages = async (req, res) => {
  try {
    if (!req.headers.authorization || req.headers.authorization !== authorizationHeader) {
      return res.sendStatus(401);
    }
  console.log('hellfro');
    return res.sendStatus(200);
  } catch (e) {
    console.error(e);
    // return Promise.reject(e);
    return res.sendStatus(500);
  }
};
