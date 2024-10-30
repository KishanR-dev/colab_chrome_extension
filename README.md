# Colab Static Reviewer

## Description
Colab Static Reviewer is a Chrome extension designed to help users review the format and structure of their Google Colab notebooks. This tool performs static analysis on Colab notebooks, providing insights into language-specific content, naming conventions, and test cases.

- Analyzes the current active Google Colab notebook
- Provides a detailed report in an easy-to-read sidebar

## Features
- Identifies language-specific content
- Checks for the length of the solution block
- Detects snake_case and camelCase usages
- Highlights test cases
- Format the prompt and starter code to ask to GPT or copy to clipboard
- Buttons to open the LLM reviewer and copy the colab id if it has not been reviewed yet
- Translate the Swift code to Python using GPT
- Draft (static code, not GPT) a translation of the Swift tests to Python


## Installation
1. Clone this repository or download the source code
2. Open Chrome and navigate to `chrome://extensions`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the directory containing the extension files

## Usage
1. Navigate to a Google Colab notebook in Chrome
2. Click on the Colab Static Reviewer extension icon in the toolbar
3. The extension will automatically analyze the current notebook and display the results in a popup

## Project Structure
- `manifest.json`: Extension configuration file
- `src/`: Source code directory
  - `sidebar/`: Contains files for the extension sidebar
    - `sidebar.html`: HTML structure for the sidebar
    - `sidebar.js`: JavaScript for sidebar functionality
    - `sidebar.css`: Styles for the sidebar
  - `background/`: Contains background scripts
    - `background.js`: Handles the main analysis logic
  - `scripts/`: Contains content scripts
    - `read_cells.js`: Extracts cell content from the Colab notebook

## Development
To modify or extend the extension:
1. Make changes to the relevant files in the `src/` directory
2. Update the `manifest.json` file if necessary
3. Reload the extension in Chrome to see your changes

## Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

## License
This project is licensed under the MIT License.
