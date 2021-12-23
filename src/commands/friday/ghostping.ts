import Global from "../../models/global";
import { GhostPing, Guild } from "../../models/guild";
import User from "../../models/user";
import FridayCommands from ".";
import { DocumentType } from "@typegoose/typegoose";
import { CommandInteraction } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import ms from "ms";
import { parseToInteger } from "../../util";
import embeds from "../../util/embed";

export default class ListCommand extends FridayCommands {
  slashCommand = new SlashCommandBuilder()
    .setName("ghostping")
    .setDescription("Start the ghostping system for a giveaway.")
    .addSubcommand(sub => 
        sub.setName("member").setDescription("Ghost ping members that join the discord for a giveaway."))
    .addSubcommand(sub =>
        sub.setName("interval")
            .setDescription("Ghost ping on a set interval.")
            .addStringOption(opt =>
                opt.setName("type").setDescription("Ping @here or @everyone everytime the interval hits.")
                    .addChoice("everyone", "@everyone").setRequired(true)
                    .addChoice("here", "@here").setRequired(true))
            .addStringOption(opt =>
                opt.setName("interval")
                    .setDescription("The time in between every ghost ping. (ex. 10m, 1h, 2d)")))

  async run(
    interaction: CommandInteraction,
    _userData: DocumentType<User>,
    _globalData: DocumentType<Global>,
    guildData: DocumentType<Guild>
  ) {
    const subcommand = interaction.options.getSubcommand(true);
    if(subcommand == "member") {
        guildData.ghostPing = new GhostPing("MEMBER");
        await guildData.save();
    } else if(subcommand == "interval") {
        const type = interaction.options.getString("type");
        const interval = interaction.options.getString("interval");

        const parsedInt = parseToInteger(interval);
        if(parsedInt) {
            guildData.ghostPing = new GhostPing(type == "everyone" ? "EVERYONE" : "HERE", parsedInt, Date.now() + parsedInt);
            await guildData.save();
        } else {
            return interaction.reply({
                embeds: [embeds.error("Please provide a valid interval time! (ex. 10m, 1h, 2d)")]
            });
        }
    }
  }
}
