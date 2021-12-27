import { MessageEmbed, Role, HexColorString } from "discord.js";
import moment from "moment";
import ms from "ms";
import { RoleMultiplier } from "../models/giveaway";
import settings from "../settings";

export default class embeds {
  static image(image: string, color: HexColorString) {
    return new MessageEmbed().setImage(image).setColor(color);
  }

  static error(text: string) {
    return new MessageEmbed()
      .setTitle("Error Detected")
      .setDescription(text)
      .setColor("RED");
  }

  static normal(title: string, text: string) {
    const embed = new MessageEmbed().setColor(settings.color);
    if(title) embed.setTitle(title);
    if(text) embed.setDescription(text);
    return embed;
  }

  static question(text: string) {
    return new MessageEmbed()
      .setTitle(`Answer the question below`)
      .setFooter(`You have a total of 15 minutes to answer the question!`)
      .setDescription(text)
      .setColor(settings.color);
  }

  static lockdown(type: "GUILD" | "HERE") {
    return new MessageEmbed()
      .setTitle(`Operation Complete`)
      .setDescription(
        type == "GUILD"
          ? `The guild has been locked down.`
          : `The channel has been locked down.`
      )
      .setColor(settings.color);
  }

  static empty() {
    return new MessageEmbed().setColor(settings.color);
  }

  static guildCommand() {
    return this.error("You may only use this command in a guild!")
  }

  static giveaway(
    prize: string,
    cappedEntries: number,
    winners: number,
    timeLeft: number,
    messageRequirement: number = 0,
    roleRequirements: Role[] = [],
    roleMultipliers: RoleMultiplier[] = []
  ) {
    const cappedEntriesString = cappedEntries
      ? `📈 **Capped Entries** ${cappedEntries}\n`
      : ``;
    const endsString =
      timeLeft > 0
        ? `Ends in ${ms(timeLeft / 1000)}`
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
}
