import Command, { Groups, Permissions } from "..";

export default abstract class AdminCommands extends Command {
  groupName: Groups = "administration";
  permission = Permissions.OWNER
}
