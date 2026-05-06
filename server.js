const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// ሁሉንም ፋይሎች ካሉበት እንዲያነብ ያደርጋል
app.use(express.static(__dirname));

// ዋናውን ገጽ እንዲከፍት ያደርጋል
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
