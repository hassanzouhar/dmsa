'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Mail, WandSparkles, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface MagicLinkRequestProps {
  title?: string;
  description?: string;
  className?: string;
  onSuccess?: () => void;
}

export function MagicLinkRequest({
  title = 'Enkel pålogging med magisk lenke',
  description = 'Null stress.. Ingen passord å huske. Vi sender deg en sikker lenke på e-post.',
  className = '',
  onSuccess
}: MagicLinkRequestProps) {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<{ title: string; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes('@')) {
      setError({ title: 'Ugyldig e-postadresse', message: 'Vennligst oppgi en gyldig e-postadresse.' });
      toast.error('Ugyldig e-postadresse');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/request-magic-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        setSubmitted(true);
        toast.success('Sjekk e-posten din!', {
          description: `Vi har sendt en sikker lenke til ${email}. Den utløper om 1 time.`,
          duration: 6000,
        });

        // Call onSuccess callback if provided (e.g., to close modal)
        if (onSuccess) {
          // Delay slightly to show success state before closing
          setTimeout(() => {
            onSuccess();
          }, 2000);
        }
      } else {
        // Handle specific error codes
        if (data.error?.code === 'NO_SURVEYS_FOUND') {
          setError({
            title: 'Ingen vurderinger funnet',
            message: 'Vi fant ingen vurderinger knyttet til denne e-postadressen.'
          });
          toast.error('Ingen vurderinger funnet', {
            description: 'Vi fant ingen vurderinger knyttet til denne e-postadressen.',
          });
        } else if (data.error?.code === 'RATE_LIMIT_EXCEEDED') {
          setError({
            title: 'For mange forespørsler',
            message: data.error?.details || 'Vennligst vent litt før du prøver igjen.'
          });
          toast.error('For mange forespørsler', {
            description: data.error?.details || 'Vennligst vent litt før du prøver igjen.',
          });
        } else {
          setError({
            title: 'Noe gikk galt',
            message: data.error?.error || 'Kunne ikke sende lenke. Prøv igjen.'
          });
          toast.error('Noe gikk galt', {
            description: data.error?.error || 'Kunne ikke sende lenke. Prøv igjen.',
          });
        }
      }
    } catch (error) {
      console.error('Failed to request magic link:', error);
      setError({
        title: 'Noe gikk galt',
        message: 'Kunne ikke sende lenke. Sjekk internettforbindelsen din.'
      });
      toast.error('Noe gikk galt', {
        description: 'Kunne ikke sende lenke. Sjekk internettforbindelsen din.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Sjekk e-posten din!
              </h3>
              <p className="text-sm text-gray-600">
                Vi har sendt en sikker lenke til <strong>{email}</strong>.
                Lenken utløper om 1 time.
              </p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
              <p className="font-medium mb-1">💡 Tips:</p>
              <ul className="text-left space-y-1 ml-4">
                <li>• Sjekk spam-mappen hvis du ikke ser e-posten</li>
                <li>• Lenken kan bare brukes én gang</li>
                <li>• Be om en ny lenke hvis denne utløper</li>
              </ul>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setSubmitted(false);
                setEmail('');
              }}
            >
              Send ny lenke
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <WandSparkles className="w-5 h-5 text-primary" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>{error.title}</AlertTitle>
              <AlertDescription>{error.message}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="magic-link-email">E-postadresse</Label>
            <Input
              id="magic-link-email"
              type="email"
              placeholder="din.epost@firma.no"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
              required
              className="text-base"
            />
            <p className="text-xs text-muted-foreground">
              Vi sender en sikker lenke som gir deg tilgang til alle dine vurderinger.
            </p>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting || !email}
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sender lenke...
              </>
            ) : (
              <>
                <WandSparkles className="w-4 h-4 mr-2" />
                Send meg en lenke
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
