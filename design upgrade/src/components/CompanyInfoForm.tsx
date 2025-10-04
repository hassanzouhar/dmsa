import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card } from './ui/card';
import { Building2, ArrowLeft, ArrowRight, Shield } from 'lucide-react';
import { CompanyInfo } from '../App';

interface CompanyInfoFormProps {
  onSubmit: (info: CompanyInfo) => void;
  onBack: () => void;
}

export function CompanyInfoForm({ onSubmit, onBack }: CompanyInfoFormProps) {
  const [formData, setFormData] = useState<CompanyInfo>({
    name: '',
    industry: '',
    size: 'small',
    country: 'Norge',
    postalCode: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.industry) {
      onSubmit(formData);
    }
  };

  const industries = [
    { value: 'agriculture', label: 'Jordbruk, skogbruk og fiske' },
    { value: 'mining', label: 'Bergverksdrift og utvinning' },
    { value: 'manufacturing', label: 'Industri' },
    { value: 'energy', label: 'Elektrisitet, gass, damp og varmtvann' },
    { value: 'water', label: 'Vannforsyning, avløp og renovasjon' },
    { value: 'construction', label: 'Bygge- og anleggsvirksomhet' },
    { value: 'trade', label: 'Varehandel og reparasjon av motorvogner' },
    { value: 'transport', label: 'Transport og lagring' },
    { value: 'accommodation', label: 'Overnatting og servering' },
    { value: 'information', label: 'Informasjon og kommunikasjon' },
    { value: 'finance', label: 'Finansiering og forsikring' },
    { value: 'real-estate', label: 'Omsetning og drift av fast eiendom' },
    { value: 'professional', label: 'Faglig, vitenskapelig og teknisk tjenesteyting' },
    { value: 'administrative', label: 'Forretningsmessig tjenesteyting' },
    { value: 'public', label: 'Offentlig administrasjon og forsvar' },
    { value: 'education', label: 'Undervisning' },
    { value: 'health', label: 'Helse- og sosialtjenester' },
    { value: 'arts', label: 'Kultur, underholdning og fritid' },
    { value: 'other', label: 'Annen tjenesteyting' }
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={onBack} className="flex items-center space-x-2">
            <ArrowLeft className="w-4 h-4" />
            <span>Tilbake til start</span>
          </Button>
          <div className="text-sm text-gray-500">Steg 1 av 2</div>
        </div>
      </div>

      <Card className="p-8 bg-white">
        <div className="text-center mb-8">
          <Building2 className="w-12 h-12 text-blue-600 mx-auto mb-4" />
          <h1 className="text-2xl mb-2">Bedriftsinformasjon</h1>
          <p className="text-gray-600">
            Før vi starter vurderingen, trenger vi noen grunnleggende opplysninger om bedriften din. 
            Dette hjelper oss å gi deg mer relevante benchmarks og anbefalinger.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Company Details Section */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <div className="flex items-center space-x-2 mb-4">
              <Building2 className="w-5 h-5 text-gray-600" />
              <h3>Bedriftsdetaljer</h3>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Informasjonen brukes kun for å tilpasse vurderingen og lagres sikkert.
            </p>

            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Firmanavn *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Skriv inn bedriftens navn"
                  required
                />
              </div>

              <div>
                <Label htmlFor="industry">Bransje (NACE-kode) *</Label>
                <Select 
                  value={formData.industry} 
                  onValueChange={(value) => setFormData({ ...formData, industry: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Velg din bransje" />
                  </SelectTrigger>
                  <SelectContent>
                    {industries.map((industry) => (
                      <SelectItem key={industry.value} value={industry.value}>
                        {industry.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Bedriftsstørrelse *</Label>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  {[
                    { value: 'micro', label: 'Mikrobedrift', subtitle: '1-9 ansatte, omsetning < 2 mill. EUR' },
                    { value: 'small', label: 'Liten bedrift', subtitle: '10-49 ansatte, omsetning < 10 mill. EUR' },
                    { value: 'medium', label: 'Mellomstørrelse', subtitle: '50-249 ansatte, omsetning < 50 mill. EUR' },
                    { value: 'large', label: 'Stor bedrift', subtitle: '250+ ansatte, omsetning > 50 mill. EUR' }
                  ].map((size) => (
                    <Card 
                      key={size.value}
                      className={`p-4 cursor-pointer border-2 transition-colors ${
                        formData.size === size.value 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setFormData({ ...formData, size: size.value as CompanyInfo['size'] })}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="mt-1">
                          <div className={`w-4 h-4 rounded-full border-2 ${
                            formData.size === size.value ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                          }`}>
                            {formData.size === size.value && (
                              <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                            )}
                          </div>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm">{size.label}</h4>
                          <p className="text-xs text-gray-500 mt-1">{size.subtitle}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="country">Land *</Label>
                <Select 
                  value={formData.country} 
                  onValueChange={(value) => setFormData({ ...formData, country: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Norge">🇳🇴 Norge</SelectItem>
                    <SelectItem value="Sverige">🇸🇪 Sverige</SelectItem>
                    <SelectItem value="Danmark">🇩🇰 Danmark</SelectItem>
                    <SelectItem value="Finland">🇫🇮 Finland</SelectItem>
                    <SelectItem value="Island">🇮🇸 Island</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="postalCode">Postnummer (valgfritt)</Label>
                <Input
                  id="postalCode"
                  value={formData.postalCode}
                  onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                  placeholder="0150"
                />
                <p className="text-xs text-gray-500 mt-1">For regionale sammenligninger</p>
              </div>
            </div>
          </div>

          {/* Privacy Notice */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-start space-x-3">
              <Shield className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <h4 className="text-blue-900 mb-1">🔒 Personvern og datasikkerhet</h4>
                <ul className="text-blue-800 space-y-1">
                  <li>• Informasjonen lagres sikkert og brukes kun for denne vurderingen</li>
                  <li>• Du kan velge å dele ytterligere detaljer senere for utvidede analyser</li>
                  <li>• Data behandles i henhold til GDPR og norsk personvernlovgivning</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-6">
            <Button type="button" variant="ghost" onClick={onBack}>
              Tilbake til start
            </Button>
            <Button 
              type="submit" 
              disabled={!formData.name || !formData.industry}
              className="flex items-center space-x-2"
            >
              <span>Fortsett til vurdering</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}