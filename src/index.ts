import settings from "./settings";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

import Event from "./events";
import Command from "./commands";
import logger from "./util/logger";
import express, { Request, Response } from "express";
import { Collection, Client as BaseManager, ClientOptions } from "discord.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => logger.info("APP", `App started on port ${PORT}.`));
app.get("*", (req: Request, res: Response) =>
  res.send(`<h1>Leave me alone, I'm only here for personal use...</h1>`)
);

export default class Client extends BaseManager {
  commands: Collection<string, Command> = new Collection();

  constructor(options?: ClientOptions) {
    super({
      ...options,
      partials: ["MESSAGE", "CHANNEL", "REACTION"],
      presence: {
        activity: {
          name: settings.status,
        },
      },
    });

    this.login(process.env.TOKEN);
    this.loadCommands();
    this.loadEvents();
    this.loadDatabase();
  }

  loadDatabase() {
    mongoose.connect(
      process.env.MONGO_URL,
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useCreateIndex: true,
        connectTimeoutMS: 60000,
        socketTimeoutMS: 60000,
        serverSelectionTimeoutMS: 60000,
      },
      (err: Error) => {
        if (err) logger.error("DATABASE", err.toString());
      }
    );
  }

  loadCommands(directory: string = path.join(__dirname, "commands")) {
    const directoryStats = fs.statSync(directory);
    if (!directoryStats.isDirectory()) return;

    const commandFiles = fs.readdirSync(directory);
    for (const commandFile of commandFiles) {
      const commandPath = path.join(directory, commandFile);
      const commandFileStats = fs.statSync(commandPath);
      if (!commandFileStats.isFile()) {
        this.loadCommands(commandPath);
        continue;
      }
      if (
        !commandFileStats.isFile() ||
        !/^.*\.(js|ts|jsx|tsx)$/i.test(commandFile) ||
        path.parse(commandPath).name === "index"
      )
        continue;

      const tmpCommand = require(commandPath);
      const command =
        typeof tmpCommand !== "function" &&
        typeof tmpCommand.default === "function"
          ? tmpCommand.default
          : typeof tmpCommand === "function"
          ? tmpCommand
          : null;

      try {
        const commandObj: Command = new command(this);
        if (commandObj && commandObj.cmdName) {
          if (this.commands.has(commandObj.cmdName)) {
            logger.error(
              `DUPLICATE_COMMAND`,
              `Duplicate command ${commandObj.cmdName}.`
            );
          } else this.commands.set(commandObj.cmdName, commandObj);
        }
      } catch (e) {}
    }
  }

  loadEvents(directory = path.join(__dirname, "events")) {
    const directoryStats = fs.statSync(directory);
    if (!directoryStats.isDirectory()) return;

    const eventFiles = fs.readdirSync(directory);
    for (const eventFile of eventFiles) {
      const eventPath = path.join(directory, eventFile);
      const eventFileStats = fs.statSync(eventPath);
      if (
        !eventFileStats.isFile() ||
        !/^.*\.(js|ts|jsx|tsx)$/i.test(eventFile) ||
        path.parse(eventPath).name === "index"
      )
        continue;

      const tmpEvent = require(eventPath);
      const event =
        typeof tmpEvent.default === "function" ? tmpEvent.default : null;
      if (!event) return;

      try {
        const eventObj: Event = new event(this);
        if (eventObj && eventObj.name) {
          this.addListener(eventObj.name, (...args) =>
            eventObj.handle.bind(eventObj)(this, ...args)
          );
        }
      } catch (ignored) {}
    }
  }
}

new Client();
