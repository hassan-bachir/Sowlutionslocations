import { listPermittedViewerIds } from "../services/location-permission.service.js";
import { saveLocationPoint } from "../services/location-point.service.js";

const clientsByUserId = new Map();

const addClient = (userId, socket) => {
  const clients = clientsByUserId.get(userId) || new Set();

  clients.add(socket);
  clientsByUserId.set(userId, clients);
};

const removeClient = (userId, socket) => {
  const clients = clientsByUserId.get(userId);

  if (!clients) {
    return;
  }

  clients.delete(socket);

  if (clients.size === 0) {
    clientsByUserId.delete(userId);
  }
};

const sendToUser = (userId, payload) => {
  const clients = clientsByUserId.get(userId);

  if (!clients) {
    return;
  }

  const message = JSON.stringify(payload);

  for (const client of clients) {
    if (client.readyState === 1) {
      client.send(message);
    }
  }
};

const parseJson = (message) => {
  try {
    return JSON.parse(message.toString());
  } catch {
    return null;
  }
};

export const realtimeRoutes = async (app) => {
  app.get("/location", { websocket: true }, (socket, request) => {
    const token = request.query.token;

    if (!token) {
      socket.close(1008, "Missing token");
      return;
    }

    let user;

    try {
      const decodedToken = app.jwt.verify(token);

      user = {
        id: decodedToken.sub,
        email: decodedToken.email,
      };
    } catch {
      socket.close(1008, "Invalid token");
      return;
    }

    addClient(user.id, socket);
    socket.send(JSON.stringify({ type: "connected", user }));

    socket.on("message", async (rawMessage) => {
      const message = parseJson(rawMessage);

      if (message?.type !== "location") {
        socket.send(
          JSON.stringify({
            type: "error",
            message: "Unsupported message type",
          }),
        );
        return;
      }

      try {
        const point = await saveLocationPoint(
          message.sessionId,
          user.id,
          {
            latitude: message.latitude,
            longitude: message.longitude,
            recordedAt: message.recordedAt,
          },
          app.db,
        );
        const viewerIds = listPermittedViewerIds(user.id, app.db);
        const payload = {
          type: "location:update",
          ownerUserId: user.id,
          ownerEmail: user.email,
          point,
        };

        sendToUser(user.id, payload);

        for (const viewerId of viewerIds) {
          sendToUser(viewerId, payload);
        }
      } catch (error) {
        socket.send(
          JSON.stringify({
            type: "error",
            message: error.message,
          }),
        );
      }
    });

    socket.on("close", () => {
      removeClient(user.id, socket);
    });
  });
};
