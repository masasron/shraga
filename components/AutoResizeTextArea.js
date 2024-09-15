import React, { useRef, useEffect } from "react";

function AutoResizedTextarea(props) {
    const textareaRef = useRef(null);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.focus();
            handleResize();
        }

        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    useEffect(handleResize, [props.value]);

    function handleResize() {
        const textarea = textareaRef.current;
        if (textarea) {
            let isFirstLine = textarea.value.split("\n").length === 1;
            let offset = (textarea.offsetHeight - textarea.clientHeight);
            let textApproxWidth = textarea.value.length * 8;
            let textOverflow = textarea.scrollWidth < textApproxWidth;
            if (isFirstLine && !textOverflow) {
                offset += 24;
            }
            textarea.style.height = "auto";
            textarea.style.height = (textarea.scrollHeight - offset) + "px";
        }
    }

    return (
        <textarea
            value={props.value}
            onChange={props.onChange}
            ref={textareaRef}
            onInput={handleResize}
            onKeyDown={props.onKeyDown}
            autoCorrect="off"
            placeholder={props.placeholder || ""}
            className={props.className || ""}
            autoComplete={props.autoComplete || ""}
            style={{ overflow: 'hidden', resize: 'none', boxSizing: 'border-box' }}
        />
    );
}

export default AutoResizedTextarea;