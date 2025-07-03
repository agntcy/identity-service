---
sidebar_position: 4
---

# Verifying an Identity

The "Verify Identity" screen allows users to verify a digital badge, typically a JOSE (JSON Object Signing and Encryption) enveloped badge. This screen is designed for quick and secure verification, and **does not require the user to be logged in** to access or utilize its features.

## How to Use

1.  **Access the Screen**: Navigate to the "Verify Identity" page. No login is required.

![Verify Identity](/img/verify-identity.png)

2.  **Provide the Badge**:
    - **Option A (File Upload)**: Click or drag and drop a JSON file (max 3MB) containing the JOSE enveloped badge into the "Details" area.
    - **Option B (Text Input)**: Paste the JOSE enveloped badge string directly into the "Badge" text field.

:::tip[NOTE]
We support both the JOSE enveloped badge or the full JSON badge content that you can obtain from the Agentic Services. The JOSE enveloped badge is a compact representation of the badge, while the full JSON badge contains all the details in a structured format.
:::

3.  **Initiate Verification**: Click the "Verify" button.
4.  **View Results**: The "Verification Results" section will populate with the outcome of the badge verification.

![Verify Identity Results](/img/verify-identity-done.png)
