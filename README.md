# sadl-jupyterlab
SADL web client based on JupyterLab

# Prerequisites

This sadl jlab version is built against https://github.com/R-Brain/jupyterlab/tree/monaco-code-editor

It needs to be checked out next to this repository

See also https://github.com/TypeFox/sadl-jupyterlab/blob/master/sadl-client/README.md

# TL;DR

Single script that pulls the sources from the repositories and builds both the language server and the Jupyterlab component with Monaco editor.

```
mkdir build_sadl_docker \
&& cd build_sadl_docker/ \
&& git clone https://github.com/crapo/sadlos2.git \
&& cd sadlos2/ \
&& git checkout remotes/origin/xtext_web_prototype \
&& cd .. \
&& git clone https://github.com/TypeFox/sadl-jupyterlab.git \
&& git clone https://github.com/eclipse/xtext-core.git \
&& git clone https://github.com/R-Brain/jupyterlab.git \
&& cd jupyterlab/ \
&& cd ../xtext-core/ \
&& ./gradlew install \
&& cd ../sadlos2/sadl3/com.ge.research.sadl.parent/ \
&& ./gradlew buildStandaloneTomcat -PuseLocalMaven \
&& cp ./io.typefox.lsp.monaco/build/tomcat.tar.gz ../deployment/ \
&& cd ../../../jupyterlab/ \
&& npm install \
&& npm run build:all \
&& cd ../sadl-jupyterlab/sadl-client/ \
&& npm install \
&& npm run update:jupyterlab \
&& npm install \
&& npm run build:all \
&& pip install -e . \
&& jupyter serverextension enable --py sadl_web \
&& python setup.py sdist \
&& cp ./dist/sadl_web-0.0.1.tar.gz ../../sadlos2/sadl3/deployment/sadl_web-0.0.1.tar.gz \
&& cd ../../sadlos2/sadl3/deployment/ \
&& docker build --rm=true -t typefox/websadl . \
&& docker run -p 8080:8080 -p 8888:8888 typefox/websadl
```

