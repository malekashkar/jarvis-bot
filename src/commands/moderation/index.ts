import Command, { Groups, Permissions } from "..";

export default abstract class ModCommands extends Command {
  groupName: Groups = "moderation";
  permission = Permissions.ACCESS;
}
