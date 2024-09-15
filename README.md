<img src="public/lemon-side.svg" alt="Lemon" width="64">

# Lemon

**Lemon** is a front-end web application designed to help users perform data analysis, visualization, and basic programming tasks using Pyodide—a Python runtime for the web—along with large language models (currently supporting ChatGPT).

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
