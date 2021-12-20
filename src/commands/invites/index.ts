import Command, { Groups } from "..";

export default abstract class InviteCommands extends Command {
  groupName: Groups = "invites";
}
