import { ErrorWithStatusCode } from "../ErrorHandler";

export class SortNotFoundError extends ErrorWithStatusCode {
  statusCode: number = 400;
  constructor() {
    super("Sort Not Found");
    this.name = "SortNotFoundError";
  }
}
export class LocationNotFoundError extends ErrorWithStatusCode {
  statusCode: number = 400;
  constructor() {
    super("Location Not Found");
    this.name = "LocationNotFoundError";
  }
}
export class GameTypeNotFoundError extends ErrorWithStatusCode {
  statusCode: number = 400;
  constructor() {
    super("GameType Not Found");
    this.name = "GameTypeNotFoundError";
  }
}

export class UserNotFoundError extends ErrorWithStatusCode {
  statusCode: number = 400;
  constructor() {
    super("User Not Found");
    this.name = "UserNotFoundError";
  }
}

export class Posting_idNotFoundError extends ErrorWithStatusCode {
  statusCode: number = 400;
  constructor() {
    super("Posting_id Not Found");
    this.name = "Posting_idNotFoundError";
  }
}
export class PostingNotFoundError extends ErrorWithStatusCode {
  statusCode: number = 404;
  constructor() {
    super("Posting Not Found");
    this.name = "PostingNotFoundError";
  }
}
export class UserNotWriterError extends ErrorWithStatusCode {
  statusCode: number = 401;
  constructor() {
    super("User Not Writer");
    this.name = "UserNotWriterError";
  }
}
export class idNotFoundError extends ErrorWithStatusCode {
  statusCode: number = 404;
  constructor() {
    super("id Not Found");
    this.name = "idNotFoundError";
  }
}
