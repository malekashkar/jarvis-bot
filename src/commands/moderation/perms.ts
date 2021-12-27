import ModCommands from ".";
import { CommandInteraction, Permissions } from "discord.js";
import embeds from "../../util/embed";
import { SlashCommandBuilder } from "@discordjs/builders";

export default class PermsCommand extends ModCommands {
  slashCommand = new SlashCommandBuilder()
    .setName("perms")
    .setDescription("Give or take a role from a user in a guild.")
    .addStringOption(sub =>
      sub.setName("perm type").setDescription("The type of permission").setRequired(true)
        .addChoice("Set", "set")
        .addChoice("Remove", "remove"))
    .addStringOption(sub =>
      sub.setName("guild id").setDescription("The guild ID").setRequired(true))
    .addStringOption(sub =>
      sub.setName("user id").setDescription("The ID of the user").setRequired(true))
    .addStringOption(sub =>
      sub.setName("role name").setDescription("The exact name of the role").setRequired(true));

  async run(interaction: CommandInteraction) {
    const type = interaction.options.getString("perm type");
    const guildId = interaction.options.getString("guild id");
    const userId = interaction.options.getString("user id");
    const roleName = interaction.options.getString("role name");

    const guild = await this.client.guilds.fetch(guildId);
    if(!guild) return interaction.reply({
      embeds: [embeds.error("I could not find the guild you are looking for with the ID!")]
    });

    const member = await guild.members.fetch(userId);
    if(!member) return interaction.reply({
      embeds: [embeds.error("Could not find specified member with the ID in the guild!")]
    });

    const role = guild.roles.cache.find((x) => x.name == roleName);
    if(!role) return interaction.reply({
      embeds: [embeds.error(`There doesn't seem to be a role with the name \`${roleName}\``)]
    });

    if (!guild.me.permissions.has(Permissions.FLAGS.MANAGE_ROLES))
      return interaction.reply({
        embeds: [embeds.error(`I don't have permissions to manage roles in that guild!`)]
      });

    if (type == "set") await member.roles.add(role);
    else await member.roles.remove(role);

    return interaction.reply({
      embeds: [
        embeds
        .normal(
          `Role` + type == "set" ? `Added` : `Removed`,
          `Role Name: ${role.name}`
        )
        .setThumbnail(member.user.avatarURL())
      ]
    });
  }
}
