function replaceSandboxPathsWithBase64(content, readFile) {
    const regex = /\(sandbox:([^\)]+)\)/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
        let path = match[1];
        let { data, mimeType } = readFile(path, "base64");
        content = content.replace(`sandbox:${path}`, `data:${mimeType};base64,${data}`);
    }
    return content;
}

function exportAsJuptyerNotebook(messages, { readFile, parseToolsHistory }) {
    const cells = [];
    let index = 0;
    for (let message of messages) {
        if (message.role === "user" && message.content) {
            cells.push({
                "cell_type": "markdown",
                "metadata": {},
                "source": message.content,
            });
        }
        if (message.role === "assistant" && message.content) {
            const toolsHistory = parseToolsHistory(messages, index);
            console.log(toolsHistory);

            for (let tool of toolsHistory) {
                if (tool.error) {
                    continue;
                }

                let cell = {
                    "cell_type": "code",
                    "execution_count": 1,
                    "metadata": {
                        "collapsed": true,
                        "autoscroll": false
                    },
                    "outputs": [{
                        "name": "stdout",
                        "output_type": "stream",
                        "text": tool.output || ""
                    }],
                    "source": tool.code
                }
                cells.push(cell);
            }

            cells.push({
                "cell_type": "markdown",
                "metadata": {},
                "source": replaceSandboxPathsWithBase64(message.content, readFile),
            });

        }
        index++;
    }

    return cells;
}

export default exportAsJuptyerNotebook;