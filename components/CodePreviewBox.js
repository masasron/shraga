// components/CodePreviewBox.js
import React, { useEffect, useRef, useMemo } from 'react';
import cn from 'utils/cn';
import { oneLight } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { PrismAsyncLight as SyntaxHighlighter } from "react-syntax-highlighter";

const CodePreviewBox = ({ codeContent, isStreaming }) => {
    const containerRef = useRef(null);
    const syntaxHighlighterRef = useRef(null);

    // Memoize the syntax highlighter to prevent unnecessary re-renders
    const memoizedSyntaxHighlighter = useMemo(() => (
        <SyntaxHighlighter
            ref={syntaxHighlighterRef}
            language="python"
            style={oneLight}
            className="text-sm"
            customStyle={{
                margin: 0,
                background: 'transparent',
                fontSize: '0.875rem' // text-sm equivalent
            }}
            codeTagProps={{
                style: {
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", monospace'
                }
            }}
            PreTag={({ children, ...props }) => (
                <pre {...props} style={{ margin: 0, padding: 0 }}>
                    {children}
                </pre>
            )}
        >
            {codeContent}
        </SyntaxHighlighter>
    ), [codeContent]);

    useEffect(() => {
        if (!containerRef.current) return;

        const scrollToBottom = () => {
            // Use requestAnimationFrame to ensure DOM has updated
            requestAnimationFrame(() => {
                if (containerRef.current) {
                    containerRef.current.scrollTop = containerRef.current.scrollHeight;
                }
            });
        };

        // Initial scroll
        scrollToBottom();

        // If streaming, set up a small delay to handle rapid updates
        if (isStreaming) {
            const timeoutId = setTimeout(scrollToBottom, 50);
            return () => clearTimeout(timeoutId);
        }
    }, [codeContent, isStreaming]);

    // Alternative approach: Use intersection observer to smooth scroll behavior
    useEffect(() => {
        if (!isStreaming || !containerRef.current) return;

        const container = containerRef.current;
        let isUserScrolling = false;
        let scrollTimeout;

        const handleScroll = () => {
            isUserScrolling = true;
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                isUserScrolling = false;
            }, 150);
        };

        const scrollToBottomSmooth = () => {
            if (!isUserScrolling && container) {
                const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 50;
                if (isNearBottom || container.scrollTop === 0) {
                    container.scrollTop = container.scrollHeight;
                }
            }
        };

        container.addEventListener('scroll', handleScroll, { passive: true });

        // Use MutationObserver to detect content changes
        const observer = new MutationObserver(scrollToBottomSmooth);
        observer.observe(container, {
            childList: true,
            subtree: true,
            characterData: true
        });

        return () => {
            container.removeEventListener('scroll', handleScroll);
            observer.disconnect();
            clearTimeout(scrollTimeout);
        };
    }, [isStreaming]);

    return (
        <div
            className="relative h-[200px] rounded-md bg-gray-50 overflow-hidden">
            <div
                ref={containerRef}
                className="absolute p-3 inset-0 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
                style={{
                    scrollBehavior: isStreaming ? 'auto' : 'smooth'
                }}
            >
                {memoizedSyntaxHighlighter}
                {isStreaming && (
                    <div className="sticky bottom-0 right-0 flex justify-end p-2">
                        <span className="animate-pulse bg-gray-100 px-2 py-1 rounded text-xs text-gray-500">
                            ...
                        </span>
                    </div>
                )}
            </div>

            {/* Gradient overlays */}
            <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-gray-50 via-gray-50/80 to-transparent pointer-events-none z-10" />
            <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-gray-50 via-gray-50/80 to-transparent pointer-events-none z-10" />
        </div>
    );
};

export default CodePreviewBox;