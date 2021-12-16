import UtilityCommands from ".";
import { MessageEmbed, GuildMember, CommandInteraction} from "discord.js";
import { emojis } from "../../util";
import { SlashCommandBuilder } from "@discordjs/builders";
import { optionReactionQuestion } from "../../util/questions";

export default class GuildCommand extends UtilityCommands {
  slashCommand = new SlashCommandBuilder()
    .setName("guild")
    .setDescription("Get a list of all guilds or check a specific one.");

  disabled = true;
  permission = "ACCESS";

  async run(interaction: CommandInteraction) {
    const guilds = Array.from(this.client.guilds.cache.values());
    const guildEmojis = emojis.slice(0, guilds.length);

    const guildsFormattedText = guilds
      .map((x, i) => `${guildEmojis[i]} **${x.name}**`)
      .join("\n");

    const guildEmoji = await optionReactionQuestion(
      interaction,
      "Which guild would you like to check?\n\n" + guildsFormattedText,
      guildEmojis
    );
    
    if(guildEmoji) {
      const guild = guilds[guildEmojis.indexOf(guildEmoji)];
      const invite = await guild.invites.create(guild.channels.cache.first().id);
  
      const members = await guild.members.fetch();
      const onlineMemberCount = members.filter(
        (m) => m.presence.status === "online"
      ).size;
      const botsMemberCount = members.filter((member: GuildMember) => member.user.bot).size;
  
      interaction.editReply({
        embeds: [
          new MessageEmbed()
          .setTitle(guild.name + ` Guild Info`)
          .setThumbnail(guild.iconURL())
          .addField("Total Members", members.size + " Members", true)
          .addField("Online Members", onlineMemberCount + " Members", true)
          .addField("Bots", botsMemberCount + " Bots", true)
          .addField(`Guild Invite`, invite.url, true)
        ]
      });
    }
  }
}
