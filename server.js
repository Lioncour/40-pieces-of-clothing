const chokidar = require('chokidar');
const path = require('path');

// Watch the images directory
const watcher = chokidar.watch('images/', {
    ignored: /(^|[\/\\])\../,
    persistent: true
});

// Handle new images
watcher.on('add', async path => {
    if (path.match(/\.(jpg|jpeg|png)$/i)) {
        await handleNewImage(path);
    }
}); 