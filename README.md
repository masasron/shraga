<img src="public/lemon-side.svg" alt="Lemon" width="64">

# Lemon

Today, users must choose between running weaker models locally or sending their data to the cloud. **Lemon** offers a middle ground by enabling users to access state-of-the-art models while keeping their files private. **Lemon** is a front-end web application designed to help users perform data analysis, visualization, and basic programming tasks using Pyodide—a Python runtime for the web—along with large language models (currently supporting ChatGPT).

## Installation Instructions

1. Clone the repository to your local machine.
2. Open a terminal and navigate to the root directory of the cloned repository.
3. Install the necessary dependencies by running:
   ```bash
   npm install
   ```
4. Download the latest version of Pyodide (e.g., `pyodide-x.x.x.tar.bz2`) from the [official Pyodide GitHub releases](https://github.com/pyodide/pyodide/releases).
   - Extract the downloaded file and place its contents into the `public/pyodide` folder of your project.
5. Build and start the application by running:
   ```bash
   npm run build
   npm run start
   ```

Your application should now be up and running.

## Data Privacy & Other Limitations

Lemon does not store any data on the server. All data is processed locally in the user's browser.  
Please note that while Lemon's system prompts are designed to discourage the model from generating Python code that results in sensetive data being sent back to the LLM, it is still possible. **We do not take responsibility for any data leaks that may occur.**

There is also a risk of Lemon getting stuck in an infinite loop, where it generates faulty code, receives errors, and continues resubmitting them to the LLM. We do not take responsibility for any damages caused by such occurrences.
