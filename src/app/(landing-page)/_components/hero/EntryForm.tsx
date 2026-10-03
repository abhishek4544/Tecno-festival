'use client';

import { useState } from 'react';
import Link from 'next/link';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';

import EntrySuccessModal from './EntrySuccessModal';
import Button from '@/components/ui/buttons/Button';
import Checkbox from '@/components/ui/inputs/Checkbox';
import Dropdown from '@/components/ui/inputs/Dropdown';
import FormField, { getErrorId } from '@/components/ui/inputs/FormField';
import TextField from '@/components/ui/inputs/TextField';

import { TERMS_AND_CONDITIONS_PAGE } from '@/constants';
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

// TODO: replace with the API's result. Random until then so every outcome
// (each prize, or no win) can be previewed.
function mockPrize(): ScratchPrize | null {
  const roll = Math.floor(Math.random() * (scratchPrizes.length + 1));
  return scratchPrizes[roll] ?? null;
}

export default function EntryForm() {
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [prize, setPrize] = useState<ScratchPrize | null>(null);
  // Remounts the modal per entry so each one gets a fresh scratch card.
  const [submissionCount, setSubmissionCount] = useState(0);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<EntryFormInput, unknown, EntryFormValues>({
    resolver: zodResolver(entryFormSchema),
    defaultValues,
  });

  const imeiNumber = useWatch({ control, name: 'imeiNumber' });

  // TODO: send `values` to the API and only open the modal once it's saved.
  function onSubmit(values: EntryFormValues) {
    void values;
    setPrize(mockPrize());
    setSubmissionCount((count) => count + 1);
    setIsSuccessOpen(true);
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
              <Link
                href={TERMS_AND_CONDITIONS_PAGE}
                className="text-slate-950 underline"
              >
                Terms &amp; Conditions
              </Link>
            </span>
          }
          {...register('agreeToTerms')}
        />

        <Button
          type="submit"
          variant="gold"
          size="md"
          disabled={isSubmitting}
          className="w-full"
        >
          Submit Details
        </Button>
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
