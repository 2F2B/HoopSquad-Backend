export class TeamNotFoundError extends Error {
  statusCode!: number;
  constructor() {
    super("No Team Exist");
    this.name = "TeamNotFoundError";
    this.statusCode = 404;
  }
}
