import LLMStreamingHandler from './LLMStreamingHandler';

// Helper to pause execution for a short time
const tick = () => new Promise(resolve => setTimeout(resolve, 0));

describe('LLMStreamingHandler', () => {
  let mockOnMessage;
  let mockRunTool;
  let mockSetStreamedMessage;
  let mockSetLoading;
  let mockSource; // For OpenAI (EventSource-like)
  let mockStream; // For Gemini (AsyncIterable)

  // Mock for window event listeners related to tool calls
  let eventListeners = {};
  let mockDispatchEvent;

  beforeEach(() => {
    mockOnMessage = jest.fn();
    mockRunTool = jest.fn(async (toolName, args) => {
      return `Result from ${toolName} with args: ${JSON.stringify(args)}`;
    });
    // mockSetStreamedMessage = jest.fn();
    // Let's make setStreamedMessage behave more like React's setState
    let currentStreamedMessage = "";
    mockSetStreamedMessage = jest.fn(updater => {
      if (typeof updater === 'function') {
        currentStreamedMessage = updater(currentStreamedMessage);
      } else {
        currentStreamedMessage = updater;
      }
    });

    mockSetLoading = jest.fn();

    // Mock window.dispatchEvent for tool call events
    eventListeners = {}; // Reset listeners for each test
    mockDispatchEvent = jest.spyOn(window, 'dispatchEvent').mockImplementation(event => {
      if (eventListeners[event.type]) {
        eventListeners[event.type].forEach(listener => listener(event));
      }
      return true;
    });

    // Reset toolCallIdCounter - this is tricky as it's module-scoped and not directly resettable.
    // Tests will need to be mindful of this or we assume it starts fresh enough for isolated tests.
    // For true isolation, the module would need a reset function or the counter passed in.
  });

  afterEach(() => {
    mockDispatchEvent.mockRestore();
     // Clean up any global event listeners for "stop-stream" if added by the handler
    // This might require a more specific way to access and remove the listener added by the handler
    // For now, we assume tests clean up after themselves or the environment handles it.
  });


  describe('OpenAI Provider', () => {
    beforeEach(() => {
      mockSource = {
        listeners: {},
        addEventListener: jest.fn((event, listener) => {
          if (!mockSource.listeners[event]) mockSource.listeners[event] = [];
          mockSource.listeners[event].push(listener);
        }),
        removeEventListener: jest.fn((event, listener) => {
          if (mockSource.listeners[event]) {
            mockSource.listeners[event] = mockSource.listeners[event].filter(l => l !== listener);
          }
        }),
        close: jest.fn(() => {
            // Simulate readystatechange to CLOSED when close is called
            if (mockSource.listeners["readystatechange"]) {
                mockSource.listeners["readystatechange"].forEach(fn => fn({ readyState: EventSource.CLOSED }));
            }
        }),
        readyState: 0, // EventSource.CONNECTING
        stream: jest.fn(), // Mock the stream() method if called
      };
    });

    test('handles text streaming correctly', async () => {
      LLMStreamingHandler(mockSource, mockOnMessage, mockRunTool, mockSetStreamedMessage, mockSetLoading, 'openai');

      mockSource.listeners['message'].forEach(fn => fn({ data: JSON.stringify({ choices: [{ delta: { content: 'Hello' } }] }) }));
      await tick();
      expect(mockSetStreamedMessage).toHaveBeenCalledTimes(1); // Called once with updater

      mockSource.listeners['message'].forEach(fn => fn({ data: JSON.stringify({ choices: [{ delta: { content: ' World' } }] }) }));
      await tick();
      expect(mockSetStreamedMessage).toHaveBeenCalledTimes(2);

      // Simulate stream end
      mockSource.listeners['message'].forEach(fn => fn({ data: '[DONE]' }));
      await tick();

      expect(mockOnMessage).toHaveBeenCalledWith({ role: 'assistant', content: 'Hello World' });
      expect(mockSetLoading).toHaveBeenCalledWith(false);
      expect(mockSource.close).toHaveBeenCalled();
    });

    test('handles tool calls correctly', async () => {
      LLMStreamingHandler(mockSource, mockOnMessage, mockRunTool, mockSetStreamedMessage, mockSetLoading, 'openai');

      // Tool call part 1 (ID and function name)
      mockSource.listeners['message'].forEach(fn => fn({ data: JSON.stringify({ choices: [{ delta: { tool_calls: [{ id: 'call_123', type: 'function', function: { name: 'get_weather', arguments: '' } }] } }] }) }));
      await tick();

      // Tool call part 2 (arguments)
      mockSource.listeners['message'].forEach(fn => fn({ data: JSON.stringify({ choices: [{ delta: { tool_calls: [{ index: 0, function: { arguments: '{"location":"Testville"}' } }] } }] }) }));
      await tick();

      // Text after tool call
      mockSource.listeners['message'].forEach(fn => fn({ data: JSON.stringify({ choices: [{ delta: { content: 'Here is the weather:' } }] }) }));
      await tick();

      mockSource.listeners['message'].forEach(fn => fn({ data: '[DONE]' }));
      await tick();

      expect(mockOnMessage).toHaveBeenCalledWith(expect.objectContaining({
        role: 'assistant',
        content: 'Here is the weather:',
        tool_calls: expect.arrayContaining([
          expect.objectContaining({ id: 'call_123', function: { name: 'get_weather', arguments: '{"location":"Testville"}' } })
        ])
      }));

      // Wait for tool execution
      await tick(); // Allow promises from async tool call processing to resolve

      expect(mockRunTool).toHaveBeenCalledWith('get_weather', { location: 'Testville' });
      expect(mockOnMessage).toHaveBeenCalledWith(
        { role: 'tool', content: 'Result from get_weather with args: {"location":"Testville"}', tool_call_id: 'call_123' },
        true // isLast
      );
      expect(mockSetLoading).toHaveBeenCalledWith(false);
    });

    test('handles stream stop via EventSource close and readystatechange', async () => {
      LLMStreamingHandler(mockSource, mockOnMessage, mockRunTool, mockSetStreamedMessage, mockSetLoading, 'openai');
      mockSource.listeners['message'].forEach(fn => fn({ data: JSON.stringify({ choices: [{ delta: { content: 'Partial ' } }] }) }));
      await tick();

      // Simulate manual stop or abrupt close
      if (mockSource.listeners["readystatechange"]) {
        mockSource.listeners["readystatechange"].forEach(fn => fn({ readyState: EventSource.CLOSED }));
      }
      await tick();

      expect(mockSetLoading).toHaveBeenCalledWith(false);
      // Check if onMessage was called with the partial content
      expect(mockOnMessage).toHaveBeenCalledWith({ role: 'assistant', content: 'Partial ' });
      // Check if tool calls were processed if any (none in this specific test)
      expect(mockRunTool).not.toHaveBeenCalled();
    });

    test('handles error event from EventSource', async () => {
      LLMStreamingHandler(mockSource, mockOnMessage, mockRunTool, mockSetStreamedMessage, mockSetLoading, 'openai');

      const errorEvent = new Event('error');
      mockSource.listeners['error'].forEach(fn => fn(errorEvent));
      await tick();

      expect(mockSetLoading).toHaveBeenCalledWith(false);
      expect(mockSetStreamedMessage).toHaveBeenCalledWith(""); // Clears message
      expect(mockOnMessage).toHaveBeenCalledWith({
        role: "assistant",
        error: true,
        content: "An error occurred while streaming OpenAI response."
      });
      // Ensure stop-stream listener is removed (if possible to check)
    });
  });

  describe('Gemini Provider', () => {
    async function* generateMockGeminiStream(chunks) {
      for (const chunk of chunks) {
        await tick(); // Simulate async delay
        yield chunk;
      }
    }

    test('handles text streaming correctly', async () => {
      const chunks = [
        { candidates: [{ content: { parts: [{ text: 'Hello' }] } }] },
        { candidates: [{ content: { parts: [{ text: ' Gemini' }] } }] },
        { candidates: [{ finishReason: 'STOP', content: { parts: [{text: '!'}] } }] } // Includes final text part
      ];
      mockStream = generateMockGeminiStream(chunks);
      LLMStreamingHandler(mockStream, mockOnMessage, mockRunTool, mockSetStreamedMessage, mockSetLoading, 'gemini');

      await tick(); // Initial tick for setup
      await tick(); // Process first chunk
      await tick(); // Process second chunk
      await tick(); // Process third chunk (finish)
      await tick(); // Allow post-loop processing

      expect(mockSetStreamedMessage).toHaveBeenCalledTimes(chunks.length); // Once per text chunk
      expect(mockOnMessage).toHaveBeenCalledWith({ role: 'assistant', content: 'Hello Gemini!' });
      expect(mockSetLoading).toHaveBeenCalledWith(false);
    });

    test('handles tool calls correctly', async () => {
      const chunks = [
        { candidates: [{ content: { parts: [{ functionCall: { name: 'search_web', args: { query: 'tests' } } }] } }] },
        { candidates: [{ content: { parts: [{ text: 'Search results:' }] } }] }, // Text after tool call
        { candidates: [{ finishReason: 'STOP' }] }
      ];
      mockStream = generateMockGeminiStream(chunks);
      LLMStreamingHandler(mockStream, mockOnMessage, mockRunTool, mockSetStreamedMessage, mockSetLoading, 'gemini');

      await tick(); // setup
      await tick(); // chunk 1 (tool call)
      await tick(); // chunk 2 (text)
      await tick(); // chunk 3 (finish)
      await tick(); // post-loop processing

      expect(mockOnMessage).toHaveBeenCalledWith(expect.objectContaining({
        role: 'assistant',
        content: 'Search results:', // Content should be accumulated
        tool_calls: expect.arrayContaining([
          expect.objectContaining({
            id: expect.stringMatching(/^call_\d+_\d+$/), // Check for generated ID format
            function: { name: 'search_web', arguments: '{"query":"tests"}' }
          })
        ])
      }));

      await tick(); // Allow tool processing

      expect(mockRunTool).toHaveBeenCalledWith('search_web', { query: 'tests' });
      expect(mockOnMessage).toHaveBeenCalledWith(
        expect.objectContaining({
            role: 'tool',
            content: 'Result from search_web with args: {"query":"tests"}',
            tool_call_id: expect.stringMatching(/^call_\d+_\d+$/)
        }),
        true // isLast
      );
      expect(mockSetLoading).toHaveBeenCalledWith(false);
    });

    test('handles stream ending due to iterable completion', async () => {
      const chunks = [
        { candidates: [{ content: { parts: [{ text: 'Final message.' }] } }] }
        // No explicit finishReason, stream just ends
      ];
      mockStream = generateMockGeminiStream(chunks);
      LLMStreamingHandler(mockStream, mockOnMessage, mockRunTool, mockSetStreamedMessage, mockSetLoading, 'gemini');

      await tick(); // Setup
      await tick(); // Process chunk
      await tick(); // Post-loop

      expect(mockOnMessage).toHaveBeenCalledWith({ role: 'assistant', content: 'Final message.' });
      expect(mockSetLoading).toHaveBeenCalledWith(false);
    });

    test('handles error during stream iteration', async () => {
      async function* erroringStream() {
        yield { candidates: [{ content: { parts: [{ text: 'Part 1' }] } }] };
        await tick();
        throw new Error("Gemini stream failed");
      }
      mockStream = erroringStream();
      LLMStreamingHandler(mockStream, mockOnMessage, mockRunTool, mockSetStreamedMessage, mockSetLoading, 'gemini');

      await tick(); // Setup
      await tick(); // Process first chunk
      await tick(); // Error occurs and is handled

      expect(mockSetLoading).toHaveBeenCalledWith(false);
      expect(mockOnMessage).toHaveBeenCalledWith({
        role: "assistant",
        error: true,
        content: "An error occurred with the Gemini stream: Error: Gemini stream failed"
      });
      // Check that message was not finalized with partial content if error occurred.
      // The current mockSetStreamedMessage accumulates, so this test relies on onMessage content.
    });
  });
});
