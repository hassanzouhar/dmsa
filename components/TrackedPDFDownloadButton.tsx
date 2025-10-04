'use client';

import React from 'react';
import { PDFDownloadButton } from '@/lib/pdf-generator';
import { trackPDFDownload } from '@/lib/analytics';
import { SurveySubmission } from '@/types/assessment';

interface TrackedPDFDownloadButtonProps {
  surveyData: SurveySubmission;
  children: React.ReactNode;
  fileName?: string;
  className?: string;
}

export const TrackedPDFDownloadButton: React.FC<TrackedPDFDownloadButtonProps> = ({
  surveyData,
  children,
  fileName,
  className
}) => {
  const handleDownloadStart = async () => {
    // Track PDF download
    await trackPDFDownload(surveyData.id, !!surveyData.userDetails);
  };

  return (
    <div onClick={handleDownloadStart}>
      <PDFDownloadButton
        surveyData={surveyData}
        fileName={fileName}
        className={className}
      >
        {children}
      </PDFDownloadButton>
    </div>
  );
};