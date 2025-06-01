import React from 'react';
import { render, fireEvent, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import UserSettings from './UserSettings';
import GlobalContext from '../GlobalContext';
import { MODELS as actualModels } from '../utils/common'; // Using actual models for default check

// Mock GlobalContext
const mockSetUserSettings = jest.fn();
let mockUserSettings; // Allow this to be reset per test

// Mock MODELS from utils/common for specific filtering tests
const mockAvailableModels = [
  { name: "GPT-4o mini", value: "gpt-4o-mini", provider: "openai" },
  { name: "GPT-4", value: "gpt-4", provider: "openai" },
  { name: "Gemini Pro", value: "gemini-pro", provider: "gemini" },
  { name: "Gemini Flash", value: "gemini-flash", provider: "gemini" },
  { name: "Another OpenAI", value: "another-openai", provider: "openai" },
];

jest.mock('../utils/common', () => {
  const originalModule = jest.requireActual('../utils/common');
  return {
    ...originalModule,
    MODELS: mockAvailableModels, // Use the mock for tests
  };
});

const renderComponentWithContext = (settings) => {
  return render(
    <GlobalContext.Provider value={{ userSettings: settings, setUserSettings: mockSetUserSettings }}>
      <UserSettings />
    </GlobalContext.Provider>
  );
};

describe('<UserSettings />', () => {
  beforeEach(() => {
    // Reset mocks for each test
    mockSetUserSettings.mockClear();
    mockUserSettings = { // Default settings for each test
      name: 'Test User',
      provider: 'openai',
      openai_api_key: 'sk-123',
      gemini_api_key: '',
      model: 'gpt-4o-mini', // Default to an OpenAI model
    };
  });

  it('renders with initial settings from GlobalContext', () => {
    renderComponentWithContext(mockUserSettings);
    expect(screen.getByLabelText('Name').value).toBe('Test User');
    expect(screen.getByLabelText('LLM Provider').value).toBe('openai');
    expect(screen.getByLabelText('OpenAI API Key').value).toBe('sk-123');
    expect(screen.getByLabelText('Model').value).toBe('gpt-4o-mini');
  });

  it('shows OpenAI API key input by default when provider is openai', () => {
    renderComponentWithContext(mockUserSettings);
    expect(screen.getByLabelText('OpenAI API Key')).toBeInTheDocument();
    expect(screen.queryByLabelText('Gemini API Key')).not.toBeInTheDocument();
  });

  it('changes API key input when provider is switched to Gemini', () => {
    renderComponentWithContext(mockUserSettings);
    const providerDropdown = screen.getByLabelText('LLM Provider');
    fireEvent.change(providerDropdown, { target: { value: 'gemini' } });

    expect(screen.getByLabelText('Gemini API Key')).toBeInTheDocument();
    expect(screen.queryByLabelText('OpenAI API Key')).not.toBeInTheDocument();
  });

  it('updates userSettings in context when name is changed', () => {
    renderComponentWithContext(mockUserSettings);
    const nameInput = screen.getByLabelText('Name');
    fireEvent.change(nameInput, { target: { value: 'New Name' } });

    expect(mockSetUserSettings).toHaveBeenCalledWith(expect.objectContaining({ name: 'New Name' }));
  });

  it('updates userSettings and API key when OpenAI API key is changed', () => {
    renderComponentWithContext(mockUserSettings);
    const apiKeyInput = screen.getByLabelText('OpenAI API Key');
    fireEvent.change(apiKeyInput, { target: { value: 'sk-newkey' } });

    expect(mockSetUserSettings).toHaveBeenCalledWith(expect.objectContaining({ openai_api_key: 'sk-newkey' }));
  });

  it('updates userSettings and API key when Gemini API key is changed', () => {
    mockUserSettings.provider = 'gemini'; // Start with Gemini provider
    mockUserSettings.model = 'gemini-pro';
    renderComponentWithContext(mockUserSettings);

    const providerDropdown = screen.getByLabelText('LLM Provider');
    fireEvent.change(providerDropdown, { target: { value: 'gemini' } }); // Ensure Gemini is selected

    const apiKeyInput = screen.getByLabelText('Gemini API Key');
    fireEvent.change(apiKeyInput, { target: { value: 'gemini-newkey' } });

    expect(mockSetUserSettings).toHaveBeenCalledWith(expect.objectContaining({ gemini_api_key: 'gemini-newkey' }));
  });

  it('filters model dropdown based on selected provider (OpenAI)', () => {
    renderComponentWithContext(mockUserSettings); // provider is 'openai'
    const modelDropdown = screen.getByLabelText('Model');
    const options = within(modelDropdown).getAllByRole('option');

    const openAIModelsInMock = mockAvailableModels.filter(m => (m.provider || 'openai') === 'openai');
    expect(options.length).toBe(openAIModelsInMock.length);
    options.forEach(option => {
      expect(openAIModelsInMock.some(m => m.value === option.value)).toBe(true);
    });
    expect(within(modelDropdown).queryByText('Gemini Pro')).not.toBeInTheDocument();
  });

  it('filters model dropdown based on selected provider (Gemini) and updates model', () => {
    renderComponentWithContext(mockUserSettings);
    const providerDropdown = screen.getByLabelText('LLM Provider');
    fireEvent.change(providerDropdown, { target: { value: 'gemini' } });

    // Check if setUserSettings was called to update the model to the first available Gemini model
    const defaultGeminiModel = mockAvailableModels.find(m => m.provider === 'gemini');
    expect(mockSetUserSettings).toHaveBeenCalledWith(expect.objectContaining({ provider: 'gemini', model: defaultGeminiModel.value }));

    // Update the context mock to reflect the change for further assertions if needed for the dropdown itself
     mockUserSettings.provider = 'gemini';
     mockUserSettings.model = defaultGeminiModel.value;
     renderComponentWithContext(mockUserSettings); // Re-render with updated context for dropdown check

    const modelDropdown = screen.getByLabelText('Model');
    const options = within(modelDropdown).getAllByRole('option');
    const geminiModelsInMock = mockAvailableModels.filter(m => m.provider === 'gemini');

    expect(options.length).toBe(geminiModelsInMock.length);
    options.forEach(option => {
      expect(geminiModelsInMock.some(m => m.value === option.value)).toBe(true);
    });
    expect(within(modelDropdown).queryByText('GPT-4o mini')).not.toBeInTheDocument();
  });

   it('initializes with gemini provider and key if specified in userSettings', () => {
    mockUserSettings = {
      name: 'Gemini User',
      provider: 'gemini',
      openai_api_key: '',
      gemini_api_key: 'gemini-abc',
      model: 'gemini-pro',
    };
    renderComponentWithContext(mockUserSettings);

    expect(screen.getByLabelText('LLM Provider').value).toBe('gemini');
    expect(screen.getByLabelText('Gemini API Key').value).toBe('gemini-abc');
    expect(screen.queryByLabelText('OpenAI API Key')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Model').value).toBe('gemini-pro');
  });

});
