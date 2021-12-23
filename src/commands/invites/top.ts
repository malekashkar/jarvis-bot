import { CommandInteraction } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { InviteModel } from "../../models/invite";
import Paginator from "../../util/paginator";
import embeds from "../../util/embed";
import _ from "lodash";
import InviteCommands from ".";

export default class InvitesTopCommand extends InviteCommands {
  slashCommand = new SlashCommandBuilder()
    .setName("top")
    .setDescription("Check the leaderboard for invites in your guild.");

  async run(interaction: CommandInteraction) {
    const invites = await InviteModel.aggregate([
        { $match: { guildId: interaction.guildId } },
        { 
            $project: {
                inviterId: 1,
                fakeCount: { $cond: ["$left", 1, 0] }, // will be 1 for fake invites, 0 for valid
                validCount: { $cond: ["$left", 0, 1] } // will be 0 for fake invites, 1 for valid
                // add other fields if you need them in the result
            }
        },
        {
            $group: { 
                _id: "$inviterId",
                fakeCount: { $sum: "$fakeCount" }, // adds 1 to fakeCount if it's a fake invite, 0 otherwise
                validCount: { $sum: "$validCount" } // adds 1 to validCount if it's a valid invite, 0 otherwise
            },
        },
        { $sort: { validCount: -1 } },
    ]);

    const chunks = _.chunk(invites, 10);
    new Paginator(
        interaction, 
        Math.ceil(chunks.length),
        async(pageIndex: number) => {
            const formatted = (await Promise.all(
                chunks[pageIndex].map(async(inviteInfo, i) => {
                    const userIndex = (pageIndex * 10) + (i + 1);
                    const user = await this.client.users.fetch(inviteInfo._id);
                    if(user) return `${userIndex}. **${user.username.slice(0, 15)}** | ${inviteInfo.validCount} invites${inviteInfo.fakeCount ? ` (${inviteInfo.fakeCount} Leaves)` : ``}`;
                })
            )).filter(x => !!x);

            return embeds.normal("Invites Leaderboard | Page CURRENT_PAGE", formatted.join("\n"));
        }
    ).start();
  }
}
