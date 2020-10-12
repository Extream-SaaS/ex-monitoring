'use strict';
const Firestore = require('@google-cloud/firestore');
const projectId = process.env.GCLOUD_PROJECT_ID;
const authorizationHeader = process.env.AUTHORIZATION_HEADER;
const environment = process.env.ENVIRONMENT || null;

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
        const config = {
            projectId,
        };
        if (!environment) {
            config.keyFilename = './keyfile.json';
        }
        const a = Firestore.Timestamp.now();
        const b = Firestore.FieldValue.serverTimestamp();

        const db = new Firestore(config);

        const monitoringCollectionRef = db.collection('monitoring');
        const eventQuery = monitoringCollectionRef.where('eventId', '==', eventId);
        const snapshot = await eventQuery.get();
        if (snapshot.empty) {
            console.log('No matching documents.');
            return res.sendStatus(404);
        }
        const exAuthStats = await getExAuthStats(eventQuery);
        const exGatewayStats = await getExGatewayStats(eventQuery);

        return res.json({...exAuthStats, ...exGatewayStats});
    } catch (e) {
        console.error(e);
        // return Promise.reject(e);
        return res.sendStatus(500);
    }

    async function getExGatewayStats(eventQuery) {
        const exGatewaySnapshot = await eventQuery.where('source', '==', 'ex-gateway').get();
        if (exGatewaySnapshot.empty) {
            console.log('No matching ex-gateway documents.');
            return null;
        }
        const docs = exGatewaySnapshot.docs.map((doc) => {
            return {
                id: doc.id,
                ...doc.data(),
            };
        });

        const chatMessagesSent = await calculateChatMessagesSent(docs);
        console.log(`total messages sent: ${chatMessagesSent.length}`);

        const uniqueUserItinerariesRetrieved = await calculateUniqueUserItinerariesRetrieved(docs);
        console.log(`total unique user itineraries retrieved: ${uniqueUserItinerariesRetrieved.length}`);

        const videoCallsCreated = await calculateVideoCallsCreated(docs);
        console.log(`total video calls created: ${videoCallsCreated.length}`);

        const videoCallsJoined = await calculateVideoCallsJoined(docs);
        console.log(`total video calls joined: ${videoCallsJoined.length}`);
        // const unique = docs.reduce((acc, current) => {
        //     const found = acc.find(item => item.event.action === current.event.action && item.event.command === current.event.command);
        //     if (!found) {
        //         return acc.concat([current]);
        //     } else {
        //         return acc;
        //     }
        // }, []);
        // console.log('unique action/command types', unique);
        return {
            chatMessagesSent: chatMessagesSent.length,
            uniqueUserItinerariesRetrieved: uniqueUserItinerariesRetrieved.length,
            videoCallsCreated: videoCallsCreated.length,
            videoCallsJoined: videoCallsJoined.length,
        };
    }

    async function calculateChatMessagesSent(docs) {
        return docs.filter((doc) => {
            return doc.event.action === 'chat' && doc.event.command === 'send' && doc.event.success;
        });
    }

    async function calculateUniqueUserItinerariesRetrieved(docs) {
        const itinerariesRetrieved = docs.filter((doc) => {
            return doc.event.action === 'itinerary' && doc.event.command === 'get' && doc.event.success;
        });

        return itinerariesRetrieved.reduce((acc, current) => {
            const found = acc.find(item => item.auth.user.id === current.auth.user.id);
            if (!found) {
                return acc.concat([current]);
            } else {
                return acc;
            }
        }, []);
    }

    async function calculateVideoCallsCreated(docs) {
        return docs.filter((doc) => {
            return doc.event.action === 'webrtc' && doc.event.command === 'start' && doc.event.success;
        });
    }

    async function calculateVideoCallsJoined(docs) {
        return docs.filter((doc) => {
            return doc.event.action === 'webrtc' && doc.event.command === 'accept' && doc.event.success;
        });
    }

    async function getExAuthStats(eventQuery) {
        const exAuthSnapshot = await eventQuery.where('source', '==', 'ex-auth').get();
        if (exAuthSnapshot.empty) {
            console.log('No matching ex-auth documents.');
            return null;
        }
        const docs = exAuthSnapshot.docs.map((doc) => {
            return {
                id: doc.id,
                ...doc.data(),
            };
        });

        const totalAuthentications = await calculateTotalAuthentications(docs);
        console.log(`total successful authentications: ${totalAuthentications.length}`);
        const uniqueUserAuthentications = await calculateUniqueUserAuthentications(totalAuthentications);
        console.log(`total successful unique user authentications: ${uniqueUserAuthentications.length}`);

        return {
            totalAuthentications: totalAuthentications.length,
            uniqueUserAuthentications: uniqueUserAuthentications.length,
        };
    }

    async function calculateTotalAuthentications(docs) {
        return docs.filter((doc) => {
            return doc.event.success && doc.event.command === 'login';
        });
    }

    async function calculateUniqueUserAuthentications(totalAuthentications) {
        return totalAuthentications.reduce((acc, current) => {
            const found = acc.find(item => item.auth.user.id === current.auth.user.id);
            if (!found) {
                return acc.concat([current]);
            } else {
                return acc;
            }
        }, []);
    }
};
