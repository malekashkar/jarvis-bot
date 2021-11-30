import { Message, TextChannel } from "discord.js";
import Command, { Groups } from "..";
import { GiveawayModel, RoleMultiplier } from "../../models/giveaway";
import { parseToInteger } from "../../util";
import embeds from "../../util/embed";
import {
  messageQuestion,
  getTaggedChannels,
  getTaggedRolesOrCancel,
  messageQuestionOrCancel,
} from "../../util/questions";

export default class GiveawayCommand extends Command {
  groupName: Groups = "giveaways";
  cmdName = "giveaways";
  description =
    "Setup a giveaway for multiple winners and a prize and restrictions.";
  aliases = ["giveaway"];

  async run(message: Message) {
    const giveawaySettings = await this.giveawayCog(message);
    if(giveawaySettings.success) {
      const giveawayMessage = await giveawaySettings.channel?.send({
        embeds: [
          embeds.giveaway(
            giveawaySettings.prize,
            giveawaySettings.cappedEntries,
            giveawaySettings.winners,
            giveawaySettings.endsAt,
            giveawaySettings.messageRequirements,
            giveawaySettings.roleRequirements,
            giveawaySettings.roleMultipliers
          )
        ]
      });
      await giveawayMessage.react("🎉");
  
      await GiveawayModel.create({
        prize: giveawaySettings.prize,
        winners: giveawaySettings.winners,
        cappedEntries: giveawaySettings.cappedEntries,
        location: {
          guildId: message.guild.id,
          channelId: giveawaySettings.channel.id,
          messageId: giveawayMessage.id,
        },
        endsAt: giveawaySettings.endsAt,
        requirements: {
          messageRequirement: giveawaySettings.messageRequirements,
          roleRequirements: giveawaySettings.roleRequirements.map(x => x.id),
          multipliers: giveawaySettings.roleMultipliers,
          serverRequirements: giveawaySettings.serverRequirements,
        },
      });
    } else {
      message.channel.send({
        embeds: [embeds.error(giveawaySettings.error)]
      });
    }
  }

  async giveawayCog(message: Message) {
    const prizeQuestion = await messageQuestion(message, `What is the prize of the giveaway?`);
    if(!prizeQuestion.content) return { success: false, error: "Please provide a prize for the user!" };

    const winnersQuestion = await messageQuestion(message, `How many winners will the giveaway have?`);
    if(!winnersQuestion.content) return null;

    const channelsQuestion = await getTaggedChannels(message, `Tag the channel the giveaway should be located in.`);
    if(channelsQuestion.size == 0) return null;

    const cappedEntriesQuestion = await messageQuestion(message, `How many max entries can this giveaway have? (Enter 0 for unlimited)`);
    if(!cappedEntriesQuestion.content) return null;

    const unparsedTime = await messageQuestion(message, `How long should this giveaway last? (ex. 10m, 1h, 2d)`);
    if(!unparsedTime.content) return null;

    const messageRequirementQuestion = await messageQuestion(message, `How many messages must a user have to enter? (Enter 0 for no requirement)`);
    if(!messageRequirementQuestion.content) return null;

    const roleRequirementsQuestion = await getTaggedRolesOrCancel(message, `Please tag all the roles a user needs before entering a giveaway.`);
    if(roleRequirementsQuestion.size == 0) return null;
    
    const parsedTime = parseToInteger(unparsedTime.content);
    if(!parsedTime) return null;

    const roleMultiplierQuestion = await messageQuestionOrCancel(message, `Tag the roles that should have bonus entries/entry multipliers.\n\`Example: @role 2, @role2 6, @role3 3\``);
    const roleMultipliers = 
      roleMultiplierQuestion.content
        .split(",")
        .map((mult) => {
          const info = /<@&(\d+)> (\d+)/g.exec(mult);
          if (info?.length >= 3)
            return { roleId: info[1], multiplier: parseInt(info[2]) } as RoleMultiplier;
        })
        .filter(x => !!x)
      || []; // Might be able to remove this line depending on the map/filter return.

    // Server Join Requirements
    const linkRegex = new RegExp(/(https?:\/\/)?(www\.)?(discord\.(gg|io|me|li)|discordapp\.com\/invite)\/.+[a-z]/g);
    const serverLinksQuestion = await messageQuestionOrCancel(message, `Please enter the server(s) invite links with a space in between.`);
    const serverRequirements = serverLinksQuestion.content.split(" ").filter(link => linkRegex.test(link)) || [];

    return {
      success: true,
      prize: prizeQuestion.content,
      winners: parseInt(winnersQuestion.content),
      channel: channelsQuestion.first() as TextChannel,
      cappedEntries: parseInt(cappedEntriesQuestion.content),
      messageRequirements: parseInt(messageRequirementQuestion.content),
      roleRequirements: Array.from(roleRequirementsQuestion.values()),
      time: parsedTime,
      endsAt: new Date(Date.now() + parsedTime),
      roleMultipliers,
      serverRequirements
    }
  }
}
