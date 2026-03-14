const { spawn } = require('child_process');

const key = 'AIzaSyBy2B38Y7zkpoIQmHTunyYL99CNkNRjCAc';

const child = spawn('npx', ['vercel', 'env', 'add', 'VITE_GEMINI_API_KEY', 'production'], {
    shell: true,
    stdio: ['pipe', 'inherit', 'inherit']
});

child.stdin.write(key);
child.stdin.end();

child.on('close', (code) => {
    console.log(`Process exited with code ${code}`);
});
