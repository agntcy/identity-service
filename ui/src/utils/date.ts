export const safeGetDate = (date?: string | number | Date | null): null | Date => {
  if (!date) {
    return null;
  }

  try {
    const result = new Date(date);
    // https://stackoverflow.com/a/1353711/14552714
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const isValid = result instanceof Date && !isNaN(result as any);
    if (!isValid) {
      return null;
    }
    return result;
  } catch {
    return null;
  }
};