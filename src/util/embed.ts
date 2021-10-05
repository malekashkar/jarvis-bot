import { DocumentType } from "@typegoose/typegoose";
import { MessageEmbed, Role } from "discord.js";
import moment from "moment";
import { Giveaway, RoleMultiplier } from "../models/giveaway";
import settings from "../settings";

export default class embeds {
  static image(image: string, color: string) {
    return new MessageEmbed().setImage(image).setColor(color);
  }

  static error(text: string) {
    return new MessageEmbed()
      .setTitle("Error Detected")
      .setDescription(text)
      .setColor("RED");
  }

  static normal(title: string, text: string) {
    return new MessageEmbed()
      .setTitle(title)
      .setDescription(text)
      .setColor(settings.color);
  }

  static question(text: string) {
    return new MessageEmbed()
      .setTitle(`Answer the question below`)
      .setFooter(`You have a total of 15 minutes to answer the question!`)
      .setDescription(text)
      .setColor(settings.color);
  }

  static lockdown(type: "SERVER" | "HERE") {
    return new MessageEmbed()
      .setTitle(`Operation Complete`)
      .setDescription(
        type === "SERVER"
          ? `The server has been locked down.`
          : `The channel has been locked down.`
      )
      .setColor(settings.color);
  }

  static empty() {
    return new MessageEmbed().setColor(settings.color);
  }

  static giveaway(
    prize: string,
    cappedEntries: number,
    winners: number,
    endsAt: Date,
    messageRequirement: number = 0,
    roleRequirements: Role[] = [],
    roleMultipliers: RoleMultiplier[] = []
  ) {
    const cappedEntriesString = cappedEntries
      ? `📈 **Capped Entries** ${cappedEntries}\n`
      : ``;
    const endsString =
      endsAt.getTime() > Date.now()
        ? `Ends ${moment(endsAt).fromNow()}`
        : `The giveaway has ended`;
    const giveawayEmbed = embeds
      .empty()
      .addField(
        `Information`,
        `🎁 **Prize** ${prize}\n${cappedEntriesString}👥 **Winners** ${winners}\n📅 **${endsString}**`,
        true
      );

    if (messageRequirement || roleRequirements.length) {
      giveawayEmbed.addField(
        `Requirements`,
        `${
          messageRequirement
            ? `💬 **Message Requirement** ${messageRequirement}\n`
            : ``
        }${
          roleRequirements.length
            ? `⚙️ **Role Requirements** ${roleRequirements.map((x) =>
                x.toString()
              )}`
            : ``
        }`,
        true
      );
    }

    if (roleMultipliers.length) {
      giveawayEmbed.addField(
        `Bonus Entries`,
        `${roleMultipliers
          .map((x, i) => `${i + 1}. <@&${x.roleId}> - ${x.multiplier}x`)
          .join("\n")}`,
        true
      );
    }

    return giveawayEmbed;
  }

  // static giveawayRaw()
}
