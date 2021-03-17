import { DocumentType } from "@typegoose/typegoose";
import { Message } from "discord.js";
import FridayCommands from ".";
import Global from "../../models/global";
import { Guild, Roles } from "../../models/guild";
import User from "../../models/user";
import {
  getTaggedRole,
  getTaggedChannels,
  messageQuestion,
  confirmator,
} from "../../util/questions";
import ms from "ms";

export default class SetupCommand extends FridayCommands {
  cmdName = "setup";
  description = "Setup a role with friday on your discord server.";

  async run(
    message: Message,
    args: string[],
    userData: DocumentType<User>,
    globalData: DocumentType<Global>,
    guildData: DocumentType<Guild>
  ) {
    const role = await getTaggedRole(
      message,
      `Please tag the role you would like to setup.`
    );
    if (!role) return;

    const channels = await getTaggedChannels(
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

    const channelIds = channels.map((channel) => channel.id);
    const cooldownTime = ms(cooldownQuestion.content);
    guildData.roles.push(
      new Roles(role.id, channelIds, autorole, cooldownTime)
    );
    await guildData.save();

    channels.forEach(async (channel) => {
      await channel.updateOverwrite(role.id, {
        SEND_MESSAGES: true,
        VIEW_CHANNEL: true,
      });
    });
  }
}
