import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

import express from "express";
import Event from "./events";
import Command, { Groups } from "./commands";
import logger from "./util/logger";
import {
  Collection,
  Client as BaseManager,
  ClientOptions,
  TextChannel,
  User,
} from "discord.js";
import coinbase, { Client as CoinbaseClient } from "coinbase-commerce-node";
import Order, { OrderModel } from "./models/order";
import embeds from "./util/embed";
import { DocumentType } from "@typegoose/typegoose";
import { CodeInfo, GlobalModel } from "./models/global";
import { Giveaway, GiveawayModel } from "./models/giveaway";
import moment from "moment";

const app = express();
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => logger.info("APP", `App started on port ${PORT}.`));
app.get("*", (req, res) =>
  res.send(`<h1>Leave me alone, I'm only here for personal use...</h1>`)
);

// Load in the .env
dotenv.config();

// Login to the coinbase client
CoinbaseClient.init(process.env.COINBASE_API);
export default class Client extends BaseManager {
  commands: Collection<string, Command> = new Collection();

  constructor(options?: ClientOptions) {
    super({
      ...options,
      partials: ["MESSAGE", "CHANNEL", "REACTION"],
      ws: {
        intents: [
          "GUILDS",
          "GUILD_MESSAGES",
          "GUILD_MESSAGE_REACTIONS",
          "GUILD_VOICE_STATES",
        ],
      },
    });

    this.login(process.env.TOKEN);
    this.loadDatabase();
    this.loadCommands();
    this.loadEvents();

    this.giveawayInterval();
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

  loadCoinbase() {
    const charges = coinbase.resources.Charge;

    setInterval(async () => {
      const ordersCursor = OrderModel.find({
        endTime: { $gt: new Date() },
      }).cursor();

      ordersCursor.on("data", async (infoData: DocumentType<Order>) => {
        const user = await this.users.fetch(infoData.userId);
        const invoice = await charges.retrieve(infoData.chargeId);
        if (!invoice) await infoData.updateOne({ endTime: new Date() });

        if (invoice.payments[0]?.status === "COMPLETED") {
          const code =
            Math.random().toString(36).substring(2, 15) +
            Math.random().toString(36).substring(2, 15);

          const globalData =
            (await GlobalModel.findOne({})) || (await GlobalModel.create({}));
          globalData.codes.push(
            new CodeInfo(code, infoData.modules as Groups[])
          );
          await globalData.save();

          if (user)
            user.send(
              embeds.normal(
                `Payment Completed`,
                `Please run the command \`${globalData.prefix}auth ${code}\` in order to gain access to your features.`
              )
            );

          await OrderModel.deleteOne(infoData);
        }
      });

      const endedOrderCursor = OrderModel.find({
        endTime: { $lte: new Date() },
      }).cursor();

      endedOrderCursor.on("data", async (infoData: DocumentType<Order>) => {
        const user = await this.users.fetch(infoData.userId);
        const invoiceMessage = await user.dmChannel.messages.fetch(
          infoData.invoiceMessageId
        );
        await OrderModel.deleteOne(infoData);

        if (invoiceMessage?.deletable) invoiceMessage.delete();
        if (user)
          user
            .send(
              embeds.normal(
                `Order Cancelled`,
                `The order with checkout ID \`${infoData.invoiceMessageId}\` has been cancelled.`
              )
            )
            .catch(() => undefined);
      });
    }, 60 * 1000);
  }

  async giveawayInterval() {
    this.setInterval(async () => {
      const ongoingGiveaways = GiveawayModel.find({
        ended: false,
        endsAt: { $gt: new Date() },
      }).cursor();
      ongoingGiveaways.on("data", async (giveaway: DocumentType<Giveaway>) => {
        const guild = await this.guilds.fetch(giveaway.location.guildId);
        if (guild) {
          const channel = guild.channels.resolve(
            giveaway.location.channelId
          ) as TextChannel;
          if (channel) {
            try {
              const message = await channel.messages.fetch(
                giveaway.location.messageId
              );
              if (message) {
                const giveawayEmbed = embeds
                  .empty()
                  .addField(
                    `Information`,
                    `🎁 **Prize** ${giveaway.prize}\n${
                      giveaway.cappedEntries
                        ? `📈 **Capped Entries** ${giveaway.cappedEntries}\n`
                        : ``
                    }👥 **Winners** ${giveaway.winners}\n📅 **Ends ${moment(
                      giveaway.endsAt
                    ).fromNow()}**`,
                    true
                  );

                if (
                  giveaway.requirements.messageRequirement ||
                  giveaway.requirements.roleRequirements.length
                ) {
                  giveawayEmbed.addField(
                    `Requirements`,
                    `${
                      giveaway.requirements.messageRequirement
                        ? `💬 **Message Requirement** ${giveaway.requirements.messageRequirement}\n`
                        : ``
                    }${
                      giveaway.requirements.roleRequirements.length
                        ? `⚙️ **Role Requirements** ${giveaway.requirements.roleRequirements.map(
                            (x) => `<@&${x}>`
                          )}`
                        : ``
                    }`,
                    true
                  );
                }

                if (giveaway.requirements.multipliers.length) {
                  giveawayEmbed.addField(
                    `Role Multipliers`,
                    `${giveaway.requirements.multipliers
                      .map(
                        (x, i) => `${i + 1}. <@&${x.roleId}> - ${x.multiplier}x`
                      )
                      .join("\n")}`,
                    true
                  );
                }

                await message.edit(`🎉 **__GIVEAWAY__**`, giveawayEmbed);
              }
            } catch (e) {
              console.log(e);
              giveaway.ended = true;
              await giveaway.save();
            }
          }
        }
      });

      const endedGiveaways = GiveawayModel.find({
        ended: false,
        endsAt: { $lte: new Date() },
      }).cursor();
      endedGiveaways.on("data", async (giveaway: DocumentType<Giveaway>) => {
        let giveawayWinners: User[] = [];

        giveaway.ended = true;
        await giveaway.save();

        const guild = await this.guilds.fetch(giveaway.location.guildId);
        if (guild) {
          const channel = guild.channels.resolve(
            giveaway.location.channelId
          ) as TextChannel;
          if (channel) {
            const message = await channel.messages.fetch(
              giveaway.location.messageId
            );
            if (message) {
              let entries = message.reactions?.cache
                .get("🎉")
                ?.users?.cache?.filter((x) => !x.bot)
                .array();
              if (entries?.length) {
                let possibleWinners: string[] = entries.map((x) => x.id);

                if (giveaway?.requirements?.multipliers?.length) {
                  for (const multiplier of giveaway.requirements.multipliers) {
                    for (const user of entries) {
                      const member = await guild.members.fetch(user);
                      if (member?.roles?.cache?.has(multiplier.roleId)) {
                        for (let i = 0; i < multiplier.multiplier; i++) {
                          possibleWinners.push(user.id);
                        }
                      }
                    }
                  }
                }

                for (let i = 0; i < giveaway.winners; i++) {
                  const winner =
                    entries[Math.floor(Math.random() * entries.length)];
                  entries = entries.filter((x) => x !== winner);
                  giveawayWinners.push(winner);
                }

                await message.delete();
                if (giveawayWinners.length) {
                  await channel.send(
                    `${giveawayWinners.map((x) => x.toString()).join(", ")}`,
                    embeds.normal(
                      `Giveaway Ended`,
                      `🎁 **Prize** ${
                        giveaway.prize
                      }\n👥 **Winners** ${giveawayWinners
                        .map((x) => x.toString())
                        .join(", ")}`
                    )
                  );
                }
              } else {
                await message.delete();
                await channel.send(
                  embeds.normal(
                    `Giveaway Ended`,
                    `🎁 **Prize** ${giveaway.prize}\n👥 **Winners** Not enough people entered the giveaway!`
                  )
                );
              }
            }
          }
        }
      });
    }, 10e3);
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
          console.log(commandObj.cmdName);
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
        if (eventObj && eventObj.eventName) {
          this.addListener(eventObj.eventName, async (...args) =>
            eventObj.handle.bind(eventObj)(...args, eventObj.eventName)
          );
        }
      } catch (ignored) {}
    }
  }
}

new Client();
