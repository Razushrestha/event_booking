module.exports = {
  apps: [
    {
      name: "event-booking-api",
      cwd: "./backend",
      script: "index.js",
      instances: 1,
      autorestart: true,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
