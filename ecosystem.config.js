module.exports = {
  apps: [
    {
      name: "adventurecoin-sync",
      script: "scripts/sync-blockchain.js",
      watch: false,
      env: {
        NODE_ENV: "production",
        MONGODB_URI: "mongodb://localhost:27017/explorerdb",
        MONGODB_DB: "explorerdb",
        DB_USER: "",
        DB_PASSWORD: "",
        DB_HOST: "",
        RPC_HOST: "127.0.0.1",
        RPC_PORT: "9982",
        RPC_USER: "user",
        RPC_PASS: "p455w0rd",
        SYNC_INTERVAL: "60000"
      },
      max_memory_restart: "1G",
      restart_delay: 10000
    }
  ]
};
