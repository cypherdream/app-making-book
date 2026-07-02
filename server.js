const express = require('express');
const app = express();
const PORT = 5000;

app.get('/api/status', (req, res) => {
    res.json({ status: "ONLINE", backend: "Node.js Core" });
});

app.listen(PORT, () => {
    console.log(`🚀 SERVER RUNNING ON PORT ${PORT}`);
});
