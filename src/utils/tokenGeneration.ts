export function generateConfirmationLink(): string {
  const subString = () => Math.random().toString(36).substring(2);
  return subString() + subString();
};

export function generateRecoveryCode(): string {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return (array[0] % 1000000).toString().padStart(6, '0');
}