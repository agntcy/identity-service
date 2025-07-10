---
sidebar_position: 2
---

# Connecting an Identity Provider (IdP)

This document provides a comprehensive guide on how to register a new issuer by connecting an Identity Provider (IdP) within the Agent Identity application. Connecting an IdP is a crucial step for integrating external authentication and authorization services, such as Client Credentials, with your Agent Identity environment. This guide specifically details the process for configuring Duo as an issuer.

## Prerequisites

Before you begin the Identity Provider connection process, ensure you have the following:

- **Access to Agent Identity:** You must have an administrator role or sufficient permissions within the Agent Identity application to access the Settings and connect Identity Providers.
- **Duo Security Account:** An active Duo Security account is required.
- **Duo Application Details:** You must have an existing Duo application configured within your Duo Admin Panel. From this application, you will need to retrieve:
  - Your Duo **API Hostname**
  - The **Integration Key** for your Duo application
  - The **Secret Key** for your Duo application

:::tip[NOTE]
You can follow the [Duo Admin API documentation](https://duo.com/docs/adminapi) for detailed instructions on how to create and manage applications within Duo Security.

Below you can find a screenshot of the Duo Admin API interface, with all the necessary permissions and the necessary fields for your integration.
:::

![Duo Admin API](/img/duo-admin-view.png)

## Navigation

To access the Identity Provider creation page within the Agent Identity application:

1.  From the main dashboard, locate and click on **Settings** in the left-hand navigation menu.
2.  Within the Settings section, select **Identity Provider**.
3.  On the Identity Provider management page, click the **Connect** button to initiate the creation wizard.

This will direct you to the "Identity Provider Connection" page, where you can begin configuring your new IdP.

![Register Issuer](/img/register-issuer.png)

## Identity Provider Connection Steps

Follow these steps to configure and register your Identity Provider:

1.  **Select Identity Provider:**

    - On the "Identity Provider Connection" page, you will be presented with a selection of supported Identity Providers.
    - Carefully choose the provider you intend to integrate. Options typically include:
      - **Duo** (as shown in the example, for Duo Security integration)
      - **Ory**
      - **Okta**
      - **AGNTCY** (potentially for internal or specific AGNTCY identity services)
    - **Critical Note:** The selection of an Identity Provider is a **one-time** action. Once saved, this choice cannot be modified later. Ensure you select the correct provider before proceeding.

2.  **Enter Provider Details:**

    - After selecting your desired Identity Provider (e.g., Duo), the "Provider details" section will become active, prompting you for specific configuration parameters.
    - **Hostname:** Enter the API hostname for your Duo Security account. This is your unique Duo API endpoint.
      - _Example:_ `api-ffb0a31a.duosecurity.com`
    - **Integration Key:** Input the Integration Key. This key uniquely identifies your application within Duo Security and is obtained from your Duo Admin Panel when you create or configure an application.
      - _Example:_ `DI12VLEZPQIF5JH7F8G8`
    - **Secret Key:** Provide the Secret Key. This is a sensitive credential used for cryptographic signing of requests to the Duo API, ensuring the authenticity and integrity of communications. It is also obtained from your Duo Admin Panel. For security purposes, the input in this field will be masked (displayed as asterisks).

![Register Issuer With Duo](/img/register-issuer-duo.png)

3.  **Save Configuration:**
    - Once all required details (Hostname, Integration Key, and Secret Key) have been accurately entered, click the **Save** button.
    - Upon successful saving, your chosen Identity Provider will be registered and configured within Agent Identity.
    - If you need to discard the entered information and cancel the creation process, click the **Cancel** button.

![Register Issuer With Duo Success](/img/register-issuer-duo-done.png)
