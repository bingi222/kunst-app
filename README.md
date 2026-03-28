# KUNST App

## Start (Frontend + API)

Das Projekt besteht jetzt aus:

- React Frontend (Port `3000`)
- Express API fuer Auth/Profile/Posts/Likes (Port `4000`)

### 1) Abhaengigkeiten installieren

```bash
npm install
```

### 2) API starten

```bash
npm run dev:api
```

Die API laeuft dann unter `http://localhost:4000`.

### 3) Frontend starten (zweites Terminal)

```bash
npm start
```

Das Frontend laeuft unter `http://localhost:3000` und nutzt standardmaessig `http://localhost:4000` als API.

Optional kannst du die API-URL setzen:

```bash
REACT_APP_API_URL=http://localhost:4000 npm start
```

### Hinweis fuer Cloud/HTTPS-Previews

Die App nutzt standardmaessig einen relativen API-Pfad (`/api`) und `npm start` hat einen Proxy auf
`http://localhost:4000` konfiguriert. Das verhindert Browser-Fehler durch Mixed Content/CORS in Preview-URLs.

---

## Standard Demo-Login

- Username: `bingi`
- Passwort: `kunst123`

---

## Neue API-Funktionen (Server-Daten statt Local Fallback)

Die App nutzt jetzt serverseitige Endpunkte fuer:

- Feed laden: `GET /api/posts`
- Post erstellen: `POST /api/posts`
- Eigene Likes laden: `GET /api/likes`
- Like umschalten: `POST /api/posts/:postId/like`

Damit laufen Posts/Likes/Profile serverseitig statt ueber lokale Fallback-Daten.

---

## About Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
