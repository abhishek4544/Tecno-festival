import { z } from 'zod';

export const IMEI_LENGTH = 15;

// IMEI numbers end in a Luhn check digit, so this catches typos, not just length.
function isValidLuhn(value: string) {
  let sum = 0;

  for (let i = 0; i < value.length; i++) {
    let digit = Number(value[value.length - 1 - i]);

    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }

    sum += digit;
  }

  return sum % 10 === 0;
}

export const entryFormSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, { error: 'Full name is required', abort: true })
    .min(2, { error: 'Full name must be at least 2 characters' })
    .max(100, { error: 'Full name must be at most 100 characters' })
    .regex(/^[\p{L}\s.'-]+$/u, {
      error: 'Full name can only contain letters and spaces',
    }),
  mobileNumber: z
    .string()
    .trim()
    .min(1, { error: 'Mobile number is required', abort: true })
    .regex(/^9[678]\d{8}$/, {
      error: 'Enter a valid 10-digit mobile number',
    }),
  retailerStoreName: z
    .string()
    .trim()
    .min(1, { error: 'Retailer’s store name is required', abort: true })
    .max(100, { error: 'Store name must be at most 100 characters' }),
  retailerAddress: z
    .string()
    .min(1, { error: 'Please select the retailer’s address', abort: true }),
  imeiNumber: z
    .string()
    .trim()
    .min(1, { error: 'IMEI number is required', abort: true })
    .regex(/^\d+$/, { error: 'IMEI number can only contain digits' })
    .length(IMEI_LENGTH, {
      error: `IMEI number must be exactly ${IMEI_LENGTH} digits`,
    })
    .refine(isValidLuhn, { error: 'Enter a valid IMEI number' }),
  agreeToTerms: z.boolean().refine(Boolean, {
    error: 'You must agree to the Terms & Conditions',
  }),
});

export type EntryFormInput = z.input<typeof entryFormSchema>;
export type EntryFormValues = z.output<typeof entryFormSchema>;
