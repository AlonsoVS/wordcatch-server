import { AttemptCount } from "../types";

export type WordPoints = {
  attemptsCount:number
  points:number
  wordId:string
}

const pointsCounter = (checkedAttempt:Array<AttemptCount>, maxAttempts:number) => {
  let attemptPoints = 0;
  const pointsPerWord = checkedAttempt.map(({count, successful, wordId}):WordPoints => {
    let points = 0;
    if (successful) {
      if (count === 1) {
        points = 2;
      } else if (count <= maxAttempts) {
        points = 1;
      }
      attemptPoints += points;
    }
    return {
      attemptsCount: count,
      points,
      wordId
    }
  });

  return { attemptPoints, pointsPerWord };
}

export default pointsCounter;