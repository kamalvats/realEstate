import express from "express";
import Mongoose from "mongoose";
import * as http from "http";
import * as path from "path";
import cors from "cors";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import swaggerJSDoc from "swagger-jsdoc";
import apiErrorHandler from '../helper/apiErrorHandler';
const app = new express();
const server = http.createServer(app);
const root = path.normalize(`${__dirname}/../..`);
import WebSocket from 'websocket';
const WebSocketServer = WebSocket.server;
const WebSocketClient = WebSocket.client;
const client = new WebSocketClient();
const wsServer = new WebSocketServer({
  httpServer: server,
  autoAcceptConnections: false,
  maxReceivedFrameSize: 64 * 1024 * 1024,   // 64MiB
  maxReceivedMessageSize: 64 * 1024 * 1024, // 64MiB
  fragmentOutgoingMessages: false,
  keepalive: false,
  disableNagleAlgorithm: false
});
import cookieParser from "cookie-parser";
import config from "config";


class ExpressServer {
  constructor() {


    app.use(express.json({ limit: '1000mb' }));

    app.use(express.urlencoded({ extended: true, limit: '1000mb' }))

    app.use(morgan('dev'))
    // Temporary logging for debugging cookies and origins
    app.use((req, res, next) => {
      console.log('Request Origin:', req.headers.origin);
      console.log('Cookies received:', req.cookies);
      next();
    });
    const allowedOrigins = [
  "http://localhost:2070",
  "http://127.0.0.1:2070",
  "http://192.168.16.163:2070",
  "http://10.190.70.180:2070",
  "http://127.0.0.1:5500",
  "http://localhost:5500",
  "http://192.168.1.36:2070",
  "http://192.168.1.36:2072",
  "https://interventions-reader-cats-essentials.trycloudflare.com"
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  // origin: '*',
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS","PATCH"],
  allowedHeaders: ["Content-Type", "Authorization","Accept"],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(cookieParser());


  }
  router(routes) {
    routes(app);
    return this;
  }

  configureSwagger(swaggerDefinition) {
    const options = {
      // swaggerOptions : { authAction :{JWT :{name:"JWT", schema :{ type:"apiKey", in:"header", name:"Authorization", description:""}, value:"Bearer <JWT>"}}},
      swaggerDefinition,
      apis: [
        path.resolve(`${root}/server/api/v1/controllers/**/*.js`),
        path.resolve(`${root}/api.yaml`),
      ],
    };

    app.use(
      "/api-docs",
      swaggerUi.serve,
      swaggerUi.setup(swaggerJSDoc(options))
    );
    return this;
  }

  handleError() {
    app.use(apiErrorHandler);

    return this;
  }

  configureDb(dbUrl) {
    return new Promise(async (resolve, reject) => {
      try {
        await Mongoose.connect(dbUrl, {
          useNewUrlParser: true,
          useUnifiedTopology: true,
          // family: 4,
          // keepAlive: true,
          // connectTimeoutMS: 1000 * 60 * 5
        });

        resolve(this);
      } catch (err) {
        console.error(`Error in mongodb connection ${err.message}`);
        reject(err);
      }
    });
  }


  // })

  listen(port) {
    server.listen(port, '0.0.0.0', () => {
      console.log(`secure app is listening @port ${port}`, new Date().toLocaleString());
    });
    return app;
  }
}

// wsServer.on('request', function (request) {
//   if (!originIsAllowed(request.origin)) {
//     request.reject();
//     return;
//   }
//   const connection = request.accept('', request.origin);
//   connection.on('message', async function (message) {
//     try{
//  var type = JSON.parse(message.utf8Data);
//     if(type.options == "getLiveCampaigns"){
//       let response =await getLiveCampaigns(type)
//       //  if (response) { connection.sendUTF(response); }
//     }
//     if(type.options == "getLiveStats"){
//       let response =await getLiveStats(type)
//       //  if (response) { connection.sendUTF(response); }
//     }
//    }catch(error){
//      console.log(error);
//    }


//   });

//   async function getLiveCampaigns(validatedBody) {
//       let result = await campaignController.getLiveCampaigns(validatedBody);
//       if (result) {
//         var data = JSON.stringify(result);
//         connection.sendUTF(data);
//       }
//       setTimeout(() => {
//         getLiveCampaigns(validatedBody)
//       }, 5000);
//   }

//   async function getLiveStats() {
//     if (connection.connected) {
//       let result = await campaignController.getLiveStats();
//       if (result) {
//         var data = JSON.stringify(result);
//         connection.sendUTF(data);
//       }
//       setTimeout(() => {
//         getLiveStats()
//       }, 1000);
//     }
//   }

//   // ******************************************************************************************/
//   connection.on('close', function (reasonCode, description) {
//     console.log(new Date() + ' Peer ' + connection.remoteAddress + ' Client has disconnected.');
//   });
//   connection.on('connectFailed', function (error) {
//     console.log('Connect Error: ' + error.toString());
//   });
// });

// client.on('connect', function (connection) {
//   console.log(new Date() + ' WebSocket Client Connected');
//   connection.on('error', function (error) {
//     console.log("Connection Error: " + error.toString());
//   });
//   connection.on('close', function () {
//     console.log('echo-protocol Connection Closed');
//   });

// });
// client.connect(config.get('websocketAddress'), '');


export default ExpressServer;

function originIsAllowed(origin) {
  return true;
}



