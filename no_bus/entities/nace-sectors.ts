/**
 * NACE-sektorer med SSB-dekningsmetadata.
 *
 * Denne filen var tidligere en byte-identisk kopi av `data/nace-sectors.ts`.
 * SSB-uttrekket leste kopien mens appen leste originalen, så en korreksjon av
 * NACE-koder eller `ssbCoverage` i den ene ville stille latt pipelinen og UI-et
 * divergere. Nå er det én kilde.
 */
export * from '../../data/nace-sectors';
