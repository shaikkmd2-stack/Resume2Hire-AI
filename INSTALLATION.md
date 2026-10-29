# Resume2Hire AI — Installation Guide

## 1. Project Overview
Resume2Hire AI is a web-based job assistance platform designed to help users explore relevant job opportunities based on their resume and skills.

**Live Website:** https://resume2hire-ai.vercel.app/dashboard

**GitHub Repository:** https://github.com/Shaikkmd2-stack/Resume2Hire-AI

## 2. Prerequisites
Install the following software before running the project locally:

- Node.js and npm
- Git
- A code editor such as Visual Studio Code
- A web browser
- Access to the configured Firebase project, if required

## 3. Download the Source Code

Open a terminal and execute:

```bash
git clone https://github.com/Shaikkmd2-stack/Resume2Hire-AI.git
cd Resume2Hire-AI
```

## 4. Install Dependencies

Run the following command in the project directory:

```bash
npm install
```

This installs the dependencies specified by the project's package configuration.

## 5. Configure Firebase

The project uses Firebase for backend functionality, with Cloud Firestore identified as a service used by the team.

1. Open the Firebase Console.
2. Select the Firebase project configured for Resume2Hire AI.
3. Verify the Firebase web app configuration and Firestore database settings.
4. If the application requires environment variables, configure them using the variable names expected by the source code.
5. Ensure that Firestore security rules protect user data.

Do not upload private credentials, service-account keys, passwords, or secret environment files to the public repository. Use the project's existing configuration rather than replacing it with a new Firebase setup.

## 6. Run the Application

Check the scripts in `package.json`. If the project defines the standard Vite development script, run:

```bash
npm run dev
```

Open the local URL printed in the terminal, commonly:

`http://localhost:5173`

## 7. Build for Production

To check whether the application can be built for production, run:

```bash
npm run build
```

Resolve any build errors before submitting the project.

## 8. Troubleshooting

- **Dependency errors:** Check your Node.js and npm versions, then review the installation error.
- **Firebase errors:** Verify the Firebase configuration, Firestore access and security rules.
- **Application does not start:** Check the available scripts in `package.json`.
- **Missing environment variables:** Review the source code and configure the required variables locally.
- **Resume upload errors:** Verify which Firebase service the current implementation uses for file uploads. Firestore stores structured data; file storage may require a separate service.

## 9. Deployment

The application is deployed on Vercel.

Live URL: https://resume2hire-ai.vercel.app/dashboard

## 10. Notes

Installation requirements may vary according to the current source code and configuration. Verify the project on a clean installation before distributing this guide.
