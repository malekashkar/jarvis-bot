import { DocumentType } from "@typegoose/typegoose";
import { Message, TextChannel, Permissions } from "discord.js";
import FridayCommands from ".";
import Global from "../../models/global";
import { Guild, Roles } from "../../models/guild";
import User from "../../models/user";
import {
  getTaggedRoles,
  messageQuestion,
  confirmator,
} from "../../util/questions";
import ms from "ms";
import embeds from "../../util/embed";

export default class SetupCommand extends FridayCommands {
  cmdName = "setup";
  description = "Setup a role with friday on your discord server.";

  async run(
    message: Message,
    _args: string[],
    _userData: DocumentType<User>,
    _globalData: DocumentType<Global>,
    guildData: DocumentType<Guild>
  ) {
    const roles = await getTaggedRoles(
      message,
      `Please tag the role you would like to setup.`
    );
    if (!roles) return;

    const channels = await getNumberedChannels(
      message,
      `What channels would you like this role to have access to?`
    );
    if (!channels) return;

    const cooldownQuestion = await messageQuestion(
      message,
      `How long should the interval be between every ad this role can post?`
    );
    if (!cooldownQuestion) return;

    const autorole = await confirmator(
      message,
      `Would you like this role to be an autorole for when members join?`
    );

    const role = roles.first();
    const channelIds = channels.map((channel) => channel.id);
    const cooldownTime = ms(cooldownQuestion.content);
    guildData.roles.push(
      new Roles(role.id, channelIds, autorole, cooldownTime)
    );
    await guildData.save();

    channels.forEach(async (channel: TextChannel) => {
      await channel.permissionOverwrites.set(
        [{
          id: role.id,
          allow: [Permissions.FLAGS.SEND_MESSAGES, Permissions.FLAGS.VIEW_CHANNEL]
        }]
      );
    });
  }
}

export async function getNumberedChannels(
  message: Message,
  question: string,
  userId?: string
) {
  const reactionUserId = userId || message.author.id;
  const questionMessage = await message.channel.send({ embeds: [embeds.question(question)] });

  const filter = (message: Message) => message.author.id == reactionUserId;
  const messageCollector = await message.channel.awaitMessages(
    { filter, max: 1, time: 900000, errors: ["time"] }
  );

  if (questionMessage.deletable) await questionMessage.delete();
  if (messageCollector.first().deletable)
    await messageCollector.first().delete();

  return messageCollector.first().mentions.channels;
}
