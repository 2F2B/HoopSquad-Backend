"use strict";
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const body_parser_1 = __importDefault(require("body-parser"));
const http_1 = __importDefault(require("http"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(body_parser_1.default.json());
const httpServer = http_1.default.createServer(app);
const authRouter = require("./routes/authRouter");
const courtRouter = require("./routes/courtRouter");
const { socketIOHandler } = require("./routes/chatRouter");
const matchRouter = require("./routes/matchRouter");
const profileRouter = require("./routes/profileRouter");
app.use("/auth", authRouter);
app.use("/court", courtRouter);
app.use("/match", matchRouter);
app.use("/profile", profileRouter);
app.use(
  body_parser_1.default.raw({
    type: "image/jpeg",
    limit: "10mb",
  }),
);
try {
  socketIOHandler(httpServer);
} catch (err) {
  if (err instanceof Error) {
    console.error(err);
  }
}
app.get("/", (_req, res) =>
  __awaiter(void 0, void 0, void 0, function* () {
    try {
      res.json({ connect: "OK" });
    } catch (err) {
      res.json(err);
      return console.error(err);
    }
  }),
);
httpServer.listen(3000, () => {
  console.log("Server started on Port 3000");
});
//# sourceMappingURL=index.js.map
