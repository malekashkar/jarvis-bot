import settings from "./settings";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

import Event from "./events";
import Command from "./commands";
import logger from "./util/logger";
import Client from "./structures/client";
import express, { Request, Response } from "express";

dotenv.config();

const app = express();
app.listen(process.env.PORT || 5000);
app.get("/", (req: Request, res: Response) => res.send(`Get out please :)`));

export interface ISettings {
  ownerId: string;
  status: string;
  emojis: string[];
  mongoURL: string;
  spreadsheet: string;
  projectId: string;
}

const client = new Client({
  partials: ["MESSAGE", "CHANNEL", "REACTION"],
});

loadCommands();
loadEvents();
loadDatabase(settings.mongoURL);

function loadDatabase(url: string) {
  mongoose.connect(
    url,
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

function loadCommands(directory: string = path.join(__dirname, "commands")) {
  const directoryStats = fs.statSync(directory);
  if (!directoryStats.isDirectory()) return;

  const commandFiles = fs.readdirSync(directory);
  for (const commandFile of commandFiles) {
    const commandPath = path.join(directory, commandFile);
    const commandFileStats = fs.statSync(commandPath);
    if (!commandFileStats.isFile()) {
      loadCommands(commandPath);
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
      const commandObj: Command = new command(client);
      if (commandObj && commandObj.cmdName) {
        if (client.commands.has(commandObj.cmdName)) {
          logger.error(
            `DUPLICATE_COMMAND`,
            `Duplicate command ${commandObj.cmdName}.`
          );
        } else client.commands.set(commandObj.cmdName, commandObj);
      }
    } catch (e) {}
  }
}

function loadEvents(directory = path.join(__dirname, "events")) {
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
      const eventObj: Event = new event(client);
      if (eventObj && eventObj.name) {
        client.addListener(eventObj.name, (...args) =>
          eventObj.handle.bind(eventObj)(client, ...args)
        );
      }
    } catch (ignored) {}
  }
}

client.login(process.env.TOKEN);
