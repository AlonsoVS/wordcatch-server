import { Word, AttemptCount } from "../types";

const attemptChecker = (
  wordsAttempt:Array<Word>,
  selectedWords:Array<Word>,
  prevAttempts:Array<AttemptCount>
  ):Array<AttemptCount> => {
  return wordsAttempt.map((word):AttemptCount => ({
    count: (prevAttempts.find(({wordId}) => wordId === word.id)?.count || 0) + 1,
    successful: selectedWords.find(({id}) => id === word.id)?.word === word.word,
    wordId: word.id
  }));
}

export default attemptChecker;