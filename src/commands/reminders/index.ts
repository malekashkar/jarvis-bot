import Command, { Groups, Permissions } from "..";

export default abstract class ReminderCommands extends Command {
  groupName: Groups = "reminders";
  permission = Permissions.ACCESS;
}
