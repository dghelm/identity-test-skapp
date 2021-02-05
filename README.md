# identity-test-skapp

## Deployment

```
npm run build
```

Upload `dist/` folder to Skynet.

## Development

```
npm run build
```

```
python3 -m http.server
```

Open `http://localhost:8000/dist/` in the browser.

### Swapping out the bridge

Enter the new bridge URL in `bridgeSkylink` in `src/index.js`.
