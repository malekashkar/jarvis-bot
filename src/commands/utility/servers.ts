import UtilityCommands from ".";
import { MessageEmbed, GuildMember, CommandInteraction} from "discord.js";
import embeds from "../../util/embed";
import { emojis } from "../../util";
import { SlashCommandBuilder } from "@discordjs/builders";

export default class serverCommand extends UtilityCommands {
  slashCommand = new SlashCommandBuilder()
    .setName("server")
    .setDescription("Get a list of all servers or check a specific one.");

  disabled = true;
  aliases = ["server", "guilds"];
  permission = "ACCESS";

  async run(interaction: CommandInteraction) {
    const guilds = Array.from(this.client.guilds.cache.values());
    const guildEmojis = emojis.slice(0, guilds.length);

    const guildsFormattedText = guilds
      .map((x, i) => `${guildEmojis[i]} **${x.name}**`)
      .join("\n");

    const msg = await interaction.channel.send({
      embeds: [embeds.normal(`List of Servers`, guildsFormattedText)]
    });
    for (const emoji of guildEmojis) {
      await msg.react(emoji);
    }

    const reaction = await msg.awaitReactions({
      filter: (r, u) =>
        u.id === interaction.user.id && guildEmojis.includes(r.emoji.name),
      max: 1,
      time: 900 * 1000,
      errors: ["time"]
    });
    if (!reaction) return;

    const reactedEmoji = reaction.first().emoji.name;
    const guild = guilds[guildEmojis.indexOf(reactedEmoji)];
    const invite = await guild.invites.create(guild.channels.cache.first().id);

    const members = await guild.members.fetch();
    const onlineMemberCount = members.filter(
      (m) => m.presence.status === "online"
    ).size;
    const botsMemberCount = members.filter((member: GuildMember) => member.user.bot).size;

    await interaction.reply({
      embeds: [
        new MessageEmbed()
        .setTitle(guild.name + ` Server Info`)
        .setThumbnail(guild.iconURL())
        .addField("Total Members", members.size + " Members", true)
        .addField("Online Members", onlineMemberCount + " Members", true)
        .addField("Bots", botsMemberCount + " Bots", true)
        .addField(`Guild Invite`, invite.url, true)
      ]
    });
  }
}
