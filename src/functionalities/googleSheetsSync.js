import Papa from "papaparse";
import { collection, doc, getDoc, updateDoc, setDoc, arrayUnion } from "firebase/firestore";
import { db } from "./firebase";

const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/1yt5qnYX_tb9_rs1gme5tWMLgHF-ZXECCyDc4WpZtzQY/export?format=csv&gid=1972102221";

const HF_TOKEN = import.meta.env.VITE_HF_TOKEN;

async function queryAI(doubt, resolved, interest, engageRating, feedback) {
  try {
    const response = await fetch(
      "https://router.huggingface.co/v1/chat/completions",
      {
        headers: {
          Authorization: `Bearer ${HF_TOKEN}`,
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({
          max_tokens: 100,
          temperature: 0,
          top_p: 1,
          messages: [
            {
              role: "user",
              content: `Calculate Engagement Quotient (EQ out of 10).

Steps:
1. Convert:
- Doubt: No=0, Yes = 1
- Resolved = (score × 2)
- Interest = (score × 2)
- Engagement = as is
- Feedback = score 0–5 → multiply by 2

2. Weights:
EQ = 
(Doubt × 1.5) +
(Resolved × 2.0) +
(Interest × 2.0) +
(Engagement × 3.0) +
(Feedback × 1.5)

3. Round to 1 decimal.

4. Output:
XX.X

Input:
${doubt},${resolved},${interest},${engageRating},${feedback}
Note : Just respond with EQ i want a one liner answer
example : 66.8
`,
            },
          ],
          model: "mistralai/Mistral-7B-Instruct-v0.2:featherless-ai",
        }),
      }
    );
    const result = await response.json();
    return result.choices[0].message.content.trim();
  } catch (err) {
    console.error("AI Query failed", err);
    return "50.0"; // fallback
  }
}

export const syncGoogleSheets = async () => {
  try {
    console.log("Starting Google Sheets sync...");
    // Add cache buster to prevent stale data
    const cacheBuster = `&t=${Date.now()}`;
    const response = await fetch(SHEET_CSV_URL + cacheBuster);
    const csvText = await response.text();
    
    // Parse CSV with header cleaning
    const parsedData = Papa.parse(csvText, { 
      header: true, 
      skipEmptyLines: true,
      transformHeader: (h) => h.trim() 
    });
    
    console.log(`Parsed ${parsedData.data.length} rows from Google Sheets.`);
    
    const metaRef = doc(db, "system", "syncMeta");
    const metaSnap = await getDoc(metaRef);
    const lastSyncTimeStr = metaSnap.exists() ? metaSnap.data().lastSyncTime : new Date(0).toISOString();
    const lastSyncTime = new Date(lastSyncTimeStr);
    
    console.log(`Last sync time: ${lastSyncTime.toISOString()}`);
    
    let processedAny = false;
    let latestTimestamp = lastSyncTimeStr;

    const findValue = (row, ...keys) => {
       const rowKeys = Object.keys(row);
       for (const k of keys) {
          const match = rowKeys.find(rk => 
             rk.toLowerCase().replace(/[^a-z0-9]/g, '') === k.toLowerCase().replace(/[^a-z0-9]/g, '')
          );
          if (match) return row[match];
       }
       return null;
    };

    const parseDate = (str) => {
       if (!str) return null;
       const d = new Date(str);
       if (!isNaN(d.getTime())) return d;
       
       // Handle DD/MM/YYYY format specifically if basic parsing fails
       const parts = str.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
       if (parts) {
          // Note: assuming DD/MM/YYYY. If MM/DD/YYYY, swap parts[1] and parts[2]
          return new Date(parts[3], parts[2] - 1, parts[1]);
       }
       return null;
    };

    for (let row of parsedData.data) {
       const timestampStr = findValue(row, "Timestamp", "Time");
       if (!timestampStr) continue;
       
       const rowTime = parseDate(timestampStr);
       
       if (!rowTime || isNaN(rowTime.getTime())) {
          console.warn(`Invalid timestamp found: ${timestampStr}`);
          continue;
       }

       if (rowTime <= lastSyncTime) {
          continue; 
       }
       
       const urn = findValue(row, "URN NO", "URN", "ID")?.trim();
       if (!urn) continue;

       console.log(`Processing new record from ${timestampStr} for student ${urn}`);

       // Extra data from sheet with flexible matching
       const doubt = findValue(row, "Did you ask any doubts in class?", "Doubts") || "No";
       const resolved = findValue(row, "Did your doubts get resolved properly ?", "Resolved") || "3";
       const interest = findValue(row, "How interested are you in attending the class?", "Interest") || "3";
       const engageRating = findValue(row, "On the scale out of 1 to 10 how engaged are you in this subject", "Engagement", "Rating") || "5";
       const feedbackText = findValue(row, "Student's feedback", "Feedback") || "No feedback";

       // Call AI for EQ
       const eqString = await queryAI(doubt, resolved, interest, engageRating, feedbackText);
       const eqValue = parseFloat(eqString) || 0;

       // Derived metrics
       let sentiment = "Neutral";
       let category = "Medium";
       let atRisk = false;

       if (eqValue >= 80) {
           sentiment = "Positive";
           category = "High";
       } else if (eqValue < 50) {
           sentiment = "Negative";
           category = "Low";
           atRisk = true;
       }

       const studentRef = doc(db, "students", urn);
       const studentSnap = await getDoc(studentRef);
       
       if (studentSnap.exists()) {
           const studentData = studentSnap.data();
           const newParticipation = (studentData.participation || 0) + 1;
           const currentQuizScore = studentData.quizScore || 0;
           const newQuizScore = (currentQuizScore + parseFloat(engageRating)) / 2;
           
            await updateDoc(studentRef, {
                participation: newParticipation,
                quizScore: newQuizScore,
                engagementScore: eqValue,
                sentiment: sentiment,
                category: category,
                atRisk: atRisk,
                sentimentHistory: arrayUnion(sentiment),
                weeklyHistory: arrayUnion(eqValue),
                feedback: arrayUnion({ date: timestampStr, text: feedbackText }),
                latestFeedback: feedbackText
            });
        } else {
            await setDoc(studentRef, {
                id: urn,
                name: findValue(row, "NAME", "Student Name", "Name") || "Unknown",
                participation: 1,
                quizScore: parseFloat(engageRating) / 2,
                engagementScore: eqValue,
                sentiment: sentiment,
                category: category,
                atRisk: atRisk,
                sentimentHistory: [sentiment],
                weeklyHistory: [eqValue],
                feedback: [{ date: timestampStr, text: feedbackText }],
                latestFeedback: feedbackText
            }, { merge: true });
        }
       
       processedAny = true;
       if (rowTime > new Date(latestTimestamp)) {
           latestTimestamp = timestampStr;
       }
    }
    
    if (processedAny) {
        await setDoc(metaRef, { lastSyncTime: latestTimestamp }, { merge: true });
        console.log(`Sync complete. Updated lastSyncTime to ${latestTimestamp}`);
        // Notify the UI to refresh data
        window.dispatchEvent(new CustomEvent('googleSheetsSynced'));
    } else {
        console.log("No new records to sync.");
    }

  } catch (error) {
     console.error("Failed to sync from Google Sheets", error);
  }
};
