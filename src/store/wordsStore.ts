import { Word } from "../types";

interface WordStore {
  saveWord(word:Word):void
  saveWords(words:Array<Word>):void
  getWord(id:string):Word|null
  getAllWords():Array<Word>
}

export class InMemoryWordStore implements WordStore {
  private words:Array<Word>;
  constructor() {
    this.words = new Array<Word>();
  }
  public saveWord(word: Word): void {
    this.words.push(word);
  }
  public saveWords(words: Word[]): void {
    this.words = this.words.concat(words);
  }
  public getWord(id: string): Word | null {
    return this.words.find(word => word.id === id) || null;
  }
  public getAllWords(): Word[] {
    return this.words;
  }
}