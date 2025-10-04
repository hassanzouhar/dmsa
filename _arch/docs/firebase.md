# PRD: Firebase Integration for Survey Storage and Results Access
#### 1. Overview
We need to implement a lightweight backend using Firebase to support survey storage and retrieval in a bootstrapped Next.js project.

###### The primary goal is to:
Store survey responses in Firebase Storage as JSON files.
	Generate a unique ID for each survey session.

###### Allow users to:
See a minimal result immediately after survey completion.
Unlock expanded results by providing company details and an email address.
Retrieve past results using their unique survey ID.
The solution must be simple, scalable, and require minimal backend complexity — no custom servers unless absolutely necessary.

#### 2. Objectives and Goals
Use Firebase client SDK and built-in services to avoid custom backend code

| Goal                      | Description                                                                |
| ------------------------- | -------------------------------------------------------------------------- |
| Secure Storage            | Store survey data in Firebase Storage as JSON with proper access rules.    |
| Scalable & Cost-Efficient | Minimal overhead for reads/writes to handle growth without heavy costs.    |
| User-Friendly Retrieval   | Users can retrieve results using a unique ID (no authentication required). |
| Email Capture for Upsell  | Collect company details and email to unlock expanded survey results.       |

#### 3. Workflow
3.1 Flow Diagram
```
[User Completes Survey]
       |
       v
[Generate Unique ID]
       |
       v
[Save JSON to Firebase Storage]
       |
       +----> [Display Minimal Result]
       |
       +----> [Optional: User Enters Email + Company Details]
                     |
                     v
             [Update JSON with Email & Details]
                     |
                     v
             [Display Expanded Result]
```

#### 4. Functional Requirements
###### 4.1 Firebase Setup

Firebase Services Used:
- Firebase Storage (primary data store for JSON)
- Firebase Hosting (optional for deployment, if desired)
- Firebase Functions (optional for notifications or future automation)

Environment Variables (in .env.local):
```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
```

###### 4.2 Data Structure
Each survey result will be stored as a single JSON file in Firebase Storage.
File path format:
`/surveys/{uniqueId}.json`
Example file (surveys/abcd1234.json):
```
{
  "id": "abcd1234",
  "version": "1.0.0",
  "language": "no",
  "timestamp": "2025-09-25T18:43:01.708Z",
  "answers": { ... },
  "scores": { ... },
  "userDetails": {
    "email": "user@example.com",
    "companyName": "ACME Inc."
  }
}
```
###### 4.3 Unique ID Generation
Generated client-side using uuid or Firebase's `push()` method.
ID is displayed to the user at the end of the survey.
`Example ID format: b23c5a17f2`
###### 4.4 Submission Flow
User completes the survey.
Client generates a unique ID.
Client sends JSON data to Firebase Storage at /surveys/{uniqueId}.json.
Display minimal results immediately on the client.

Optional:
If user provides email & company details:
Update the JSON file with additional info.
Show expanded results.
###### 4.5 Retrieval Flow
User navigates to "Retrieve Past Results."
They enter their unique ID.
App fetches /surveys/{uniqueId}.json from Firebase.

Display:
Minimal result if no email/company data present.
Expanded result if email/company data present.

#### 5. UI Requirements
Screen	Purpose
Survey Form	Collect survey answers.
Results - Minimal	Show limited insights.
Results - Expanded	Show full report with detailed breakdown.
Retrieve Results Page	Let users enter unique ID and retrieve data.
#### 6. Security & Permissions
Firebase Storage Rules:
{
  "rules": {
    "surveys": {
      "$surveyId": {
        ".read": true,
        ".write": true
      }
    }
  }
}
Future Considerations:
Switch to restricted writes with token-based auth once usage scales.
Add validation to prevent malicious JSON overwrites.
#### 7. Technical Implementation
###### 7.1 Next.js Setup
Install Firebase SDK:
`npm install firebase uuid`
Initialize Firebase:
```
// firebaseClient.js
import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
};

const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);
7.2 Saving Survey Data
import { ref, uploadString } from "firebase/storage";
import { storage } from "./firebaseClient";
import { v4 as uuidv4 } from "uuid";

export const saveSurvey = async (data) => {
  const id = uuidv4();
  const surveyRef = ref(storage, `surveys/${id}.json`);
  await uploadString(surveyRef, JSON.stringify({ id, ...data }), 'raw');
  return id;
};
```
###### 7.3 Retrieving Survey Data
import { ref, getDownloadURL } from "firebase/storage";

```
export const fetchSurvey = async (id) => {
  const surveyRef = ref(storage, `surveys/${id}.json`);
  const url = await getDownloadURL(surveyRef);
  const response = await fetch(url);
  return await response.json();
};
```
#### 8. Metrics & Logging
Metric	Purpose
	- Submissions Count
	- Total surveys completed.
	- Email Captures
		- Number of users providing email + company data.
- Retrieval Attempts
	- Frequency of past result lookups.
- Upgrade Conversion %
	- % of minimal users upgrading to expanded results.

> Firebase Analytics can be integrated later if needed.

#### 9. Future Enhancements
Authentication Layer
Secure writes with Firebase Auth when app scales.
Cloud Functions
Trigger an email confirmation with the unique ID.
Analytics & Reporting
Track drop-off points in survey completion.
Firestore Migration
Move from raw JSON storage to structured Firestore collections when data grows more complex.
#### 10. Timeline
Milestone	Estimated Time
Firebase setup & config	1 day
Survey save/retrieve	2 days
Minimal/expanded result UI	1-2 days
Testing & polish	1 day
Total	~5 days
#### 11. Risks
Risk Mitigation
- **Overwrites of JSON data**	
	- Switch to append-only structure or Firestore later.
- **Unauthenticated writes abused**
	- Add write validation rules after MVP.
- **Scaling issues as usage grows**
	- Migrate to Firestore with indexing.
#### 12. Deliverables
Working Next.js project with Firebase integration.
Secure JSON storage of surveys.
Functional survey result retrieval via unique ID.
Minimal and expanded result flows implemented.
