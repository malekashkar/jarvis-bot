import settings from "./settings";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

import Event from "./events";
import Command, { Groups } from "./commands";
import logger from "./util/logger";
import express, { Request, Response } from "express";
import { Collection, Client as BaseManager, ClientOptions } from "discord.js";
import coinbase, { Client as CoinbaseClient } from "coinbase-commerce-node";
import Order, { OrderModel } from "./models/order";
import embeds from "./util/embed";
import { DocumentType } from "@typegoose/typegoose";
import { CodeInfo, GlobalModel } from "./models/global";

// Load in the .env
dotenv.config();

// Login to the coinbase client
CoinbaseClient.init(process.env.COINBASE_API);

// Start the site API
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
    });

    this.login(process.env.TOKEN);
    this.loadCommands();
    this.loadEvents();
    this.loadDatabase();

    this.loadCoinbase();
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
        if (err) logger.error("DB", err.toString());
        else logger.info("DB", `The database has connected successfully.`);
      }
    );
  }

  loadCoinbase() {
    // If invoice found: DM user we are waiting for 3 confirmations.
    // If invoice hits 3 confirmations: Delete invoice message, dm user he paid and received the modules, delete the document, and give the user the modules access.

    const charges = coinbase.resources.Charge;

    setInterval(async () => {
      const ordersCursor = OrderModel.find({
        endTime: { $gt: new Date() },
      }).cursor();

      ordersCursor.on("data", async (info: DocumentType<Order>) => {
        const user = await this.users.fetch(info.userId);
        const invoice = await charges.retrieve(info.chargeId);
        if (!invoice) await OrderModel.update(info, { endTime: new Date() });

        if (invoice.payments[0]?.status === "COMPLETED") {
          const code =
            Math.random().toString(36).substring(2, 15) +
            Math.random().toString(36).substring(2, 15);

          const globalData =
            (await GlobalModel.findOne({})) || (await GlobalModel.create({}));
          globalData.codes.push(new CodeInfo(code, info.modules as Groups[]));
          await globalData.save();

          if (user)
            user.send(
              embeds.normal(
                `Payment Completed`,
                `Please run the command \`${globalData.prefix}auth ${code}\` in order to gain access to your features.`
              )
            );

          await OrderModel.deleteOne(info);
        }
      });

      const endedOrderCursor = OrderModel.find({
        endTime: { $lte: new Date() },
      }).cursor();

      endedOrderCursor.on("data", async (info: DocumentType<Order>) => {
        const user = await this.users.fetch(info.userId);
        const invoiceMessage = await user.dmChannel.messages.fetch(
          info.invoiceMessageId
        );
        await OrderModel.deleteOne(info);

        if (invoiceMessage?.deletable) invoiceMessage.delete();
        if (user)
          user
            .send(
              embeds.normal(
                `Order Cancelled`,
                `The order with checkout ID \`${info.invoiceMessageId}\` has been cancelled.`
              )
            )
            .catch(() => undefined);
      });
    }, 60 * 1000);
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
          this.addListener(eventObj.name, async (...args) =>
            eventObj.handle.bind(eventObj)(...args, eventObj.name)
          );
        }
      } catch (ignored) {}
    }
  }
}

new Client();
