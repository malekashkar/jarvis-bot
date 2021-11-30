import ModCommands from ".";
import { Message, Permissions } from "discord.js";
import embeds from "../../util/embed";

export default class PermsCommand extends ModCommands {
  cmdName = "perms";
  description = "Give or take a role from a user in a server.";
  permission = "ACCESS";

  async run(message: Message, args: string[]) {
    const option =
      args[0]?.toLowerCase() === "set"
        ? "set"
        : args[0]?.toLowerCase() === "remove"
        ? "remove"
        : null;
    if (!option)
      return message.channel.send({
        embeds: [embeds.error(`Please provide **set/remove** as your first argument!`)]
      });
    args.shift();

    const serverNumber = !isNaN(parseInt(args[0])) ? parseInt(args[0]) : null;
    if (!serverNumber)
      return message.channel.send({
        embeds: [
          embeds.error(
            `Please provide the server number you would like to alter permisisons in.`
          )
        ]
      });
    args.shift();

    const server = Array.from(this.client.guilds.cache.values())[serverNumber - 1];
    if (!server)
      return message.channel.send({
        embeds: [embeds.error(`There is no server with the provided number!`)]
      });

    const userId = args[0];
    if (!userId)
      return message.channel.send({
        embeds: [
          embeds.error(
            `Please provide the ID of the user you would like to alter permissions for.`
          )
        ]
      });
    args.shift();

    const member = await server.members.fetch(userId);
    if (!member)
      return message.channel.send({
        embeds: [embeds.error(`There is no member with that provided ID!`)]
      });

    const roleName = args[0];
    if (!roleName)
      return message.channel.send({
        embeds: [
          embeds.error(
            `Please provide the name of the role you would like to give the member.`
          )
        ]
      });
    args.shift();

    const role = server.roles.cache.find((x) => x.name === roleName);
    if (!role)
      return message.channel.send({
        embeds: [embeds.error(`There is no role with the provided name!`)]
      });
    else if (!server.me.permissions.has(Permissions.FLAGS.MANAGE_ROLES))
      return message.channel.send({
        embeds: [embeds.error(`I don't have permissions to manage roles in that server!`)]
      });

    if (option === "set") await member.roles.add(role);
    else await member.roles.remove(role);

    return message.channel.send({
      embeds: [
        embeds
        .normal(
          `Role` + option === "set" ? `Added` : `Removed`,
          `Role Name: ${role.name}`
        )
        .setThumbnail(member.user.avatarURL())
      ]
    });
  }
}
