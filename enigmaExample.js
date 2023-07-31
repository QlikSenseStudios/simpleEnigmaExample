// establish youe websocket to Qlik QIX engine using enigma.js - https://qlik.dev/toolkits/enigma-js
(async () => {
    const enigma = require("enigma.js");
    const schema = require("enigma.js/schemas/12.612.0");
    const WebSocket = require("ws");
  
    // replace with your information
    const appId = "<app-id>";
    const tenant = "<your-tenant.qlikcloud.com>";
    const apiKey = "<your-api-key>";
  
    const url = `wss://${tenant}/app/${appId}`;
  
    const session = enigma.create({
      schema,
      createSocket: () =>
        new WebSocket(url, {
          headers: { Authorization: `Bearer ${apiKey}` },
          // you could pass the session cookie instead of the api key
          // headers: { <QLIKCOOKIE> },
        }),
    });
  
    // bind traffic events to log what is sent and received on the socket:
    session.on("traffic:sent", (data) => console.log("sent:", data));
    session.on("traffic:received", (data) => console.log("received:", data));
  
    // open the socket and eventually receive the QIX global API, and then close
    // the session:
    try {
      const global = await session.open();
      console.log("You are connected!");

      // open app - https://qlik.dev/apis/json-rpc/qix/global#%23%2Fentries%2FGlobal%2Fentries%2FOpenDoc
      const doc = await global.openDoc({
        "qDocName": appId
      });

      // get sheet list - https://qlik.dev/apis/javascript/sense-client-objects#%23%2Fdefinitions%2FsheetList
      // create session object - https://qlik.dev/apis/json-rpc/qix/doc#%23%2Fentries%2FDoc%2Fmethods%2FCreateSessionObject 
      const sheetListProps = {
        "qInfo": {
          "qType": "SheetList",
          "qId": ""
        },
        "qAppObjectListDef": {
          "qData": {
            "title": "/qMetaDef/title",
            "labelExpression": "/labelExpression",
            "showCondition": "/showCondition",
            "description": "/qMetaDef/description",
            "descriptionExpression": "/qMetaDef/descriptionExpression",
            "thumbnail": "/qMetaDef/thumbnail",
            "cells": "/cells",
            "rank": "/rank",
            "columns": "/columns",
            "rows": "/rows"
          },
          "qType": "sheet"
        }
      };
      const sheetList = await doc.createSessionObject(sheetListProps).then(list => list.getLayout());

      sheetList.qAppObjectList.qItems.forEach(async (item) => {
        const sheetId = item.qInfo.qId;
        const sheet = await doc.getObject(sheetId);
        const sheetLayout = await sheet.getLayout();
        console.log(sheetLayout);
      })


      await session.close();
      console.log("Session closed!");
    } catch (err) {
      console.log("Something went wrong :(", err);
    }
  })();