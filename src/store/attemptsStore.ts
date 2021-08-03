import { AttemptCount } from "../types";

interface AttemptStore {
  saveAttempt(attempt:AttemptCount):void
  saveAttempts(attempts:Array<AttemptCount>):void
  getAttempt(wordId:string):AttemptCount|null
  getAllAttempts():Array<AttemptCount>
}

export class InMemoryAttemptStore implements AttemptStore {
  private attempts: Array<AttemptCount>;
  public constructor() {
    this.attempts = new Array<AttemptCount>();
  }
  saveAttempt(attempt: AttemptCount): void {
    this.attempts.push(attempt);
  }
  saveAttempts(attempts: AttemptCount[]): void {
    this.attempts = this.attempts.concat(attempts);
  }
  getAttempt(wordId: string): AttemptCount | null {
    return this.attempts.find(attempt => attempt.wordId === wordId) || null;
  }
  getAllAttempts(): AttemptCount[] {
    return this.attempts;
  }
}