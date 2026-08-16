/**
 * RecursiveCharacterTextSplitter
 * 
 * This does the same thing as LangChain's splitter, but in ~30 lines.
 * 
 * HOW IT WORKS:
 * 1. It tries to split the text using the FIRST separator (e.g. "\n\n" = paragraphs)
 * 2. If any piece is still too long, it tries the NEXT separator (e.g. "\n" = new lines)
 * 3. Then sentences (". "), then words (" "), and finally individual characters.
 * 
 * WHY "OVERLAP"?
 * When we cut a document, we don't want to lose context at the edges.
 * The overlap lets each chunk "peek" at the beginning of the next one.
 */

export function splitText(
  text: string,
  chunkSize: number = 1000,
  chunkOverlap: number = 200
): string[] {
  const separators = ["\n\n", "\n", ". ", " ", ""];
  return recursiveSplit(text, separators, chunkSize, chunkOverlap);
}

function recursiveSplit(
  text: string,
  separators: string[],
  chunkSize: number,
  chunkOverlap: number
): string[] {
  const chunks: string[] = [];

  // Base case: text is small enough — just return it!
  if (text.length <= chunkSize) {
    return [text.trim()].filter(t => t.length > 0);
  }

  // Pick the first separator that actually exists in the text
  let separator = separators[separators.length - 1]; // fallback to ""
  let nextSeparators = separators;
  for (let i = 0; i < separators.length; i++) {
    if (separators[i] === "" || text.includes(separators[i])) {
      separator = separators[i];
      nextSeparators = separators.slice(i + 1);
      break;
    }
  }

  // Split the text using our chosen separator
  const splits = separator ? text.split(separator) : text.split("");

  // Re-merge small splits into chunks of the right size
  let currentChunk = "";
  for (const piece of splits) {
    const combined = currentChunk
      ? currentChunk + separator + piece
      : piece;

    if (combined.length > chunkSize && currentChunk.length > 0) {
      // Current chunk is full — save it!
      chunks.push(currentChunk.trim());

      // Start the new chunk with "overlap" from the end of the old one
      const overlapText = currentChunk.slice(-chunkOverlap);
      
      // If the piece itself is too large, recursively split it
      if (piece.length > chunkSize) {
        const subChunks = recursiveSplit(piece, nextSeparators, chunkSize, chunkOverlap);
        chunks.push(...subChunks);
        currentChunk = "";
      } else {
        currentChunk = overlapText + separator + piece;
      }
    } else {
      currentChunk = combined;
    }
  }

  // Don't forget the last chunk!
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}
