// components/CodePreviewBox.js
import React, { useEffect, useRef } from 'react';
import cn from 'utils/cn'; // Assuming you have a utility for class names

const CodePreviewBox = ({ codeContent, isStreaming }) => {
    const scrollRef = useRef(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [codeContent]);

    return (
        <div
            className={cn(
                "relative h-[200px] border border-gray-300 rounded-md p-2 bg-gray-50 overflow-hidden", // Added overflow-hidden for pseudo-elements
            )}
        >
            <div
                ref={scrollRef}
                className="absolute inset-0 overflow-y-auto p-2" // Inner div for scrolling, pseudo-elements apply to parent
            >
                <pre className="text-sm"><code className="language-python whitespace-pre-wrap">{codeContent}</code></pre>
                {isStreaming && <span className="animate-pulse">...</span>}
            </div>
            {/* Top blur */}
            <div className="absolute top-0 left-0 right-0 h-5 bg-gradient-to-b from-gray-50 via-gray-50/70 to-transparent pointer-events-none" />
            {/* Bottom blur */}
            <div className="absolute bottom-0 left-0 right-0 h-5 bg-gradient-to-t from-gray-50 via-gray-50/70 to-transparent pointer-events-none" />
        </div>
    );
};

export default CodePreviewBox;
