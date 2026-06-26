# qTask Deployment Instructions

This file documents the production deploy steps for the qTask project.

## 1. Verify and configure the backend connection string

1. Open `qTask-backend\appsettings.json`.
2. Confirm the `DefaultConnection` value points to the correct SQL Server instance and database for production.
3. For production, prefer using an environment variable instead of hardcoding the password in source control. Example:
   - Set `ConnectionStrings__DefaultConnection` in the hosting environment.

## 2. Frontend publish steps

1. Open the frontend folder:
   ```bash
   cd "d:\Qtech Project\qSys_qTaskManagement\qTask-frontend"
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Test locally:
   ```bash
   npm run dev
   ```
4. Build for production:
   ```bash
   npm run build
   ```
5. Confirm `qTask-frontend\.env.production` contains:
   ```env
   VITE_API_URL=/api
   ```
   This ensures production uses the server-relative API path.

## 3. Backend publish steps

1. Open the backend folder:
   ```bash
   cd "d:\Qtech Project\qSys_qTaskManagement\qTask-backend"
   ```
2. Restore packages:
   ```bash
   dotnet restore
   ```
3. Publish the project to the `publish` folder:
   ```bash
   dotnet publish "QtechOJT Net9.csproj" -c Release -o ./publish
   ```

## 4. IIS configuration

1. Create the application or site in IIS.
   - The physical path should point to the backend publish folder, for example:
     `d:\Qtech Project\qSys_qTaskManagement\qTask-backend\publish`
2. Set the application pool identity and verify it has the correct permissions.
3. Ensure the site can serve both the ASP.NET backend and the static frontend assets.

## 5. Create the uploads folder

1. Inside the deployed site folder, create:
   - `wwwroot\uploads`
2. If the backend publishes into a separate folder structure, create the `uploads` folder under the published `wwwroot` path.

## 6. Set permissions for uploads

1. Grant write permission to the IIS app pool user or `IIS_IUSRS` on the `uploads` folder.
2. Example PowerShell command (adjust path and app pool name):
   ```powershell
   icacls "D:\path\to\site\wwwroot\uploads" /grant "IIS AppPool\YourAppPoolName":(OI)(CI)M
   ```

## 7. Important deployment notes

- `npm run dev` is only for local development and testing.
- In production, serve the built frontend files from `qTask-frontend\dist` or your web server.
- Ensure the production site does not use the Vite dev server.
- If file upload fails with `500`, verify:
  - `wwwroot\uploads` exists.
  - the app pool user has write access to `wwwroot\uploads`.
  - the server is using the correct API base path `/api`.
  - `web.config` request limits are not blocking upload size.

## 8. Optional IIS request limit configuration

If uploads are rejected at the server, add this to `web.config`:
```xml
<system.webServer>
  <security>
    <requestFiltering>
      <requestLimits maxAllowedContentLength="10485760" /> <!-- 10 MB -->
    </requestFiltering>
  </security>
</system.webServer>
```
