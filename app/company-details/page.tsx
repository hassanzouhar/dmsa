'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowRight, Building, Users, Briefcase, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { createSurvey, CompanyDetailsForm } from '@/lib/survey-api';
import { useAssessmentStore } from '@/store/assessment';
import { NORWEGIAN_COUNTIES } from '@/data/norwegian-counties';

// SN / NACE hybrid bedrifter etter størrelse og næring
// https://www.ssb.no/nasjonalregnskap-og-konjunkturer/statistikker/bedrifter/aar/2023-11-16#innhold

const NACE_SECTORS = [
  { code: 'A', name: 'Jordbruk, skogbruk og fiske	' },
  { code: 'B', name: 'Bergverksdrift og utvinning' },
  { code: 'C', name: 'Industri' },
  { code: 'D', name: 'Kraftforsyning' },
  { code: 'E', name: 'Vannforsyning, avløp og renovasjon' },
  { code: 'F', name: 'Bygge- og anleggsvirksomhet' },
  { code: 'G', name: 'Vare, Engros eller detaljhandel' },
  { code: 'H', name: 'Transport og lagring' },
  { code: 'I', name: 'Overnattings- og serveringsvirksomhet' },
  { code: 'J', name: 'Utgivelse, kringkasting, innnholdsproduksjon og distribusjonsvirksomhet' },
  { code: 'K', name: 'Telekommunikasjon, Programmering, Konsulent eller andre tjenester knyttet til IT' },
  { code: 'L', name: 'Finansiell tjenesteyting' },
  { code: 'M', name: 'Eiendomsvirksomhet' },
  { code: 'N', name: 'Faglig, vitenskaplig og teknisk tjenesteyting' },
  { code: 'O', name: 'Forretningsmessig tjenesteyting' },
  { code: 'P', name: 'Offentlig administrasjon og forsvar, trygdeordninger underlagt offentlig forvaltning' },
  { code: 'Q', name: 'Undervisning' },
  { code: 'R', name: 'Helse- og sosialtjenester' },
  { code: 'S', name: 'Kultur, underholdning og fritid i alt' },
  { code: 'T', name: 'Annen tjenesteyting' },
  { code: 'U', name: 'Vis/skjul:U - Lønnet arbeid i private husholdninger og annen vareproduksjon og tjenesteyting i private husholdninger til eget bruk' },
  { code: 'V', name: 'Aktiviteter i Internasjonale organisasjoner og organer' }
];

// Country options (focusing on European countries and common ones)
const COUNTRIES = [
  { code: 'NO', name: 'Norge', flag: '🇳🇴' },
  { code: 'SE', name: 'Sverige', flag: '🇸🇪' },
  { code: 'DK', name: 'Danmark', flag: '🇩🇰' },
  { code: 'FI', name: 'Finland', flag: '🇫🇮' },
  { code: 'IS', name: 'Island', flag: '🇮🇸' },
  { code: 'DE', name: 'Tyskland', flag: '🇩🇪' },
  { code: 'GB', name: 'Storbritannia', flag: '🇬🇧' },
  { code: 'FR', name: 'Frankrike', flag: '🇫🇷' },
  { code: 'NL', name: 'Nederland', flag: '🇳🇱' },
  { code: 'BE', name: 'Belgia', flag: '🇧🇪' },
  { code: 'AT', name: 'Østerrike', flag: '🇦🇹' },
  { code: 'CH', name: 'Sveits', flag: '🇨🇭' },
  { code: 'ES', name: 'Spania', flag: '🇪🇸' },
  { code: 'IT', name: 'Italia', flag: '🇮🇹' },
  { code: 'PL', name: 'Polen', flag: '🇵🇱' },
  { code: 'US', name: 'USA', flag: '🇺🇸' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'OTHER', name: 'Annet land', flag: '🌍' }
];

// Company size categories based on EU SME definition
const COMPANY_SIZES = [
  { 
    id: 'micro', 
    name: 'Mikrobedrift, "ENK"', 
    description: 'Årlig omsetning under 2M EUR',
    employees: '1-9 ansatte'
  },
  { 
    id: 'small', 
    name: 'Liten bedrift', 
    description: 'Årlig omsetning under 10M EUR',
    employees: '10-49 ansatte'
  },
  { 
    id: 'medium', 
    name: 'Mellomstor bedrift', 
    description: 'Årlig omsetning under 50 mill. EUR',
    employees: '50-249 ansatte'
  },
  { 
    id: 'large', 
    name: 'Stor bedrift', 
    description: 'Årlig omsetning over 50 mill. EUR',
    employees: '250+ ansatte'
  }
];

interface CompanyDetails {
  companyName: string;
  naceSector: string;
  companySize: string;
  country: string;
  county?: string;
}

export default function CompanyDetailsPage() {
  const router = useRouter();
  const { setSurveySession } = useAssessmentStore();
  const [formData, setFormData] = useState<CompanyDetails>({
    companyName: '',
    naceSector: '',
    companySize: '',
    country: 'NO', // Default to Norway
    county: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Firmanavn er påkrevd';
    }
    
    if (!formData.naceSector) {
      newErrors.naceSector = 'Velg en bransje';
    }
    
    if (!formData.companySize) {
      newErrors.companySize = 'Velg bedriftsstørrelse';
    }
    
    if (!formData.country) {
      newErrors.country = 'Velg land';
    }

    if (formData.country === 'NO' && !formData.county) {
      newErrors.county = 'Velg fylke';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Map form data to API format
      const companyDetails: CompanyDetailsForm = {
        companyName: formData.companyName.trim(),
        companySize: formData.companySize as 'micro' | 'small' | 'medium' | 'large',
        nace: formData.naceSector,
        region:
          formData.country === 'NO' && formData.county
            ? `${formData.country}-${formData.county}`
            : formData.country,
      };

      // Create survey via API
      const surveySession = await createSurvey(companyDetails, 'no', 'v1.0');
      
      // Save survey session to store
      setSurveySession(surveySession);
      
      // Store company details in localStorage for backward compatibility
      localStorage.setItem('dma-company-details', JSON.stringify({
        ...formData,
        timestamp: new Date().toISOString()
      }));
      
      // Navigate to assessment
      router.push('/assessment');
    } catch (error) {
      console.error('Failed to create survey:', error);
      setErrors({ 
        general: error instanceof Error 
          ? `Kunne ikke opprette vurdering: ${error.message}` 
          : 'En feil oppstod. Vennligst prøv igjen.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle form changes
  const handleChange = (field: keyof CompanyDetails, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Header */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <Building className="w-8 h-8 text-primary" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-primary">
                Bedriftsinformasjon
              </CardTitle>
              <CardDescription className="text-base">
                Før vi starter vurderingen, trenger vi noen grunnleggende opplysninger om bedriften din.
                Dette hjelper oss å gi deg mer relevante benchmarks og anbefalinger.
              </CardDescription>
              <Badge variant="secondary" className="w-fit mx-auto">
                Steg 1 av 2
              </Badge>
            </CardHeader>
          </Card>

          {/* Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                Bedriftsdetaljer
              </CardTitle>
              <CardDescription>
                For å kunne sammenligne dine svar med andre i din bransje må vi vite litt om bedriften.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* General error */}
              {errors.general && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    {errors.general}
                  </AlertDescription>
                </Alert>
              )}

              {/* Company Name */}
              <div className="space-y-2">
                <Label htmlFor="companyName" className="text-base font-medium">
                  Firmanavn *
                </Label>
                <Input
                  id="companyName"
                  placeholder="Skriv inn bedriftens navn"
                  value={formData.companyName}
                  onChange={(e) => handleChange('companyName', e.target.value)}
                  className={errors.companyName ? 'border-red-300' : ''}
                />
                {errors.companyName && (
                  <p className="text-sm text-red-600">{errors.companyName}</p>
                )}
              </div>

              {/* NACE Sector */}
              <div className="space-y-2">
                <Label htmlFor="naceSector" className="text-base font-medium">
                  Velg bransje *
                </Label>
                <Select
                  value={formData.naceSector}
                  onValueChange={(value) => handleChange('naceSector', value)}
                >
                  <SelectTrigger className={errors.naceSector ? 'border-red-300' : ''}>
                    <SelectValue placeholder="Næringsgruppe / Aktivitet" />
                  </SelectTrigger>
                  <SelectContent>
                    {NACE_SECTORS.map((sector) => (
                      <SelectItem key={sector.code} value={sector.code}>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {sector.code}
                          </Badge>
                          <span>{sector.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.naceSector && (
                  <p className="text-sm text-red-600">{errors.naceSector}</p>
                )}
              </div>

              {/* Company Size */}
              <div className="space-y-3">
                <Label className="text-base font-medium">
                  Bedriftsstørrelse *
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {COMPANY_SIZES.map((size) => (
                    <button
                      key={size.id}
                      type="button"
                      onClick={() => handleChange('companySize', size.id)}
                      className={`p-4 border rounded-lg text-left transition-all hover:border-primary/50 ${
                        formData.companySize === size.id
                          ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                          : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Users className="w-5 h-5 text-primary mt-0.5" />
                        <div>
                          <div className="font-medium text-sm">{size.name}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {size.employees}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {size.description}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                {errors.companySize && (
                  <p className="text-sm text-red-600">{errors.companySize}</p>
                )}
              </div>

              {/* Country */}
              <div className="space-y-2">
                <Label htmlFor="country" className="text-base font-medium">
                  Land *
                </Label>
                <Select
                  value={formData.country}
                  onValueChange={(value) => handleChange('country', value)}
                >
                  <SelectTrigger className={errors.country ? 'border-red-300' : ''}>
                    <SelectValue placeholder="Velg land" />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((country) => (
                      <SelectItem key={country.code} value={country.code}>
                        <div className="flex items-center gap-2">
                          <span>{country.flag}</span>
                          <span>{country.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.country && (
                  <p className="text-sm text-red-600">{errors.country}</p>
                )}
              </div>

              {/* Zip Code (Optional) */}
              {formData.country === 'NO' && (
                <div className="space-y-2">
                  <Label className="text-base font-medium">
                    Fylke *
                  </Label>
                  <Select
                    value={formData.county || ''}
                    onValueChange={(value) => handleChange('county', value)}
                  >
                    <SelectTrigger className={errors.county ? 'border-red-300' : ''}>
                      <SelectValue placeholder="Velg fylke" />
                    </SelectTrigger>
                    <SelectContent>
                      {NORWEGIAN_COUNTIES.map((county) => (
                        <SelectItem key={county.code} value={county.code}>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {county.code}
                            </Badge>
                            <span>{county.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.county && (
                    <p className="text-sm text-red-600">{errors.county}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Privacy Notice */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="text-sm text-blue-800 space-y-2">
                <p className="font-medium">🔒 Personvern og datasikkerhet</p>
                <ul className="space-y-1 text-blue-700">
                  <li>• Informasjonen lagres sikkert og brukes kun for denne vurderingen</li>
                  <li>• Du kan velge å dele ytterligere detaljer senere for utvidede analyser</li>
                  <li>• Data behandles i henhold til GDPR og norsk personvernlovgivning</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-between">
            <Button
              variant="outline"
              onClick={() => router.push('/')}
              className="sm:w-auto"
            >
              Tilbake til start
            </Button>
            
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="sm:w-auto"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  Lagrer...
                </>
              ) : (
                <>
                  Fortsett til vurdering
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
