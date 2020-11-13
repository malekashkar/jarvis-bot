import ModCommands from ".";
import { Message } from "discord.js";
import { messageQuestion } from "../../util/questions";
import embeds from "../../util/embed";

export default class PermsCommand extends ModCommands {
  cmdName = "perms";
  description = "Give or take a role from a user in a server.";
  permission = "ACCESS";

  async run(message: Message) {
    const typeQuestion = await messageQuestion(
      message,
      `Would you like to **set** or **remove** a permission?`,
      message.author.id,
      ["set", "remove"]
    );
    if (!typeQuestion) return;

    const option = typeQuestion.content;

    const serverQuestion = await message.channel.send(
      embeds.question(`What is the number of the server?`)
    );
    const serverResponse = await message.channel.awaitMessages(
      (x) =>
        x.author.id === message.author.id &&
        parseInt(x.content) <= this.client.guilds.cache.size,
      { max: 1, time: 900000, errors: ["time"] }
    );

    if (serverQuestion.deletable) serverQuestion.delete();
    if (serverResponse) serverResponse.first().delete();
    const server = this.client.guilds.cache.get(
      this.client.guilds.cache.array()[
        parseInt(serverResponse.first().content) - 1
      ].id
    );
    if (!server)
      return message.channel.send(
        embeds.error(`There is no server with the provided number!`)
      );

    const userId = await messageQuestion(
      message,
      `What is the ID of the discord user?`
    );
    if (!userId) return;

    const member = server.members.cache.get(userId.content);
    if (!member)
      return message.channel.send(
        embeds.error(`There is no member with that provided ID!`)
      );

    const roleName = await messageQuestion(
      message,
      `What is the name of the role you would like to use?`
    );
    if (!roleName) return;

    const role = server.roles.cache.find((x) => x.name === roleName.content);
    if (!role)
      return message.channel.send(
        embeds.error(`There is no role with the provided name!`)
      );
    else if (!server.me.hasPermission("MANAGE_ROLES"))
      return message.channel.send(
        embeds.error(`I don't have permissions to manage roles in that server!`)
      );

    if (option === "set") member.roles.add(role);
    else member.roles.remove(role);

    message.channel.send(
      embeds
        .normal(
          `Role ${option === "set" ? `Added` : `Removed`}`,
          `Role Name: ${role.name}`
        )
        .setThumbnail(member.user.avatarURL())
    );
  }
}
