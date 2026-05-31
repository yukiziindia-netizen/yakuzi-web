'use client';

import { useMutation } from '@tanstack/react-query';
import { uploadPaymentProofFile, uploadKycDocument, uploadDrugLicense } from '@yukizi/api-client';

export function useUploadPaymentProofFile() {
  return useMutation({
    mutationFn: (file: File) => uploadPaymentProofFile(file),
  });
}

export function useUploadKycDocument() {
  return useMutation({
    mutationFn: (file: File) => uploadKycDocument(file),
  });
}

export function useUploadDrugLicense() {
  return useMutation({
    mutationFn: (file: File) => uploadDrugLicense(file),
  });
}
