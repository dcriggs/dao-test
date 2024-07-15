function parseRevertReason(errorMessage) {
  const regex = /reverted with reason string '([^']+)'/;
  const match = errorMessage.match(regex);

  if (match && match[1]) {
    return match[1];
  } else {
    return errorMessage;
  }
}

export default parseRevertReason;