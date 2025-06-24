import {clsx, type ClassValue} from 'clsx';
import {twMerge} from 'tailwind-merge';
import z from 'zod';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const validateForm = <T>(schema: z.ZodSchema<T>, values: T) => {
  const result = schema.safeParse(values);
  if (!result.success) {
    return {success: false, errors: result.error.errors};
  }
  return {success: true, data: result.data};
};
