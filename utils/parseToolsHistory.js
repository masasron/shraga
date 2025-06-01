export default function parseToolsHistory(messages, messageIndex) {
    const history = [];

    // find the closes previos message with role "user"
    let userMessageIndex = messageIndex - 1;
    while (userMessageIndex >= 0 && messages[userMessageIndex].role !== "user") {
        userMessageIndex--;
    }

    // go over each message after messageIndex and check if it matches one of the following:
    // 1. role == "assistant" and has tool_calls property.
    // 2. role == "tool"
    for (let i = userMessageIndex + 1; i < messageIndex; i++) {
        let message = messages[i];
        if ((message.role === "assistant" && message.tool_calls) || message.role === "tool") {
            if (message.role === "assistant") {
                for (let call of message.tool_calls) {
                    if (!call.function) {
                        continue;
                    }

                    let args = {};
                    if (call.function.arguments) {
                        args = JSON.parse(call.function.arguments);
                    }

                    switch (call.function.name) {
                        case "run_python":
                            console.log(">>>>> push python");
                            history.push({
                                function: call.function.name,
                                id: call.id,
                                code: args.code
                            });
                            break;
                        case "micropip_install":
                            console.log(">>>> push micropip_install");
                            history.push({
                                function: call.function.name,
                                id: call.id,
                                code: `await micropip.install("${args.name}")`
                            });
                            break;
                    }
                }
            }

            if (message.role === "tool" && message.tool_call_id) {
                let msg = history.find(item => item.id === message.tool_call_id);
                if (msg) {
                    msg.output = message.content || "";
                    if (msg.output.indexOf("PythonError:") !== -1) {
                        msg.error = true;
                    }
                    if (!msg.error && msg.function === "micropip_install") {
                        msg.output = "";
                    }
                }
            }
        } else {
            break;
        }
    }

    return history;
}