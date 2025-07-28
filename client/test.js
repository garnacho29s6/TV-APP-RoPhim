
function logToScreen(msg, type = 'log') {
    const area = document.getElementById('logArea');
    const line = document.createElement('div');
    line.style.color = type === 'error' ? 'red' : (type === 'warn' ? 'orange' : 'white');
    line.textContent = `[${type}] ${msg}`;
    area.appendChild(line);
}

['log', 'warn', 'error', 'info'].forEach(function(method) {
    const original = console[method];
    console[method] = function(...args) {
        original.apply(console, args); // vẫn log như bình thường
        logToScreen(args.join(' '), method); // log ra UI
    };
    });
window.onerror = function(message, source, lineno, colno, error) {
    logToScreen(`JS Error: ${message} at ${source}:${lineno}:${colno}`, 'error');
};