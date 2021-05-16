import { MessageEmbed } from "discord.js";
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
}
