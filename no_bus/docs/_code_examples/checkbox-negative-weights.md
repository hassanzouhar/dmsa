# Checkbox Scoring with Negative Weights

Example question where one option penalizes the score.

Question (weights):
- "Skybasert drift" → weight 2
- "Papirbasert/ikke digitalt" → weight -1
- "Delvis digitalt" → weight 1

Normalization:
- Positive mass = 2 + 1 = 3
- Score = (sum positive selected − sum |negative selected|) / 3
- Clamped to [0, 1], scaled to 0–10

Examples:
- Selected: ["Skybasert drift"] → (2 − 0) / 3 × 10 ≈ 6.7
- Selected: ["Delvis digitalt", "Papirbasert/ikke digitalt"] → (1 − 1) / 3 × 10 = 0.0
- Selected: ["Skybasert drift", "Papirbasert/ikke digitalt"] → (2 − 1) / 3 × 10 ≈ 3.3

See implementation: `scoring.ts` (checkbox scorer).

