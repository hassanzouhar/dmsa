# Scripts

Collection of administrative and data management scripts for the Digital Maturity Assessment platform.

## Available Scripts

### Data Extraction

#### `generate-all-benchmarks.ts` ⭐ RECOMMENDED
**One-command solution** to generate all benchmark lenses from SSB data.

```bash
# Generate all 110 benchmarks (national, sector, size, segments)
npx tsx script/generate-all-benchmarks.ts

# Preview first (recommended)
npx tsx script/generate-all-benchmarks.ts --dry-run
npx tsx script/generate-all-benchmarks.ts --output ./benchmarks.json

# Options
--dry-run           # Preview without uploading
--output <path>     # Save to JSON instead of Firestore
--skip-intelligence # Faster, scoring only
```

**Output**: 110 benchmark documents covering:
- 1 national aggregate
- 21 sector benchmarks (A-U)
- 4 size benchmarks (micro, small, medium, large)
- 84 segment benchmarks (sector × size)

Each with:
- Dimension scores (0-100) and percentiles (p25, p50, p75)
- Success patterns (cloud benefits, AI use cases)
- Common challenges (cybersecurity, AI barriers)
- Pre-computed intelligence for instant recommendations

**Time**: ~15-20 minutes (SSB rate limit: 30 req/min)
**Storage**: ~55MB (110 docs × ~500KB each)
**See**: `docs/SSB_QUICKSTART.md` for quick start guide

---

#### `extract-ssb-benchmarks.ts`
Legacy single-sector extraction (use `generate-all-benchmarks.ts` instead).

```bash
# Extract specific sector only
npx tsx script/extract-ssb-benchmarks.ts --sector C --output ./test.json
```

---

### Firebase Management

#### `seed-firestore.js`
Seeds Firestore with dummy survey data for development.

```bash
npx tsx --env-file=.env.local script/seed-firestore.js
```

**Creates:**
- 10 sample surveys (varying maturity levels)
- Analytics events
- Global metrics
- Basic benchmark data (will be replaced by SSB extraction)

#### `reset-firestore.js`
Clears specific Firestore collections.

```bash
npx tsx --env-file=.env.local script/reset-firestore.js
```

**Warning**: Destructive operation - use with caution!

#### `wipe-firestore.js`
Completely wipes all Firestore data.

```bash
npx tsx --env-file=.env.local script/wipe-firestore.js
```

**Warning**: Nuclear option - only use in development!

---

### Testing & Debugging

#### `admin-examine-data.js`
Examines all Firebase data structures using Admin SDK.

```bash
node script/admin-examine-data.js
```

**Shows:**
- All collections and document counts
- Sample document structures
- Subcollections
- Storage contents

#### `test-firebase-connection.js`
Tests Firebase client connection.

```bash
node script/test-firebase-connection.js
```

#### `test-production-firebase.js`
Tests production Firebase configuration.

```bash
node script/test-production-firebase.js
```

#### `test-api.js`
Tests API endpoints.

```bash
node script/test-api.js
```

---

### Setup & Configuration

#### `setup-admin-sdk.sh`
Sets up Firebase Admin SDK credentials.

```bash
./script/setup-admin-sdk.sh
```

**Configures:**
- Service account key
- Environment variables
- Admin SDK initialization

#### `setup-vercel-env.sh`
Configures Vercel environment variables.

```bash
./script/setup-vercel-env.sh
```

---

## Typical Workflows

### First-Time Setup

```bash
# 1. Configure Firebase Admin SDK
./script/setup-admin-sdk.sh

# 2. Test connection
node script/test-firebase-connection.js

# 3. Seed with initial data
npx tsx --env-file=.env.local script/seed-firestore.js

# 4. Extract SSB benchmarks
npx tsx script/extract-ssb-benchmarks.ts --dry-run  # Preview first
npx tsx script/extract-ssb-benchmarks.ts             # Then upload

# 5. Examine results
node script/admin-examine-data.js
```

### Development Reset

```bash
# Reset surveys but keep benchmarks
npx tsx --env-file=.env.local script/reset-firestore.js

# Reseed with new dummy data
npx tsx --env-file=.env.local script/seed-firestore.js
```

### Update Benchmarks

```bash
# Monthly benchmark refresh
npx tsx script/extract-ssb-benchmarks.ts

# Or update specific sector
npx tsx script/extract-ssb-benchmarks.ts --sector C
```

### Production Deployment

```bash
# 1. Test production config
node script/test-production-firebase.js

# 2. Setup Vercel environment
./script/setup-vercel-env.sh

# 3. Extract production benchmarks
npx tsx script/extract-ssb-benchmarks.ts --output ./prod-benchmarks.json

# 4. Review JSON before uploading
cat prod-benchmarks.json | jq '.benchmarks[0]'

# 5. Upload to production (remove --output)
npx tsx script/extract-ssb-benchmarks.ts
```

---

## Environment Variables Required

For SSB extraction (no credentials needed - public API):
```bash
# None required - SSB API is public
```

For Firebase operations:
```bash
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
```

Store in `.env.local` (gitignored).

---

## Safety Notes

### Destructive Operations

Scripts that modify data:
- `wipe-firestore.js` - **Deletes everything**
- `reset-firestore.js` - Deletes specific collections
- `seed-firestore.js` - Adds data (safe)
- `extract-ssb-benchmarks.ts` - Overwrites benchmarks (safe, public data)

Always use `--dry-run` when testing!

### Rate Limits

SSB API:
- 30 requests/minute
- Automatically handled by client
- Full extraction takes ~15-20 minutes

Firebase:
- Admin SDK has higher limits
- Be cautious with batch operations

---

## Troubleshooting

### "Cannot find module"
```bash
npm install  # Install dependencies
```

### "Firebase Admin SDK not initialized"
```bash
# Check .env.local has all required variables
cat .env.local

# Run setup script
./script/setup-admin-sdk.sh
```

### "SSB API rate limit exceeded"
```bash
# Wait 1 minute and retry
# Or run with --sector flag to extract smaller batches
```

### "Benchmark upload failed"
```bash
# Check Firestore security rules allow admin writes
# Verify Firebase credentials are correct
node script/test-firebase-connection.js
```

---

## Development

### Adding New Scripts

1. Create script in `/script/`
2. Add TypeScript execution: `#!/usr/bin/env tsx`
3. Make executable: `chmod +x script/your-script.ts`
4. Document here in README
5. Add to CLAUDE.md if complex

### Testing Scripts

```bash
# Dry run mode (if supported)
npx tsx script/your-script.ts --dry-run

# Output to file instead of DB
npx tsx script/your-script.ts --output ./test-output.json

# Use development Firebase project
# (set different project ID in .env.local)
```

---

## Architecture

```
script/
├── extract-ssb-benchmarks.ts  # Main SSB extraction (NEW!)
├── seed-firestore.js          # Dev data seeding
├── reset-firestore.js         # Selective deletion
├── wipe-firestore.js          # Full deletion
├── admin-examine-data.js      # Data inspection
├── test-*.js                  # Various tests
└── setup-*.sh                 # Configuration

lib/
├── ssb-api-client.ts          # SSB API wrapper (NEW!)
└── ssb-transformer.ts         # Data transformation (NEW!)

docs/
├── SSB_DIMENSION_MAPPING.md   # Dimension → SSB table mapping
└── SSB_EXTRACTION_GUIDE.md    # Full extraction documentation
```

---

## Next Steps

1. **Run your first SSB extraction**: See `docs/SSB_EXTRACTION_GUIDE.md`
2. **Integrate with app**: Update `benchmark-service.ts` to use SSB data
3. **Display intelligence**: Build UI for success patterns & challenges
4. **Monitor effectiveness**: Track which recommendations users follow
5. **Iterate**: Refine scoring and recommendations based on feedback

---

## Support

Questions? Check:
- `docs/SSB_EXTRACTION_GUIDE.md` - Full SSB extraction docs
- `docs/SSB_DIMENSION_MAPPING.md` - Data mapping details
- `CLAUDE.md` - Overall architecture
- SSB API: https://data.ssb.no/api/pxwebapi/v2/
