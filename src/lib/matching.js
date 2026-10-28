function shuffled(pairs, random) {
  const result = [...pairs];
  for (let index = result.length - 1; index > 0; index--) {
    const other = Math.min(index, Math.floor(random() * (index + 1)));
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}

export function shuffleAnswers(pairs, random = Math.random) {
  const result = shuffled(pairs, random);
  // Boshlanishida savollar va javoblar bir xil tartibda turmasin.
  if (result.length > 1 && result.every((pair, index) => pair.id === pairs[index].id)) result.push(result.shift());
  return result;
}

export function connectMatch(pairs, matched, questionId, answerId) {
  if (questionId !== answerId || matched.includes(questionId) || !pairs.some((pair) => pair.id === questionId)) return matched;
  return [...matched, questionId];
}

export function shuffleMatchingColumns(pairs, random = Math.random) {
  const questions = shuffled(pairs, random);
  const answers = shuffled(pairs, random);
  if (answers.length > 1 && answers.every((pair, index) => pair.id === questions[index].id)) answers.push(answers.shift());
  return { questions, answers };
}

export function connectionPath(from, to) {
  const bend = Math.max(24, Math.abs(to.x - from.x) * 0.5);
  return `M ${from.x} ${from.y} C ${from.x + bend} ${from.y}, ${to.x - bend} ${to.y}, ${to.x} ${to.y}`;
}
