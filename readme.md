# Eurovote
Socket.io live voting tool

## Configuration
Please fill in `src/acts.ts`, i.e.:
```
export default {
  1: {
    country: "Norway",
    contestant: "Alessandra",
    song: "Queen of Kings"
  },
  2: {
    country: "Malta",
    contestant: "The Busker",
    song: "Dance"
  }
}
```

## Running the server
1. Make sure node modules are installed by running `npm ci`.
2. Run `npm run start`
3. Open your browser at `localhost:8000`
