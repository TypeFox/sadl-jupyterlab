# SADL Jupyter Extension

## Getting started

### Prerequisites

- [Jupyter notebook](http://jupyter.readthedocs.io/en/latest/install.html) version 4.2 or later
- NodeJS (preferably version 5 or later) and npm

**[Node Version Manager](https://github.com/creationix/nvm)**

Install nvm to manage Node.js versions:

```bash
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.31.3/install.sh | bash
```

Verify nvm:

```bash
command -v nvm
```

Install [Node.js](https://nodejs.org/en/) and [npm](https://www.npmjs.com/):

```bash
nvm install 6
```

On some machines you need to do:

```
export NVM_DIR=~/.nvm
source ~/.nvm/nvm.sh
nvm install 6
```



Verify Node.js and npm:

```bash
node --version
npm --version
```

### Building our jupyterlab fork

In order to have that state locally you need to check it out and run: 

```bash
nvm install 6
npm install
npm run build:all
```

### Installation

Download dependencies:

```bash
npm install
```

Update the local jupyterlab fork:

```bash
npm run update:jupyterlab
````

Build:

```bash
npm run build:all
```

Clean build:

```bash
npm run clean
npm run build:all
```

Incremental build:

```bash
npm run watch
```

### Install SADL Web Extension

```bash
pip install sadl_web
pip install -e .

jupyter serverextension enable --py sadl_web
```

### Run SADL Jupyter Extension

```
jupyter sadl --debug --notebook-dir=/path/to/project/directory
```

### Uninstall RIDE Jupyter Extension

```bash
jupyter serverextension disable --py sadl_web

pip uninstall sadl_web
```

## High level Architecture

The application consist of the following packages:
- sadl-client - RIDE plugins: about, language server editor, etc.;
- sadl_web - RIDE Jupyter Extension which is combination of JupyterLab and RIDE plugins.

During the build first RIDE plugins are compiled and then the RIDE Jupyter Extension.



