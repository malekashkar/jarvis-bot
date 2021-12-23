import Command, { Groups, Permissions } from "..";

export default abstract class GiveawayCommands extends Command {
  groupName: Groups = "giveaways";
  permission = Permissions.ACCESS;
}
