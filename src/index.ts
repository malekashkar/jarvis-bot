import { Routes } from "discord-api-types/v9";
import { REST } from "@discordjs/rest";
import {
  Collection,
  Client as BaseManager,
  ClientOptions,
  TextChannel,
  Invite,
} from "discord.js";

import mongoose from "mongoose";
import express from "express";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

import Event from "./events";
import Command from "./commands";
import logger from "./util/logger";
import { Location } from "./models/giveaway";
import Task from "./tasks";
import settings from "./settings";
import { SlashCommand } from "./types";

dotenv.config();

export default class Client extends BaseManager {
  discordRestApi = new REST({ version: "9" });
  server = express();

  commands: Collection<string, Command> = new Collection();
  inviteCodes: Collection<string, Invite> = new Collection();

  constructor(options?: ClientOptions) {
    super({
      ...options,
      partials: ["MESSAGE", "CHANNEL", "REACTION"],
      intents: [
        "GUILDS",
        "GUILD_MESSAGES",
        "GUILD_MESSAGE_REACTIONS",
        "GUILD_VOICE_STATES",
      ],
    });

    // CoinbaseClient.init(process.env.COINBASE_API);
    this.discordRestApi.setToken(process.env.TOKEN);
    this.login(process.env.TOKEN);

    this.loadDatabase();
    this.loadCommands();
    this.loadEvents();
    this.loadServer();
  }

  loadServer() {
    this.server.listen(process.env.PORT || 5000, () => logger.info("APP", `App started on port ${process.env.PORT || 5000}.`));
    this.server.get("*", (req, res) => res.send(`<h1>Leave me alone, I'm only here for personal use...</h1>`));
  }

  loadDatabase() {
    mongoose.connect(
      process.env.MONGO_URL,
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useCreateIndex: true,
        connectTimeoutMS: 60000,
        socketTimeoutMS: 30000,
        serverSelectionTimeoutMS: 60000,
        keepAlive: true,
      },
      (err: Error) => {
        if (err) logger.error("DB", err.toString());
        else logger.info("DB", `The database has connected successfully.`);
      }
    );
  }

  async locateMessage(location: Location) {
    const guild = await this.guilds.fetch(location.guildId);
    if (guild) {
      const channel = guild.channels.resolve(location.channelId) as TextChannel;
      if (channel) {
        const message = await channel.messages.fetch(location.messageId);
        if (message) {
          return message;
        } else {
          return null;
        }
      } else {
        return null;
      }
    } else {
      return null;
    }
  }

  async loadSlashCommands(client: this) {
    if(process.env.NODE_ENV == "dev") {
      try {
        await client.discordRestApi.put(
          Routes.applicationGuildCommands(client.user.id, settings.testingGuildId),
          { body: client.commands.map(x => x.slashCommand) },
        );

        logger.info("SLASH_COMMANDS", "Testing Guild Slash Commands have been loaded successfully!");
      } catch (error) {
        logger.error("SLASH_COMMANDS", error)
      }
    } else {
      try {
        for(const guild of this.guilds.cache.values()) {
          client.discordRestApi.get(Routes.applicationGuildCommands(client.user.id, guild.id))
          .then((data: SlashCommand[]) => {
            Promise.all(data.map(cmd => client.discordRestApi.delete(`${Routes.applicationGuildCommands(client.user.id, guild.id)}/${cmd.id}`)))
          })
          .catch(console.error);
        }

        await client.discordRestApi.put(
          Routes.applicationCommands(client.user.id),
          { body: client.commands.map(x => x.slashCommand) },
        );
  
        logger.info("SLASH_COMMANDS", "Global Slash Commands have been loaded successfully!");
      } catch (error) {
        logger.error("SLASH_COMMANDS", error)
      }
    }
  }

  loadCommands(directory: string = path.join(__dirname, "commands")) {
    const directoryStats = fs.statSync(directory);
    if (!directoryStats.isDirectory()) return;

    const commandFiles = fs.readdirSync(directory);
    for (const commandFile of commandFiles) {
      const commandPath = path.join(directory, commandFile);
      const commandFileStats = fs.statSync(commandPath);

      if (commandFileStats.isDirectory()) {
        this.loadCommands(commandPath);
        continue;
      } else if (
        !commandFileStats.isFile() ||
        !/^.*\.(js|ts|jsx|tsx)$/i.test(commandFile) ||
        path.parse(commandPath).name == "index"
      ) continue;

      const tmpCommand = require(commandPath);
      const command =
        typeof tmpCommand !== "function" &&
        typeof tmpCommand.default == "function"
          ? tmpCommand.default
          : typeof tmpCommand == "function"
          ? tmpCommand
          : null;

      try {
        const commandObj: Command = new command(this);
        if (commandObj?.slashCommand?.name) {
          if (this.commands.has(commandObj.slashCommand.name)) {
            logger.error(
              `DUPLICATE_COMMAND`,
              `Duplicate command ${commandObj.slashCommand.name}.`
            );
          } else this.commands.set(commandObj.slashCommand.name, commandObj);
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

      if (eventFileStats.isDirectory()) {
        this.loadEvents(eventPath);
        continue;
      } else if (
        !eventFileStats.isFile() ||
        !/^.*\.(js|ts|jsx|tsx)$/i.test(eventFile) ||
        path.parse(eventPath).name == "index"
      ) continue;

      const tmpEvent = require(eventPath);
      const event =
        typeof tmpEvent.default == "function" ? tmpEvent.default : null;
      if (!event) return;

      try {
        const eventObj: Event = new event(this);
        if (eventObj?.eventName) {
          this.on(eventObj.eventName, (...args) => eventObj.handle(...args))
        }
      } catch (ignored) {}
    }
  }

  loadTasks(directory = path.join(__dirname, "tasks")) {
    const directoryStats = fs.statSync(directory);
    if (!directoryStats.isDirectory()) return;

    const tasksFiles = fs.readdirSync(directory);
    for (const taskFile of tasksFiles) {
      const taskPath = path.join(directory, taskFile);
      const taskFileStats = fs.statSync(taskPath);

      if (taskFileStats.isDirectory()) {
        this.loadTasks(taskPath);
        continue;
      } else if (
        !taskFileStats.isFile() ||
        !/^.*\.(js|ts|jsx|tsx)$/i.test(taskFile) ||
        path.parse(taskPath).name == "index"
      ) continue;

      const tmpTask = require(taskPath);
      const task =
        typeof tmpTask.default == "function" ? tmpTask.default : null;
      if (!task) return;

      try {
        const taskObj: Task = new task(this);
        setInterval(taskObj.execute, taskObj.interval);
      } catch (ignored) {}
    }
  }
}

new Client();
