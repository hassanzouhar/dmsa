import React from 'react';
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink } from '@react-pdf/renderer';
import { SurveySubmission } from '@/types/assessment';

// Register fonts for better typography (optional)
// Font.register({
//   family: 'Inter',
//   src: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
// });

// Define styles for the PDF
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 40,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 30,
    borderBottomWidth: 2,
    borderBottomColor: '#3B82F6',
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1E40AF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  assessmentId: {
    fontSize: 10,
    color: '#9CA3AF',
    fontFamily: 'Courier',
  },
  section: {
    margin: '20 0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 4,
  },
  overallScore: {
    backgroundColor: '#F0F9FF',
    padding: 20,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  scoreNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#3B82F6',
    textAlign: 'center',
    marginBottom: 8,
  },
  maturityLevel: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#1E40AF',
    marginBottom: 8,
  },
  dimensionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  dimensionCard: {
    width: '48%',
    backgroundColor: '#F9FAFB',
    padding: 15,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 10,
  },
  dimensionName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 8,
  },
  dimensionScore: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3B82F6',
    marginBottom: 4,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 3,
  },
  gapText: {
    fontSize: 10,
    color: '#F59E0B',
    marginTop: 4,
  },
  companyInfo: {
    backgroundColor: '#F8FAFC',
    padding: 15,
    borderRadius: 6,
    marginBottom: 20,
  },
  companyTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  companyDetails: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 3,
  },
  recommendations: {
    marginTop: 20,
  },
  recommendationItem: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  bullet: {
    fontSize: 12,
    color: '#3B82F6',
    marginRight: 8,
    marginTop: 2,
  },
  recommendationText: {
    fontSize: 11,
    color: '#374151',
    flex: 1,
    lineHeight: 1.4,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 10,
    color: '#9CA3AF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 15,
  },
  pageNumber: {
    position: 'absolute',
    bottom: 30,
    right: 40,
    fontSize: 10,
    color: '#9CA3AF',
  },
});

interface PDFReportProps {
  surveyData: SurveySubmission;
}

// Helper function to get maturity level color
const getMaturityColor = (level: number): string => {
  if (level >= 4) return '#10B981'; // green
  if (level >= 3) return '#3B82F6'; // blue
  if (level >= 2) return '#F59E0B'; // amber
  return '#EF4444'; // red
};

// Helper function to get recommendations based on scores
const getRecommendations = (surveyData: SurveySubmission): string[] => {
  const recommendations: string[] = [];
  const { dimensions, overall } = surveyData.scores;
  
  // Overall recommendations
  if (overall < 40) {
    recommendations.push("Focus on building foundational digital capabilities across all dimensions");
    recommendations.push("Prioritize digital strategy development and stakeholder buy-in");
  } else if (overall < 70) {
    recommendations.push("Strengthen integration between digital initiatives and business strategy");
    recommendations.push("Invest in employee digital skills and change management");
  } else {
    recommendations.push("Leverage your strong foundation to drive innovation and competitive advantage");
    recommendations.push("Consider becoming a digital maturity benchmark for your sector");
  }

  // Dimension-specific recommendations
  Object.entries(dimensions).forEach(([dimId, dimension]) => {
    if (dimension.gap > 20) {
      const dimName = dimId.replace(/([A-Z])/g, ' $1').trim();
      recommendations.push(`Address gaps in ${dimName} - consider targeted investment and skill development`);
    }
  });

  return recommendations.slice(0, 8); // Limit to top 8 recommendations
};

// Helper function to format dimension names
const formatDimensionName = (dimensionId: string): string => {
  return dimensionId.replace(/([A-Z])/g, ' $1').trim()
    .replace(/^./, str => str.toUpperCase()); // Capitalize first letter
};

const PDFDocument: React.FC<PDFReportProps> = ({ surveyData }) => {
  const recommendations = getRecommendations(surveyData);
  const maturityColor = getMaturityColor(surveyData.scores.maturityClassification.level);
  
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Digital Maturity Assessment</Text>
          <Text style={styles.subtitle}>Comprehensive Analysis Report</Text>
          <Text style={styles.subtitle}>
            Based on EU/JRC Digital Maturity Framework
          </Text>
          <Text style={styles.assessmentId}>
            Assessment ID: {surveyData.id} • {new Date(surveyData.timestamp).toLocaleDateString()}
          </Text>
        </View>

        {/* Company Information */}
        {surveyData.userDetails && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Organization</Text>
            <View style={styles.companyInfo}>
              <Text style={styles.companyTitle}>
                {surveyData.userDetails.companyName || 'Organization'}
              </Text>
              {surveyData.userDetails.email && (
                <Text style={styles.companyDetails}>
                  Contact: {surveyData.userDetails.email}
                </Text>
              )}
              {surveyData.userDetails.sector && (
                <Text style={styles.companyDetails}>
                  Sector: {surveyData.userDetails.sector}
                </Text>
              )}
              {surveyData.userDetails.companySize && (
                <Text style={styles.companyDetails}>
                  Size: {surveyData.userDetails.companySize}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Overall Score */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overall Digital Maturity</Text>
          <View style={styles.overallScore}>
            <Text style={styles.scoreNumber}>{surveyData.scores.overall}/100</Text>
            <Text style={[styles.maturityLevel, { color: maturityColor }]}>
              {surveyData.scores.maturityClassification.label}
            </Text>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${surveyData.scores.overall}%`, backgroundColor: maturityColor }
                ]} 
              />
            </View>
          </View>
        </View>

        {/* Dimension Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dimension Analysis</Text>
          <View style={styles.dimensionsGrid}>
            {Object.entries(surveyData.scores.dimensions).map(([dimId, dimension]) => (
              <View key={dimId} style={styles.dimensionCard}>
                <Text style={styles.dimensionName}>
                  {formatDimensionName(dimId)}
                </Text>
                <Text style={styles.dimensionScore}>{dimension.score}/100</Text>
                <View style={styles.progressBar}>
                  <View 
                    style={[styles.progressFill, { width: `${dimension.score}%` }]} 
                  />
                </View>
                {dimension.gap > 0 && (
                  <Text style={styles.gapText}>
                    Gap to target: {dimension.gap} points
                  </Text>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Recommendations */}
        <View style={styles.recommendations}>
          <Text style={styles.sectionTitle}>Strategic Recommendations</Text>
          {recommendations.map((recommendation, index) => (
            <View key={index} style={styles.recommendationItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.recommendationText}>{recommendation}</Text>
            </View>
          ))}
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          This report was generated using the EU/JRC Digital Maturity Assessment framework. 
          Results should be used as guidance for digital transformation planning.
        </Text>
        
        <Text 
          style={styles.pageNumber}
          render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          fixed
        />
      </Page>
    </Document>
  );
};

// Export component for download
export const PDFDownloadButton: React.FC<{
  surveyData: SurveySubmission;
  children: React.ReactNode;
  fileName?: string;
  className?: string;
}> = ({ surveyData, children, fileName, className }) => {
  const defaultFileName = `digital-maturity-assessment-${surveyData.id}-${new Date().toISOString().split('T')[0]}.pdf`;
  
  return (
    <PDFDownloadLink
      document={<PDFDocument surveyData={surveyData} />}
      fileName={fileName || defaultFileName}
      className={className}
    >
      {({ loading, error }) => {
        if (loading) return 'Generating PDF...';
        if (error) return 'Error generating PDF';
        return children;
      }}
    </PDFDownloadLink>
  );
};

// Export function for programmatic generation
export const generatePDFBlob = async (surveyData: SurveySubmission): Promise<Blob> => {
  const { pdf } = await import('@react-pdf/renderer');
  return pdf(<PDFDocument surveyData={surveyData} />).toBlob();
};

export { PDFDocument };