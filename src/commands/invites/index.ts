import Command, { Groups, Permissions } from "..";

export default abstract class InviteCommands extends Command {
  groupName: Groups = "invites";
  permission = Permissions.ACCESS;
}
