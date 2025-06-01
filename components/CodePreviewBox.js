// components/CodePreviewBox.js
import React, { useEffect, useRef } from 'react';
import { PrismAsyncLight as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight } from "react-syntax-highlighter/dist/cjs/styles/prism"; // Using cjs path as specified
import cn from 'utils/cn';

const CodePreviewBox = ({ codeContent, isStreaming }) => {
    const scrollRef = useRef(null);

    useEffect(() => {
        if (scrollRef.current) {
            // When using SyntaxHighlighter, the actual scrollable element might be different.
            // It often wraps content in a <pre> then <code>.
            // We might need to adjust scrollRef to target the inner <pre> if SyntaxHighlighter doesn't expose it directly,
            // or ensure the div with scrollRef can scroll its SyntaxHighlighter child.
            // For now, let's assume SyntaxHighlighter itself or its direct output is scrollable within the div.
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [codeContent]);

    return (
        <div
            className={cn(
                "relative h-[200px] border border-gray-300 rounded-md bg-gray-50 overflow-hidden",
                // Removed p-2 from parent, will be handled by SyntaxHighlighter or its container if needed
            )}
        >
            <div
                ref={scrollRef}
                className="absolute inset-0 overflow-y-auto" // Removed p-2, SyntaxHighlighter will have its own padding or can be styled
            >
                <SyntaxHighlighter
                    language="python"
                    style={oneLight}
                    className="text-sm h-full" // Ensure it fills height for scrolling, and apply text-sm
                    customStyle={{ margin: 0, padding: "0.5rem" }} // Remove default margin, add padding
                    codeTagProps={{ style: { whiteSpace: 'pre-wrap', fontFamily: 'monospace' } }} // Ensure pre-wrap and monospace font
                >
                    {codeContent}
                </SyntaxHighlighter>
                {isStreaming && <span className="animate-pulse absolute bottom-2 right-2">...</span>}
                {/* Moved streaming indicator to be absolutely positioned within the main div */}
            </div>
            {/* Top blur */}
            <div className="absolute top-0 left-0 right-0 h-5 bg-gradient-to-b from-gray-50 via-gray-50/70 to-transparent pointer-events-none z-10" />
            {/* Bottom blur */}
            <div className="absolute bottom-0 left-0 right-0 h-5 bg-gradient-to-t from-gray-50 via-gray-50/70 to-transparent pointer-events-none z-10" />
        </div>
    );
};

export default CodePreviewBox;
