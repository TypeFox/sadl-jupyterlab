#!/bin/bash
export CONDA_DIR=$1
export PATH=$CONDA_DIR/bin:$PATH
echo $PATH

npm run build:jupyterlab \
&& npm install \
&& npm run clean \
&& npm run build \
&& npm run build:serverextension \
&& npm run test \
&& python setup.py sdist
