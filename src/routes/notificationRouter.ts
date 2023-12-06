import SocketIO from "socket.io";
import { applyMatch, getAlarm } from "../alarm/alarm";
import Expo from "expo-server-sdk";

const expo = new Expo();
const expoPushTokens = new Map<string, string>();

const notificationServerHandler = (
  io: SocketIO.Namespace,
  chatServer: SocketIO.Server,
) => {
  io.on("connection", (socket) => {
    socket.on("registerExpoPushToken", (expoPushToken: string) => {
      console.log(expoPushToken);
      expoPushTokens.set(socket.id, expoPushToken);
      console.log(expoPushTokens);
    });

    socket.on("disconnect", () => {
      expoPushTokens.delete(socket.id);
    });

    socket.on(
      "newMessageNotification",
      async (
        token: string,
        nickname: string,
        postingTitle: string,
        payload: string,
      ) => {
        await expo.sendPushNotificationsAsync([
          {
            to: token,
            sound: "default",
            title: `${postingTitle}`,
            body: `${nickname}: ${payload}`,
          },
        ]);
      },
    );
  });
};

export default notificationServerHandler;
