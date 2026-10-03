'use client';

import { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';

import { submitEntry } from '../../actions';
import EntrySuccessModal from './EntrySuccessModal';
import Button from '@/components/ui/buttons/Button';
import Checkbox from '@/components/ui/inputs/Checkbox';
import Dropdown from '@/components/ui/inputs/Dropdown';
import FormField, { getErrorId } from '@/components/ui/inputs/FormField';
import TextField from '@/components/ui/inputs/TextField';

import { externalLink } from '@/constants';
import {
  entryFormSchema,
  IMEI_LENGTH,
  type EntryFormInput,
  type EntryFormValues,
} from '@/schemas';
import {
  retailerAddresses,
  scratchPrizes,
  type ScratchPrize,
} from '../../_data';

const defaultValues: EntryFormInput = {
  fullName: '',
  mobileNumber: '',
  retailerStoreName: '',
  retailerAddress: '',
  imeiNumber: '',
  agreeToTerms: false,
};

export default function EntryForm() {
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [prize, setPrize] = useState<ScratchPrize | null>(null);
  // Remounts the modal per entry so each one gets a fresh scratch card.
  const [submissionCount, setSubmissionCount] = useState(0);

  const {
    register,
    handleSubmit,
    control,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EntryFormInput, unknown, EntryFormValues>({
    resolver: zodResolver(entryFormSchema),
    defaultValues,
  });

  const imeiNumber = useWatch({ control, name: 'imeiNumber' });

  async function onSubmit(values: EntryFormValues) {
    let result: Awaited<ReturnType<typeof submitEntry>>;

    try {
      result = await submitEntry(values);
    } catch {
      setError('root', {
        message: 'Could not reach the server. Please try again.',
      });
      return;
    }

    if (!result.ok) {
      for (const [field, message] of Object.entries(result.fieldErrors ?? {})) {
        setError(
          field as keyof EntryFormInput,
          { message },
          { shouldFocus: true },
        );
      }
      if (result.message) setError('root', { message: result.message });
      return;
    }

    setPrize(scratchPrizes.find((p) => p.kind === result.prize) ?? null);
    setSubmissionCount((count) => count + 1);
    setIsSuccessOpen(true);
    reset();
  }

  // aria-invalid / aria-describedby for a field, based on its current error.
  function errorProps(name: keyof EntryFormInput) {
    return errors[name]
      ? { 'aria-invalid': true, 'aria-describedby': getErrorId(name) }
      : {};
  }

  return (
    <>
      <form
        noValidate
        onSubmit={handleSubmit(onSubmit)}
        className="campaign-entry-form flex w-full flex-col gap-6 md:gap-4"
      >
        <div className="flex flex-col gap-4 md:gap-3.5">
          <div className="grid grid-cols-1 gap-x-2 gap-y-4 md:grid-cols-2 md:gap-y-3.5">
            <FormField
              label="Full Name"
              htmlFor="fullName"
              error={errors.fullName?.message}
            >
              <TextField
                id="fullName"
                placeholder="Enter your full name"
                autoComplete="name"
                {...errorProps('fullName')}
                {...register('fullName')}
              />
            </FormField>
            <FormField
              label="Mobile Number"
              htmlFor="mobileNumber"
              error={errors.mobileNumber?.message}
            >
              <TextField
                id="mobileNumber"
                type="tel"
                placeholder="Enter mobile number"
                inputMode="numeric"
                autoComplete="tel-national"
                maxLength={10}
                {...errorProps('mobileNumber')}
                {...register('mobileNumber')}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 gap-x-2 gap-y-4 md:grid-cols-2 md:gap-y-3.5">
            <FormField
              label="Retailer’s Store Name"
              htmlFor="retailerStoreName"
              error={errors.retailerStoreName?.message}
            >
              <TextField
                id="retailerStoreName"
                placeholder="Enter store name"
                {...errorProps('retailerStoreName')}
                {...register('retailerStoreName')}
              />
            </FormField>
            <FormField
              label="Retailer’s Address"
              htmlFor="retailerAddress"
              error={errors.retailerAddress?.message}
            >
              <Dropdown
                id="retailerAddress"
                placeholder="Select address"
                options={retailerAddresses}
                {...errorProps('retailerAddress')}
                {...register('retailerAddress')}
              />
            </FormField>
          </div>

          <FormField
            label="IMEI Number"
            htmlFor="imeiNumber"
            error={errors.imeiNumber?.message}
          >
            <div className="relative">
              <TextField
                id="imeiNumber"
                placeholder="Enter IMEI number"
                inputMode="numeric"
                maxLength={IMEI_LENGTH}
                aria-invalid={errors.imeiNumber ? true : undefined}
                aria-describedby={
                  errors.imeiNumber
                    ? `imeiNumber-count ${getErrorId('imeiNumber')}`
                    : 'imeiNumber-count'
                }
                className="pr-14"
                {...register('imeiNumber')}
              />
              <span
                id="imeiNumber-count"
                className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-caption-1-desktop-md leading-none text-slate-400"
              >
                {imeiNumber.length}/{IMEI_LENGTH}
              </span>
            </div>
          </FormField>
        </div>

        <Checkbox
          error={errors.agreeToTerms?.message}
          label={
            <span className="text-slate-800">
              I have read and agree to the{' '}
              <a
                href={externalLink.termsOfUse}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-950 underline"
              >
                Terms &amp; Conditions
              </a>
            </span>
          }
          {...register('agreeToTerms')}
        />

        <div className="flex flex-col gap-2">
          <Button
            type="submit"
            variant="gold"
            size="md"
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? 'Submitting…' : 'Submit Details'}
          </Button>
          {errors.root && (
            <p
              role="alert"
              className="text-center text-caption-1-desktop text-red-600"
            >
              {errors.root.message}
            </p>
          )}
        </div>
      </form>

      <EntrySuccessModal
        key={submissionCount}
        open={isSuccessOpen}
        onClose={() => setIsSuccessOpen(false)}
        prize={prize}
      />
    </>
  );
}
